"""
Usage limit middleware for free tier and plan enforcement
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import text
import structlog

from app.database import get_db
from app.models import User

logger = structlog.get_logger(__name__)


async def enforce_usage_limits(request: Request, call_next):
    """
    Enforce usage limits on /api/v1/protect endpoint
    - Free users: 5 lifetime uses
    - Paid users: monthly debate limits
    """
    if request.url.path != "/api/v1/protect" or request.method != "POST":
        return await call_next(request)
    
    # Skip if no auth header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return await call_next(request)
    
    # Get user from token (simplified - real impl would decode JWT)
    try:
        from app.api.deps import get_current_user
        db: Session = next(get_db())
        
        # Extract user from request state if already set by auth middleware
        user = getattr(request.state, "user", None)
        
        if not user:
            return await call_next(request)
        
        # Check monthly reset
        if user.monthly_reset_at and user.monthly_reset_at < datetime.utcnow():
            user.monthly_debate_count = 0
            user.monthly_reset_at = datetime.utcnow() + timedelta(days=30)
            db.commit()
        
        # Free tier enforcement
        if user.plan_code == 'free':
            if user.free_uses_used >= user.free_uses_limit:
                return JSONResponse(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    content={
                        "detail": "Free uses exhausted. Upgrade to continue.",
                        "free_uses_used": user.free_uses_used,
                        "free_uses_limit": user.free_uses_limit,
                        "upgrade_url": "/pricing"
                    }
                )
            
            # Increment free uses
            user.free_uses_used += 1
            db.commit()
        
        # Paid tier enforcement
        else:
            # Get plan limits
            result = db.execute(text("""
                SELECT monthly_debate_limit FROM plans WHERE code = :code
            """), {"code": user.plan_code})
            plan = result.fetchone()
            
            if plan and plan.monthly_debate_limit > 0:
                if user.monthly_debate_count >= plan.monthly_debate_limit:
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "detail": "Monthly debate limit reached",
                            "used": user.monthly_debate_count,
                            "limit": plan.monthly_debate_limit,
                            "resets_at": user.monthly_reset_at.isoformat() if user.monthly_reset_at else None
                        }
                    )
                
                # Warn at 80%
                if user.monthly_debate_count >= 0.8 * plan.monthly_debate_limit:
                    request.state.usage_warning = "80%"
                
                # Increment debate count
                user.monthly_debate_count += 1
                db.commit()
        
        # Log usage
        db.execute(text("""
            INSERT INTO usage_logs (user_id, endpoint, debates, tokens, cost_usd)
            VALUES (:user_id, '/api/v1/protect', 1, 0, 0.0001)
        """), {"user_id": str(user.id)})
        db.commit()
        
        response = await call_next(request)
        
        # Add usage warning header if needed
        if hasattr(request.state, "usage_warning"):
            response.headers["X-Usage-Warning"] = request.state.usage_warning
        
        return response
        
    except Exception as e:
        logger.error("Usage limit middleware error", exc_info=e)
        return await call_next(request)

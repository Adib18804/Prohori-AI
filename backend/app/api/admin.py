"""
Admin API endpoints for super_admin and admin users
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, aliased
from sqlalchemy import text, func
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime, timedelta, timezone
import structlog

from app.database import get_db
from app.api.deps import get_current_user
from app.models import User, Incident, AuditEvent
from app.models.models import ProtectedRequest, Verdict

logger = structlog.get_logger(__name__)
router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """Require admin or super_admin role"""
    if current_user.role not in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_super_admin(current_user: User = Depends(get_current_user)):
    """Require super_admin role"""
    if current_user.role != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user


# Schemas
class UserListItem(BaseModel):
    id: str
    email: str
    username: str
    role: str
    plan_code: str
    free_uses_used: int
    free_uses_limit: int
    monthly_debate_count: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    warnings_count: int
    banned_until: Optional[datetime]
    ban_reason: Optional[str]
    total_violations: int


class UserUpdate(BaseModel):
    plan_code: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class PlanCreate(BaseModel):
    code: str
    name: str
    price_usd_cents: int
    monthly_debate_limit: int
    protected_apps_limit: int
    features_json: Dict[str, Any]


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price_usd_cents: Optional[int] = None
    monthly_debate_limit: Optional[int] = None
    protected_apps_limit: Optional[int] = None
    features_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]


class WarnRequest(BaseModel):
    reason: Optional[str] = "Policy violation warning issued by admin."


class BanRequest(BaseModel):
    duration_hours: Optional[int] = None
    permanent: Optional[bool] = False
    reason: Optional[str] = "Banned by administrator."


# User Management
@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    plan: Optional[str] = None,
    is_active: Optional[bool] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users with pagination and filters"""
    query = db.query(User)
    
    if plan:
        query = query.filter(User.plan_code == plan)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if q:
        search = f"%{q}%"
        query = query.filter(
            (User.email.ilike(search)) | (User.username.ilike(search))
        )
    
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": [
            UserListItem(
                id=str(u.id),
                email=u.email,
                username=u.username,
                role=u.role,
                plan_code=getattr(u, 'plan_code', 'free') or 'free',
                free_uses_used=getattr(u, 'free_uses_used', 0) or 0,
                free_uses_limit=getattr(u, 'free_uses_limit', 5) or 5,
                monthly_debate_count=getattr(u, 'monthly_debate_count', 0) or 0,
                is_active=u.is_active,
                created_at=u.created_at,
                last_login=u.last_login,
                warnings_count=getattr(u, 'warnings_count', 0) or 0,
                banned_until=getattr(u, 'banned_until', None),
                ban_reason=getattr(u, 'ban_reason', None),
                total_violations=getattr(u, 'total_violations', 0) or 0,
            ) for u in users
        ]
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get single user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserListItem(
        id=str(user.id),
        email=user.email,
        username=user.username,
        role=user.role,
        plan_code=getattr(user, 'plan_code', 'free') or 'free',
        free_uses_used=getattr(user, 'free_uses_used', 0) or 0,
        free_uses_limit=getattr(user, 'free_uses_limit', 5) or 5,
        monthly_debate_count=getattr(user, 'monthly_debate_count', 0) or 0,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
        warnings_count=getattr(user, 'warnings_count', 0) or 0,
        banned_until=getattr(user, 'banned_until', None),
        ban_reason=getattr(user, 'ban_reason', None),
        total_violations=getattr(user, 'total_violations', 0) or 0,
    )


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    update: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update user (plan change, suspend, role change for super_admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Role change requires super_admin
    if update.role is not None and admin.role != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admin can change roles"
        )
    
    if update.plan_code is not None:
        user.plan_code = update.plan_code
    if update.role is not None:
        user.role = update.role
    if update.is_active is not None:
        user.is_active = update.is_active
    
    db.commit()
    db.refresh(user)
    
    return {"status": "updated", "user_id": str(user.id)}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"status": "deleted", "user_id": user_id}


@router.get("/users/{user_id}/violations")
async def get_user_violations(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get security violations and history for user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    incidents = (
        db.query(Incident)
        .join(ProtectedRequest, Incident.request_id == ProtectedRequest.id)
        .filter(ProtectedRequest.user_id == user.id)
        .order_by(Incident.created_at.desc())
        .limit(20)
        .all()
    )
    
    violations_data = []
    for inc in incidents:
        violations_data.append({
            "id": str(inc.id),
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "status": inc.status,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "actions_taken": inc.actions_taken,
        })
    
    return {
        "user_id": user_id,
        "warnings_count": getattr(user, 'warnings_count', 0) or 0,
        "total_violations": getattr(user, 'total_violations', len(violations_data)) or len(violations_data),
        "banned_until": user.banned_until.isoformat() if getattr(user, 'banned_until', None) else None,
        "ban_reason": getattr(user, 'ban_reason', None),
        "violations": violations_data,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Warn User
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/users/{user_id}/warn")
async def warn_user(
    user_id: str,
    body: WarnRequest = WarnRequest(),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Issue a formal warning to a user.
    Increments warnings_count, sets last_warning_at, and logs an AuditEvent.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    user.warnings_count = (getattr(user, 'warnings_count', 0) or 0) + 1
    user.last_warning_at = now

    audit = AuditEvent(
        event_type="admin.user.warn",
        user_id=user.id,
        event_data={
            "warned_user_id": str(user.id),
            "warned_user_email": user.email,
            "reason": body.reason,
            "new_warnings_count": user.warnings_count,
            "issued_by_admin_id": str(admin.id),
            "issued_by_admin_email": admin.email,
        },
        risk_level="MEDIUM",
        success=True,
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    logger.info(
        "admin_warned_user",
        target_user=str(user.id),
        admin=str(admin.id),
        warnings_count=user.warnings_count,
    )

    return {
        "status": "warned",
        "user_id": str(user.id),
        "warnings_count": user.warnings_count,
        "last_warning_at": now.isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Ban User
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    body: BanRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Ban a user immediately.
    Accepts either {"duration_hours": 24} for a timed ban
    or {"permanent": true} for a permanent ban.
    Updates banned_until, ban_reason, deactivates account, and logs an AuditEvent.
    """
    if not body.permanent and not body.duration_hours:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'duration_hours' or 'permanent: true'."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)

    if body.permanent:
        # A date far in the future represents a permanent ban (timezone-aware)
        ban_until = datetime(9999, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        ban_label = "permanent"
    else:
        ban_until = now + timedelta(hours=body.duration_hours)
        ban_label = f"{body.duration_hours}h"

    user.banned_until = ban_until
    user.ban_reason = body.reason
    user.is_active = False  # Immediately deactivate

    audit = AuditEvent(
        event_type="admin.user.ban",
        user_id=user.id,
        event_data={
            "banned_user_id": str(user.id),
            "banned_user_email": user.email,
            "reason": body.reason,
            "duration": ban_label,
            "banned_until": ban_until.isoformat(),
            "permanent": body.permanent,
            "issued_by_admin_id": str(admin.id),
            "issued_by_admin_email": admin.email,
        },
        risk_level="HIGH",
        success=True,
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    logger.info(
        "admin_banned_user",
        target_user=str(user.id),
        admin=str(admin.id),
        duration=ban_label,
        permanent=body.permanent,
    )

    return {
        "status": "banned",
        "user_id": str(user.id),
        "banned_until": ban_until.isoformat(),
        "permanent": body.permanent,
        "reason": body.reason,
    }


# ─────────────────────────────────────────────────────────────────────────────
# NEW: Live Threat Alerts
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/alerts")
async def get_live_alerts(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Return the latest 10 incidents whose severity is HIGH or CRITICAL.

    Filters on Incident.severity (the canonical source of truth for a live
    threat) rather than the joined Verdict, then walks the relationship chain
    Incident -> Verdict -> ProtectedRequest -> User to surface the offending
    user's email and the redacted prompt.

    Uses aliased(User) to avoid SQLAlchemy model ambiguity with the admin
    dependency. Returns redacted prompts, attack type, severity, and timestamp.
    """
    try:
        # Alias the User model so SQLAlchemy can distinguish between the
        # 'admin' dependency User and the request-owner User in the join.
        RequestOwner = aliased(User, name="request_owner")

        results = (
            db.query(
                Incident,
                Verdict,
                ProtectedRequest,
                RequestOwner,
            )
            .join(Verdict, Incident.verdict_id == Verdict.id)
            .join(ProtectedRequest, Incident.request_id == ProtectedRequest.id)
            .join(RequestOwner, ProtectedRequest.user_id == RequestOwner.id)
            .filter(Incident.severity.in_(["HIGH", "CRITICAL"]))
            .order_by(Incident.created_at.desc())
            .limit(10)
            .all()
        )
    except Exception as exc:
        logger.error("get_live_alerts query failed", exc_info=exc)
        return {"alerts": [], "count": 0}

    alerts = []
    for inc, verdict, req, owner in results:
        try:
            # Redact prompt — keep first 80 chars
            raw_prompt = req.original_prompt or ""
            redacted_prompt = (
                raw_prompt[:80] + "…[redacted]"
                if len(raw_prompt) > 80
                else raw_prompt
            )

            # Best-effort primary attack type
            attack_types: list = verdict.attack_types or []
            primary_attack = (
                verdict.primary_attack_type
                or (attack_types[0] if attack_types else None)
                or inc.incident_type
                or "Unknown"
            )

            # Timezone-safe timestamp string
            ts = inc.created_at
            if ts is not None:
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                timestamp_str = ts.isoformat()
            else:
                timestamp_str = None

            alerts.append(
                {
                    "id": str(inc.id),
                    "user_id": str(owner.id),
                    "user_email": owner.email,
                    "username": owner.username,
                    "prompt": redacted_prompt,
                    "attack_type": primary_attack,
                    "severity": inc.severity,
                    "risk_level": verdict.risk_level,
                    "verdict": verdict.verdict,
                    "incident_type": inc.incident_type,
                    "status": inc.status,
                    "timestamp": timestamp_str,
                }
            )
        except Exception as row_exc:
            logger.warning(
                "Skipping malformed alert row",
                incident_id=str(inc.id) if inc else "?",
                exc_info=row_exc,
            )
            continue

    return {"alerts": alerts, "count": len(alerts)}


# Revenue
@router.get("/revenue")
async def get_revenue(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get revenue metrics"""
    # Count paying users per plan
    result = db.execute(text("""
        SELECT 
            u.plan_code,
            p.name as plan_name,
            p.price_usd_cents,
            COUNT(u.id) as user_count,
            (COUNT(u.id) * p.price_usd_cents) as monthly_revenue_cents
        FROM users u
        JOIN plans p ON u.plan_code = p.code
        WHERE u.plan_code != 'free' AND u.is_active = true
        GROUP BY u.plan_code, p.name, p.price_usd_cents
        ORDER BY p.sort_order;
    """))
    
    revenue_by_plan = []
    total_mrr_cents = 0
    for row in result:
        revenue_by_plan.append({
            "plan_code": row.plan_code,
            "plan_name": row.plan_name,
            "price_usd_cents": row.price_usd_cents,
            "user_count": row.user_count,
            "monthly_revenue_cents": row.monthly_revenue_cents
        })
        total_mrr_cents += row.monthly_revenue_cents
    
    # New signups last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_signups = db.query(User).filter(User.created_at >= thirty_days_ago).count()
    
    # Total active users
    total_users = db.query(User).filter(User.is_active == True).count()
    paying_users = db.query(User).filter(
        User.plan_code != 'free', User.is_active == True
    ).count()
    
    return {
        "mrr_cents": total_mrr_cents,
        "arr_cents": total_mrr_cents * 12,
        "revenue_by_plan": revenue_by_plan,
        "new_signups_30d": new_signups,
        "total_active_users": total_users,
        "paying_users": paying_users,
        "conversion_rate": round((paying_users / total_users * 100) if total_users > 0 else 0, 2)
    }


# Metrics
@router.get("/metrics/requests")
async def get_request_metrics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get request metrics over time"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    result = db.execute(text("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as request_count
        FROM protected_requests
        WHERE created_at >= :cutoff
        GROUP BY DATE(created_at)
        ORDER BY date ASC;
    """), {"cutoff": cutoff})
    
    daily_requests = [{"date": str(row.date), "count": row.request_count} for row in result]
    
    # Verdict breakdown
    verdict_result = db.execute(text("""
        SELECT 
            final_verdict as verdict,
            COUNT(*) as count
        FROM verdicts
        WHERE created_at >= :cutoff
        GROUP BY final_verdict;
    """), {"cutoff": cutoff})
    
    verdict_breakdown = {row.verdict: row.count for row in verdict_result}
    
    return {
        "daily_requests": daily_requests,
        "verdict_breakdown": verdict_breakdown
    }


@router.get("/metrics/attacks")
async def get_attack_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get attack pattern metrics"""
    result = db.execute(text("""
        SELECT 
            t.classification,
            COUNT(*) as count,
            AVG(t.risk_score) as avg_risk_score
        FROM triage_results t
        WHERE t.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY t.classification
        ORDER BY count DESC;
    """))
    
    attack_breakdown = [
        {
            "classification": row.classification,
            "count": row.count,
            "avg_risk_score": float(row.avg_risk_score) if row.avg_risk_score else 0
        }
        for row in result
    ]
    
    return {"attack_breakdown": attack_breakdown}


@router.get("/metrics/costs")
async def get_cost_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get cost metrics"""
    result = db.execute(text("""
        SELECT 
            SUM(debates) as total_debates,
            SUM(tokens) as total_tokens,
            SUM(cost_usd) as total_cost
        FROM usage_logs
        WHERE created_at >= NOW() - INTERVAL '30 days';
    """))
    
    row = result.fetchone()
    
    return {
        "total_debates_30d": row.total_debates or 0,
        "total_tokens_30d": row.total_tokens or 0,
        "total_cost_usd_30d": float(row.total_cost or 0)
    }


# System Health
@router.get("/system/health")
async def get_system_health(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get system health status"""
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    # Error rate last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    total_requests = db.query(func.count(User.id)).scalar()
    
    return {
        "database": db_status,
        "total_users": total_requests,
        "timestamp": datetime.utcnow().isoformat()
    }


# Plans Management (super_admin only)
@router.get("/plans")
async def list_plans(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all plans"""
    result = db.execute(text("""
        SELECT * FROM plans ORDER BY sort_order ASC;
    """))
    
    plans = []
    for row in result:
        plans.append({
            "id": str(row.id),
            "code": row.code,
            "name": row.name,
            "price_usd_cents": row.price_usd_cents,
            "currency": row.currency,
            "interval": row.interval,
            "monthly_debate_limit": row.monthly_debate_limit,
            "protected_apps_limit": row.protected_apps_limit,
            "features_json": row.features_json,
            "is_active": row.is_active,
            "sort_order": row.sort_order,
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat()
        })
    
    return {"plans": plans}


@router.post("/plans")
async def create_plan(
    plan: PlanCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Create new plan (super_admin only)"""
    import json
    db.execute(text("""
        INSERT INTO plans (code, name, price_usd_cents, monthly_debate_limit, protected_apps_limit, features_json)
        VALUES (:code, :name, :price, :limit, :apps, CAST(:features AS jsonb));
    """), {
        'code': plan.code,
        'name': plan.name,
        'price': plan.price_usd_cents,
        'limit': plan.monthly_debate_limit,
        'apps': plan.protected_apps_limit,
        'features': json.dumps(plan.features_json)
    })
    db.commit()
    
    return {"status": "created", "code": plan.code}


@router.patch("/plans/{code}")
async def update_plan(
    code: str,
    update: PlanUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Update plan (super_admin only)"""
    updates = []
    params = {"code": code}
    
    if update.name is not None:
        updates.append("name = :name")
        params["name"] = update.name
    if update.price_usd_cents is not None:
        updates.append("price_usd_cents = :price")
        params["price"] = update.price_usd_cents
    if update.monthly_debate_limit is not None:
        updates.append("monthly_debate_limit = :limit")
        params["limit"] = update.monthly_debate_limit
    if update.protected_apps_limit is not None:
        updates.append("protected_apps_limit = :apps")
        params["apps"] = update.protected_apps_limit
    if update.features_json is not None:
        import json
        updates.append("features_json = CAST(:features AS jsonb)")
        params["features"] = json.dumps(update.features_json)
    if update.is_active is not None:
        updates.append("is_active = :active")
        params["active"] = update.is_active
    
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    updates.append("updated_at = NOW()")
    
    db.execute(text(f"""
        UPDATE plans SET {', '.join(updates)}
        WHERE code = :code;
    """), params)
    db.commit()
    
    return {"status": "updated", "code": code}


# Settings Management (super_admin only)
@router.get("/settings")
async def get_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all settings"""
    result = db.execute(text("SELECT key, value_json FROM settings;"))
    
    settings = {row.key: row.value_json for row in result}
    
    return {"settings": settings, "editable": admin.role == 'super_admin'}


@router.patch("/settings")
async def update_settings(
    update: SettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Update settings (super_admin only)"""
    import json
    for key, value in update.settings.items():
        db.execute(text("""
            INSERT INTO settings (key, value_json)
            VALUES (:key, CAST(:value AS jsonb))
            ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW();
        """), {"key": key, "value": json.dumps(value)})
    
    db.commit()
    
    return {"status": "updated", "count": len(update.settings)}

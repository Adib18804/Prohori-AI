"""
Per-user analytics endpoints.

Every metric is computed deterministically from the database for the
authenticated user only (no cross-tenant leakage, no fabricated numbers).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
import structlog

from app.database import get_db
from app.api.deps import get_current_user
from app.models import User, ProtectedRequest, TriageResult, Verdict

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/analytics/me")
async def get_my_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the current user's own security statistics.

    Response shape:
        {
            "total_requests": int,
            "blocked_requests": int,
            "avg_risk_score": float   # 0.0 - 1.0, averaged triage risk score
        }
    """
    # Total protected requests submitted by this user.
    total_requests = (
        db.query(func.count(ProtectedRequest.id))
        .filter(ProtectedRequest.user_id == current_user.id)
        .scalar()
    ) or 0

    # Requests that were ultimately blocked for this user.
    blocked_requests = (
        db.query(func.count(Verdict.id))
        .join(ProtectedRequest, Verdict.request_id == ProtectedRequest.id)
        .filter(
            ProtectedRequest.user_id == current_user.id,
            Verdict.verdict == "BLOCK",
        )
        .scalar()
    ) or 0

    # Average numeric risk score (0.0 - 1.0) from triage results.
    # Verdicts only store a categorical risk_level, so we use the
    # deterministic triage risk_score as the numeric signal.
    avg_risk = (
        db.query(func.avg(TriageResult.risk_score))
        .join(ProtectedRequest, TriageResult.request_id == ProtectedRequest.id)
        .filter(ProtectedRequest.user_id == current_user.id)
        .scalar()
    )

    result = {
        "total_requests": int(total_requests),
        "blocked_requests": int(blocked_requests),
        "avg_risk_score": round(float(avg_risk), 4) if avg_risk is not None else 0.0,
    }

    logger.info(
        "user_analytics_served",
        user_id=str(current_user.id),
        total_requests=result["total_requests"],
        blocked_requests=result["blocked_requests"],
    )

    return result

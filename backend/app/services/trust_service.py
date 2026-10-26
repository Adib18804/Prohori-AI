"""
Trust & Warning System
Tracks user violations and applies progressive penalties
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import User, ViolationLog
import logging


logger = logging.getLogger("prohori.trust")

# ─── Constant ─────────────────────────────────────────────────────────────────
WARNING_LIMIT = 3


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _utc_now() -> datetime:
    """Always return an offset-aware UTC datetime."""
    return datetime.now(timezone.utc)


def _ensure_aware(dt: datetime) -> datetime:
    """
    Return dt with UTC tzinfo attached if it is naive.
    Database columns declared with DateTime(timezone=True) may still return
    naive objects depending on the driver; this normalises them.
    """
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _hours_since(dt: datetime) -> float:
    """Return hours elapsed since *dt* (aware or naive). Never raises."""
    if dt is None:
        return float("inf")
    aware_dt = _ensure_aware(dt)
    return (_utc_now() - aware_dt).total_seconds() / 3600.0


# ─── Public API ───────────────────────────────────────────────────────────────

async def check_user_trust(
    db: Session,
    user_id: str,
    prompt: str,
    verdict: str,
    confidence: float,
    risk_level: str,
    attack_types: List[str],
) -> Dict[str, Any]:
    """
    Check user trust status and apply warning / auto-ban logic.

    Returns a dict with keys:
        allowed        : bool
        action         : "ok" | "warning" | "banned"
        warnings_count : int   (when action == "warning")
        warnings_left  : int   (when action == "warning")
        banned_until   : datetime | None
        reason         : str | None
        hours_left     : float | None
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"allowed": True, "action": "ok"}

    now = _utc_now()

    # ── 1. Is the user already banned? ────────────────────────────────────────
    if user.banned_until:
        banned_until_aware = _ensure_aware(user.banned_until)
        if banned_until_aware > now:
            time_left = banned_until_aware - now
            hours_left = time_left.total_seconds() / 3600.0
            return {
                "allowed": False,
                "action": "banned",
                "banned_until": banned_until_aware,
                "reason": user.ban_reason or "Multiple security violations",
                "hours_left": round(hours_left, 1),
            }

    # ── 2. Only act on BLOCK verdicts ─────────────────────────────────────────
    if verdict != "BLOCK":
        return {"allowed": True, "action": "ok"}

    # ── 3. Reset warning counter if the warning window has expired ────────────
    if user.last_warning_at:
        hours_since_last = _hours_since(user.last_warning_at)
        if hours_since_last > 24:
            user.warnings_count = 0

    # ── 4. Increment warnings ─────────────────────────────────────────────────
    user.warnings_count = (user.warnings_count or 0) + 1
    user.last_warning_at = now
    user.total_violations = (user.total_violations or 0) + 1

    # ── 5. Log violation ──────────────────────────────────────────────────────
    violation = ViolationLog(
        user_id=user_id,
        prompt=prompt[:500],
        verdict=verdict,
        confidence=confidence,
        risk_level=risk_level,
        attack_types=attack_types,
        warned=True,
        banned=False,
    )
    db.add(violation)

    # ── 6. Auto-ban if threshold reached ─────────────────────────────────────
    if user.warnings_count >= WARNING_LIMIT:
        ban_until = now + timedelta(hours=24)
        user.banned_until = ban_until
        user.ban_reason = (
            f"Automatic ban: {WARNING_LIMIT} security violations within 24 hours"
        )
        violation.banned = True

        db.commit()

        logger.warning(
            "User %s auto-banned until %s (%d warnings)",
            user_id,
            ban_until.isoformat(),
            WARNING_LIMIT,
        )

        return {
            "allowed": False,
            "action": "banned",
            "banned_until": ban_until,
            "reason": user.ban_reason,
            "hours_left": 24.0,
        }

    db.commit()

    warnings_left = WARNING_LIMIT - user.warnings_count
    logger.info(
        "User %s received warning %d/%d",
        user_id,
        user.warnings_count,
        WARNING_LIMIT,
    )

    return {
        "allowed": False,
        "action": "warning",
        "warnings_count": user.warnings_count,
        "warnings_left": warnings_left,
        "warning_window_hours": 24,
    }


def get_user_trust_status(db: Session, user_id: str) -> Dict[str, Any]:
    """Return the current trust status for a user (read-only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"status": "ok"}

    now = _utc_now()

    # Banned?
    if user.banned_until:
        banned_until_aware = _ensure_aware(user.banned_until)
        if banned_until_aware > now:
            time_left = banned_until_aware - now
            return {
                "status": "banned",
                "banned_until": banned_until_aware.isoformat(),
                "reason": user.ban_reason,
                "hours_left": round(time_left.total_seconds() / 3600.0, 1),
            }

    # Warned within active window?
    if user.warnings_count and user.warnings_count > 0 and user.last_warning_at:
        hours_since = _hours_since(user.last_warning_at)
        if hours_since < 24:
            return {
                "status": "warned",
                "warnings_count": user.warnings_count,
                "warnings_left": WARNING_LIMIT - user.warnings_count,
                "window_expires_in_hours": round(24 - hours_since, 1),
            }

    return {"status": "ok", "total_violations": user.total_violations or 0}


def get_user_violations(
    db: Session,
    user_id: str,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """Return recent violation log entries for a user."""
    violations = (
        db.query(ViolationLog)
        .filter(ViolationLog.user_id == user_id)
        .order_by(ViolationLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": str(v.id),
            "prompt": v.prompt,
            "verdict": v.verdict,
            "confidence": float(v.confidence) if v.confidence else None,
            "risk_level": v.risk_level,
            "attack_types": v.attack_types or [],
            "warned": v.warned,
            "banned": v.banned,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in violations
    ]

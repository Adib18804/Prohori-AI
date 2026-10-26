"""Authenticated subscription endpoints with an explicitly simulated checkout."""
import hashlib
import hmac
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import Plan, Subscription, User

router = APIRouter()


class CheckoutRequest(BaseModel):
    plan_id: Optional[str] = None
    plan_code: Optional[str] = None
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class WebhookRequest(BaseModel):
    event: str = "payment_success"
    session_id: str
    client_secret: str


class BillingPortalRequest(BaseModel):
    return_url: Optional[str] = None


class UsageResponse(BaseModel):
    user_id: str
    plan_code: str
    plan_name: str
    monthly_debates: int
    debates_used: int
    debates_remaining: int
    usage_percent: float
    reset_date: Optional[datetime]


def _checkout_secret(session_id: str, user_id: str, plan_id: str) -> str:
    """Bind a simulated payment confirmation to its user and selected plan."""
    key = get_settings().jwt_secret.encode("utf-8")
    message = f"{session_id}:{user_id}:{plan_id}".encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


@router.post("/create-checkout-session")
@router.post("/checkout-session")  # Compatibility for the existing pricing screen/API.
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Plan).filter(Plan.is_active.is_(True))
    if request.plan_id:
        plan = query.filter(Plan.id == request.plan_id).first()
    elif request.plan_code:
        plan = query.filter(Plan.code == request.plan_code).first()
    else:
        raise HTTPException(status_code=422, detail="plan_id or plan_code is required")
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if plan.price <= 0:
        raise HTTPException(status_code=400, detail="The free plan does not require checkout")

    session_id = f"sim_{uuid.uuid4().hex}"
    return {
        "session_id": session_id,
        "client_secret": _checkout_secret(session_id, str(current_user.id), str(plan.id)),
        "plan": {"id": str(plan.id), "name": plan.name, "price": float(plan.price), "billing_cycle": plan.billing_cycle},
        "gateway": "simulated",
    }


@router.post("/webhook")
async def simulated_payment_webhook(
    request: WebhookRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Demo confirmation endpoint; card details are never accepted or stored."""
    if request.event != "payment_success" or not request.session_id.startswith("sim_"):
        raise HTTPException(status_code=400, detail="Unsupported simulated payment event")
    # Check every eligible plan because the session id is deliberately opaque.
    plans = db.query(Plan).filter(Plan.is_active.is_(True), Plan.price > 0).all()
    plan = next((p for p in plans if hmac.compare_digest(
        _checkout_secret(request.session_id, str(current_user.id), str(p.id)), request.client_secret
    )), None)
    if plan is None:
        raise HTTPException(status_code=400, detail="Invalid checkout confirmation")

    duplicate = db.query(Subscription).filter(Subscription.stripe_subscription_id == request.session_id).first()
    if duplicate:
        if duplicate.user_id != current_user.id:
            raise HTTPException(status_code=409, detail="Checkout session already used")
        return {"status": "already_processed", "plan_code": current_user.plan_code}

    now = datetime.now(timezone.utc)
    period_end = now + (timedelta(days=365) if plan.billing_cycle == "yearly" else timedelta(days=30))
    # Keep only one active subscription when a user upgrades or changes plans.
    db.query(Subscription).filter(
        Subscription.user_id == current_user.id, Subscription.status == "active"
    ).update({Subscription.status: "canceled"}, synchronize_session="fetch")
    subscription = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        status="active",
        stripe_subscription_id=request.session_id,
        current_period_end=period_end,
    )
    current_user.plan_code = plan.code
    db.add(subscription)
    db.commit()
    return {"status": "active", "plan_code": plan.code, "current_period_end": period_end.isoformat()}


@router.get("/me")
async def get_my_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subscription = (
        db.query(Subscription).filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.created_at.desc()).first()
    )
    plan = db.query(Plan).filter(Plan.code == (current_user.plan_code or "free")).first()
    return {
        "plan_code": current_user.plan_code or "free",
        "plan_name": plan.name if plan else "Free",
        "status": subscription.status if subscription else "free",
        "current_period_end": subscription.current_period_end.isoformat() if subscription else None,
        "subscription_id": str(subscription.id) if subscription else None,
    }


@router.post("/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subscription = (
        db.query(Subscription).filter(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.created_at.desc()).first()
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    subscription.status = "canceled"
    current_user.plan_code = "free"
    db.commit()
    return {"status": "canceled", "plan_code": "free"}


@router.post("/portal")
async def create_billing_portal(request: BillingPortalRequest, current_user: User = Depends(get_current_user)):
    # Kept as a compatibility endpoint; this demo does not have an external billing portal.
    return {"url": request.return_url or "/billing", "gateway": "simulated"}


@router.get("/usage", response_model=UsageResponse)
async def get_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.code == (current_user.plan_code or "free")).first()
    plan_name = plan.name if plan else "Free"
    monthly_debates = plan.monthly_debates if plan else 100
    debates_used = current_user.monthly_debate_count or 0
    debates_remaining = max(0, monthly_debates - debates_used)
    usage_percent = debates_used / monthly_debates * 100 if monthly_debates > 0 else 0
    return UsageResponse(
        user_id=str(current_user.id), plan_code=current_user.plan_code or "free", plan_name=plan_name,
        monthly_debates=monthly_debates, debates_used=debates_used, debates_remaining=debates_remaining,
        usage_percent=round(usage_percent, 2), reset_date=current_user.monthly_reset_at,
    )

"""
Public plans API
Pricing and plan information (no authentication required)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.models import Plan

router = APIRouter()


class PlanResponse(BaseModel):
    id: str
    code: str
    name: str
    price: float
    monthly_debates: int
    billing_cycle: str
    category: str
    discount_percent: int
    is_popular: bool
    savings_text: Optional[str]
    features: Optional[List[str]]
    is_active: bool


@router.get("/public", response_model=List[PlanResponse])
@router.get("", response_model=List[PlanResponse])
async def list_public_plans(
    category: Optional[str] = Query(None),
    cycle: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Public endpoint - List all active plans
    
    Query params:
    - category: filter by category (student, professional, business, enterprise)
    - cycle: filter by billing cycle (weekly, monthly, yearly)
    """
    query = db.query(Plan).filter(Plan.is_active == True)
    
    if category:
        query = query.filter(Plan.category == category)
    if cycle:
        query = query.filter(Plan.billing_cycle == cycle)
    
    plans = query.order_by(Plan.price).all()
    
    return [
        PlanResponse(
            id=str(p.id),
            code=p.code,
            name=p.name,
            price=float(p.price),
            monthly_debates=p.monthly_debates,
            billing_cycle=p.billing_cycle,
            category=p.category,
            discount_percent=p.discount_percent or 0,
            is_popular=p.is_popular or False,
            savings_text=p.savings_text,
            features=p.features if p.features else [],
            is_active=p.is_active,
        )
        for p in plans
    ]


@router.get("/public/{code}", response_model=PlanResponse)
async def get_public_plan(
    code: str,
    db: Session = Depends(get_db),
):
    """Get a specific plan by code"""
    plan = db.query(Plan).filter(Plan.code == code, Plan.is_active == True).first()
    
    if not plan:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return PlanResponse(
        id=str(plan.id),
        code=plan.code,
        name=plan.name,
        price=float(plan.price),
        monthly_debates=plan.monthly_debates,
        billing_cycle=plan.billing_cycle,
        category=plan.category,
        discount_percent=plan.discount_percent or 0,
        is_popular=plan.is_popular or False,
        savings_text=plan.savings_text,
        features=plan.features if plan.features else [],
        is_active=plan.is_active,
    )


@router.get("/categories")
async def list_categories(db: Session = Depends(get_db)):
    """List all plan categories with counts"""
    from sqlalchemy import func
    
    result = (
        db.query(
            Plan.category,
            func.count(Plan.id).label('count')
        )
        .filter(Plan.is_active == True)
        .group_by(Plan.category)
        .all()
    )
    
    return [
        {"category": row.category, "count": row.count}
        for row in result
    ]


@router.get("/cycles")
async def list_cycles(db: Session = Depends(get_db)):
    """List all billing cycles with counts"""
    from sqlalchemy import func
    
    result = (
        db.query(
            Plan.billing_cycle,
            func.count(Plan.id).label('count')
        )
        .filter(Plan.is_active == True)
        .group_by(Plan.billing_cycle)
        .all()
    )
    
    return [
        {"cycle": row.billing_cycle, "count": row.count}
        for row in result
    ]

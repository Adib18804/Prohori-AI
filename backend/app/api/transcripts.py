"""
Transcript and incident viewing endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import structlog

from app.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models import (
    User, ProtectedRequest, TriageResult, Debate, AgentArgument,
    Verdict, Incident, AuditEvent
)

logger = structlog.get_logger(__name__)
router = APIRouter()


class DebateTranscript(BaseModel):
    request_id: str
    prompt: str
    triage: dict
    prosecutor: Optional[dict]
    defender: Optional[dict]
    verdict: dict
    rag_matches: int
    processing_time_ms: int
    created_at: datetime


class IncidentSummary(BaseModel):
    incident_id: str
    request_id: str
    incident_type: str
    severity: str
    status: str
    verdict: str
    confidence: float
    created_at: datetime


class AnalyticsSummary(BaseModel):
    total_requests: int
    allowed: int
    blocked: int
    redacted: int
    debates_triggered: int
    high_risk_incidents: int
    avg_confidence: float
    avg_processing_time_ms: float


@router.get("/debates/{debate_id}", response_model=DebateTranscript)
async def get_debate_transcript(
    debate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete debate transcript
    """
    debate = db.query(Debate).filter(Debate.id == debate_id).first()

    # Incidents only reference request_id, so allow resolving by request_id too
    if not debate:
        debate = db.query(Debate).filter(Debate.request_id == debate_id).first()

    if not debate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debate not found"
        )
    
    # Check authorization
    request = debate.request
    if request.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this debate"
        )
    
    # Get all components
    triage = db.query(TriageResult).filter(
        TriageResult.request_id == request.id
    ).first()
    
    arguments = db.query(AgentArgument).filter(
        AgentArgument.debate_id == debate.id
    ).all()
    
    prosecutor_arg = next((arg for arg in arguments if arg.agent_type == "prosecutor"), None)
    defender_arg = next((arg for arg in arguments if arg.agent_type == "defender"), None)
    
    verdict = db.query(Verdict).filter(
        Verdict.debate_id == debate.id
    ).first()
    
    return DebateTranscript(
        request_id=str(request.id),
        prompt=request.original_prompt,
        triage={
            "classification": triage.classification,
            "risk_score": float(triage.risk_score),
            "confidence": float(triage.confidence),
            "reason": triage.reason,
            "attack_types": triage.attack_types
        },
        prosecutor={
            "position": prosecutor_arg.position,
            "risk_score": float(prosecutor_arg.risk_score),
            "confidence": float(prosecutor_arg.confidence),
            "reasoning": prosecutor_arg.reasoning,
            "evidence": prosecutor_arg.evidence,
            "attack_types": prosecutor_arg.attack_types
        } if prosecutor_arg else None,
        defender={
            "position": defender_arg.position,
            "risk_score": float(defender_arg.risk_score),
            "confidence": float(defender_arg.confidence),
            "reasoning": defender_arg.reasoning,
            "evidence": defender_arg.evidence,
            "benign_interpretation": defender_arg.benign_interpretation
        } if defender_arg else None,
        verdict={
            "verdict": verdict.verdict,
            "confidence": float(verdict.confidence),
            "risk_level": verdict.risk_level,
            "reason": verdict.reason,
            "evidence": verdict.evidence,
            "attack_types": verdict.attack_types,
            "recommended_action": verdict.recommended_action
        } if verdict else None,
        rag_matches=debate.rag_matches_found,
        processing_time_ms=debate.total_processing_time_ms,
        created_at=request.created_at
    )


@router.get("/incidents", response_model=List[IncidentSummary])
async def list_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List security incidents (admin only)
    """
    query = db.query(Incident).join(Verdict).join(ProtectedRequest)
    
    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    
    incidents = query.order_by(desc(Incident.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for incident in incidents:
        result.append(IncidentSummary(
            incident_id=str(incident.id),
            request_id=str(incident.request_id),
            incident_type=incident.incident_type,
            severity=incident.severity,
            status=incident.status,
            verdict=incident.verdict.verdict,
            confidence=float(incident.verdict.confidence),
            created_at=incident.created_at
        ))
    
    return result


@router.get("/analytics", response_model=AnalyticsSummary)
async def get_analytics(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get analytics summary (admin only)
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    # Count requests
    total_requests = db.query(ProtectedRequest).filter(
        ProtectedRequest.created_at >= since
    ).count()
    
    # Count verdicts
    verdicts = db.query(Verdict).join(ProtectedRequest).filter(
        ProtectedRequest.created_at >= since
    ).all()
    
    allowed = sum(1 for v in verdicts if v.verdict == "ALLOW")
    blocked = sum(1 for v in verdicts if v.verdict == "BLOCK")
    redacted = sum(1 for v in verdicts if v.verdict == "REDACT")
    
    # Count debates
    debates_triggered = db.query(Debate).join(ProtectedRequest).filter(
        ProtectedRequest.created_at >= since
    ).count()
    
    # Count high-risk incidents
    high_risk_incidents = db.query(Incident).join(ProtectedRequest).filter(
        ProtectedRequest.created_at >= since,
        Incident.severity.in_(["HIGH", "CRITICAL"])
    ).count()
    
    # Average confidence and processing time
    avg_confidence = sum(float(v.confidence) for v in verdicts) / len(verdicts) if verdicts else 0
    avg_processing_time = sum(v.processing_time_ms for v in verdicts) / len(verdicts) if verdicts else 0
    
    return AnalyticsSummary(
        total_requests=total_requests,
        allowed=allowed,
        blocked=blocked,
        redacted=redacted,
        debates_triggered=debates_triggered,
        high_risk_incidents=high_risk_incidents,
        avg_confidence=avg_confidence,
        avg_processing_time_ms=avg_processing_time
    )
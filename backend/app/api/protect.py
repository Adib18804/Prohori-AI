"""
Protected LLM API endpoints
Main security gateway
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import hashlib
import uuid
import structlog

from app.database import get_db
from app.api.deps import get_current_user
from app.models import (
    User, Session as SessionModel, ProtectedRequest, TriageResult,
    Debate, AgentArgument, Verdict, Incident, AuditEvent
)
from app.services.orchestrator import SecurityOrchestrator
from app.services.protected_llm import ProtectedLLMService
from app.services import trust_service
from app.rag.attack_memory import AttackMemory
from app.security.taxonomy import VerdictType, TriageClassification
from app.config import get_settings

logger = structlog.get_logger(__name__)
router = APIRouter()
settings = get_settings()


class ProtectRequest(BaseModel):
    message: str = Field(..., max_length=settings.max_prompt_length)
    session_id: Optional[str] = None
    enable_rag: bool = True
    enable_ml: bool = False


class ProtectResponse(BaseModel):
    request_id: str
    verdict: str
    confidence: float
    risk_level: str
    attack_types: list
    reason: str
    debate_triggered: bool
    processing_time_ms: int
    assistant_response: Optional[str] = None
    debate_id: Optional[str] = None
    redacted_prompt: Optional[str] = None


@router.post("/protect", response_model=ProtectResponse)
async def protect_prompt(
    request: ProtectRequest,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main security gateway endpoint
    
    Pipeline:
    1. Create request record
    2. Run security orchestration
    3. Persist triage, debate, verdict
    4. If ALLOW, forward to protected LLM
    5. Return response with security analysis
    """
    logger.info(
        "Protect request received",
        user_id=str(current_user.id),
        message_length=len(request.message),
        session_id=request.session_id
    )
    
    try:
        # Get or create session
        if request.session_id:
            # Try to parse as UUID, if fails create new session
            try:
                session_uuid = uuid.UUID(request.session_id)
                session = db.query(SessionModel).filter(
                    SessionModel.id == session_uuid,
                    SessionModel.user_id == current_user.id
                ).first()
                if not session:
                    # Session not found, create new one
                    session = SessionModel(
                        user_id=current_user.id,
                        session_name="Protected Chat Session"
                    )
                    db.add(session)
                    db.commit()
                    db.refresh(session)
            except ValueError:
                # Invalid UUID format, create new session
                session = SessionModel(
                    user_id=current_user.id,
                    session_name="Protected Chat Session"
                )
                db.add(session)
                db.commit()
                db.refresh(session)
        else:
            session = SessionModel(
                user_id=current_user.id,
                session_name="Protected Chat Session"
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Create protected request record
        prompt_hash = hashlib.sha256(request.message.encode()).hexdigest()
        protected_request = ProtectedRequest(
            session_id=session.id,
            user_id=current_user.id,
            original_prompt=request.message,
            prompt_hash=prompt_hash,
            ip_address=http_request.client.host if http_request.client else None,
            user_agent=http_request.headers.get("user-agent"),
            request_source="api"
        )
        db.add(protected_request)
        db.commit()
        db.refresh(protected_request)
        
        request_id = str(protected_request.id)
        
        logger.info(
            "Protected request created",
            request_id=request_id,
            session_id=str(session.id)
        )
        
        # Run security orchestration
        orchestrator = SecurityOrchestrator(db=db)
        analysis = await orchestrator.analyze_prompt(
            prompt=request.message,
            user_id=str(current_user.id),
            session_id=str(session.id),
            enable_rag=request.enable_rag and settings.enable_rag_memory,
            enable_ml=request.enable_ml and settings.enable_ml_classifier
        )
        
        # Persist triage result (SAFE FALLBACK)
        triage_data = analysis.get("triage_result") or {
            "classification": "SUSPICIOUS",
            "risk_score": 0.7,
            "requires_debate": True,
            "attack_types": [],
            "reason": "Triage agent unavailable — defaulting to conservative classification",
            "model_used": "fallback",
            "processing_time_ms": 0,
            "confidence": 0.0,
            "evidence": {},
        }
        triage_result = TriageResult(
            request_id=protected_request.id,
            classification=triage_data["classification"],
            risk_score=triage_data["risk_score"],
            requires_debate=triage_data["requires_debate"],
            attack_types=triage_data.get("attack_types", []),
            reason=triage_data["reason"],
            model_used=triage_data["model_used"],
            processing_time_ms=triage_data["processing_time_ms"],
            confidence=triage_data["confidence"],
            evidence=triage_data.get("evidence", {})
        )
        db.add(triage_result)
        db.commit()
        
        # Persist debate if triggered
        debate_id = None
        if analysis.get("debate_triggered"):
            debate = Debate(
                request_id=protected_request.id,
                status="completed",
                started_at=protected_request.created_at,
                total_processing_time_ms=analysis["processing_time_ms"],
                rag_matches_found=len(analysis.get("debate", {}).get("rag_matches", [])),
                parallel_execution=True
            )
            db.add(debate)
            db.commit()
            db.refresh(debate)
            debate_id = str(debate.id)
            
            # Persist prosecutor argument
            prosecutor_data = analysis["debate"]["prosecutor"]
            prosecutor_arg = AgentArgument(
                debate_id=debate.id,
                agent_type="prosecutor",
                position=prosecutor_data["position"],
                risk_score=prosecutor_data["risk_score"],
                confidence=prosecutor_data["confidence"],
                reasoning=prosecutor_data["reasoning"],
                evidence=prosecutor_data.get("evidence", []),
                attack_types=prosecutor_data.get("attack_types", []),
                model_used=prosecutor_data["model_used"],
                processing_time_ms=prosecutor_data["processing_time_ms"],
                rag_context=prosecutor_data.get("rag_context", {})
            )
            db.add(prosecutor_arg)
            
            # Persist defender argument
            defender_data = analysis["debate"]["defender"]
            defender_arg = AgentArgument(
                debate_id=debate.id,
                agent_type="defender",
                position=defender_data["position"],
                risk_score=defender_data["risk_score"],
                confidence=defender_data["confidence"],
                reasoning=defender_data["reasoning"],
                evidence=defender_data.get("evidence", []),
                benign_interpretation=defender_data.get("benign_interpretation"),
                model_used=defender_data["model_used"],
                processing_time_ms=defender_data["processing_time_ms"]
            )
            db.add(defender_arg)
            db.commit()
            
            # Persist final verdict
            verdict_data = analysis["final_verdict"]
            verdict = Verdict(
                debate_id=debate.id,
                request_id=protected_request.id,
                verdict=verdict_data["verdict"],
                confidence=verdict_data["confidence"],
                risk_level=verdict_data["risk_level"],
                attack_types=verdict_data.get("attack_types", []),
                primary_attack_type=verdict_data.get("primary_attack_type"),
                reason=verdict_data["reason"],
                evidence=verdict_data.get("evidence", []),
                recommended_action=verdict_data.get("recommended_action"),
                redacted_prompt=verdict_data.get("redacted_prompt"),
                redaction_reason=verdict_data.get("redaction_reason"),
                model_used=verdict_data["model_used"],
                processing_time_ms=verdict_data["processing_time_ms"],
                prosecutor_influence=verdict_data.get("prosecutor_influence", 0.5),
                defender_influence=verdict_data.get("defender_influence", 0.5),
                rag_influence=verdict_data.get("rag_influence", 0.0)
            )
            db.add(verdict)
            db.commit()
            db.refresh(verdict)
            
            # Create incident if blocked
            if verdict.verdict == VerdictType.BLOCK.value and verdict.risk_level in ["HIGH", "CRITICAL"]:
                incident = Incident(
                    request_id=protected_request.id,
                    verdict_id=verdict.id,
                    incident_type=verdict.primary_attack_type or "other_suspicious",
                    severity=verdict.risk_level,
                    status="detected"
                )
                db.add(incident)
                db.commit()
                
                # Learn from incident if confidence is high
                if verdict.confidence >= 0.85:
                    attack_memory = AttackMemory(db)
                    await attack_memory.learn_from_incident(protected_request, verdict)
        
        # Check trust status and apply warning/ban logic
        trust_check = await trust_service.check_user_trust(
            db=db,
            user_id=str(current_user.id),
            prompt=request.message,
            verdict=analysis["verdict"],
            confidence=analysis["confidence"],
            risk_level=analysis.get("risk_level", "UNKNOWN"),
            attack_types=analysis.get("attack_types", [])
        )
        
        # If user is warned or banned, return early with trust status
        if trust_check["action"] in ["warning", "banned"]:
            logger.warning(
                "User trust action triggered",
                user_id=str(current_user.id),
                action=trust_check["action"],
                trust_data=trust_check
            )
            
            # Create audit event for trust action
            audit_event = AuditEvent(
                event_type=f"user_{trust_check['action']}",
                user_id=current_user.id,
                session_id=session.id,
                request_id=protected_request.id,
                event_data=trust_check,
                risk_level=analysis.get("risk_level", "UNKNOWN"),
                success=True,
                ip_address=http_request.client.host if http_request.client else None,
                user_agent=http_request.headers.get("user-agent")
            )
            db.add(audit_event)
            db.commit()
            
            # Return response with trust data (This is the CORRECT location for this return)
            return ProtectResponse(
                request_id=request_id,
                verdict=analysis["verdict"],
                confidence=analysis["confidence"],
                risk_level=analysis.get("risk_level", "UNKNOWN"),
                attack_types=analysis.get("attack_types", []),
                reason=trust_check.get("reason") or analysis["reason"],
                debate_triggered=analysis.get("debate_triggered", False),
                processing_time_ms=analysis["processing_time_ms"],
                assistant_response=None,
                debate_id=debate_id,
                redacted_prompt=None
            )
        
        # Create audit event
        audit_event = AuditEvent(
            event_type="request_processed",
            user_id=current_user.id,
            session_id=session.id,
            request_id=protected_request.id,
            event_data={
                "verdict": analysis["verdict"],
                "confidence": float(analysis["confidence"]),
                "risk_level": analysis.get("risk_level", "UNKNOWN"),
                "debate_triggered": analysis.get("debate_triggered", False)
            },
            risk_level=analysis.get("risk_level", "UNKNOWN"),
            success=True,
            ip_address=http_request.client.host if http_request.client else None,
            user_agent=http_request.headers.get("user-agent")
        )
        db.add(audit_event)
        db.commit()
        
        # Forward to protected LLM if allowed
        assistant_response = None
        if analysis["verdict"] == VerdictType.ALLOW.value:
            llm_service = ProtectedLLMService()
            assistant_response = await llm_service.generate_response(
                prompt=request.message,
                session_id=str(session.id)
            )
        elif analysis["verdict"] == VerdictType.REDACT.value and analysis.get("redacted_prompt"):
            llm_service = ProtectedLLMService()
            assistant_response = await llm_service.generate_response(
                prompt=analysis["redacted_prompt"],
                session_id=str(session.id)
            )
        
        logger.info(
            "Protect request completed",
            request_id=request_id,
            verdict=analysis["verdict"],
            confidence=analysis["confidence"],
            processing_time_ms=analysis["processing_time_ms"]
        )
        
        return ProtectResponse(
            request_id=request_id,
            verdict=analysis["verdict"],
            confidence=analysis["confidence"],
            risk_level=analysis.get("risk_level", "UNKNOWN"),
            attack_types=analysis.get("attack_types", []),
            reason=analysis["reason"],
            debate_triggered=analysis.get("debate_triggered", False),
            processing_time_ms=analysis["processing_time_ms"],
            assistant_response=assistant_response,
            debate_id=debate_id,
            redacted_prompt=analysis.get("redacted_prompt")
        )
    
    except Exception as e:
        logger.error(
            "Protect request failed",
            exc_info=e,
            user_id=str(current_user.id)
        )
        
        # Create failure audit event
        audit_event = AuditEvent(
            event_type="request_failed",
            user_id=current_user.id,
            event_data={"error": str(e)},
            success=False,
            error_message=str(e)
        )
        db.add(audit_event)
        db.commit()
        
        # 🔥 Graceful Fallback: Return a BLOCK response instead of raising an HTTP error
        return ProtectResponse(
            request_id="fallback_" + str(uuid.uuid4()),
            verdict="BLOCK",
            confidence=0.0,
            risk_level="CRITICAL",
            attack_types=["system_error"],
            reason=f"Security analysis failed due to an internal error: {str(e)}",
            debate_triggered=False,
            processing_time_ms=0,
            assistant_response=None,
            debate_id=None,
            redacted_prompt=None
        )
"""
Security Orchestrator - Coordinates multi-agent debate
"""

import asyncio
from typing import Dict, Any, Optional, List
import time
import structlog
from sqlalchemy.orm import Session

from app.agents import TriageAgent, ProsecutorAgent, DefenderAgent, JudgeAgent
from app.rag.attack_memory import AttackMemory
from app.security.taxonomy import TriageClassification, VerdictType
from app.config import get_settings
from app.ml.classifier import get_classifier

logger = structlog.get_logger(__name__)
settings = get_settings()


class SecurityOrchestrator:
    """
    Orchestrates the multi-agent security debate pipeline
    
    Pipeline:
    1. Triage - Fast classification
    2. RAG Retrieval - Find similar attacks (parallel with step 3)
    3. Prosecutor + Defender - Parallel debate arguments
    4. Judge - Final verdict
    """
    
    def __init__(self, db: Session = None):
        self.triage_agent = TriageAgent()
        self.prosecutor_agent = ProsecutorAgent()
        self.defender_agent = DefenderAgent()
        self.judge_agent = JudgeAgent()
        self.attack_memory = AttackMemory(db) if db else None
        self.db = db
    
    async def analyze_prompt(
        self,
        prompt: str,
        user_id: str,
        session_id: Optional[str] = None,
        enable_rag: bool = True,
        enable_ml: bool = False
    ) -> Dict[str, Any]:
        """
        Complete security analysis pipeline
        
        Returns:
            {
                "request_id": str,
                "verdict": "ALLOW|BLOCK|REDACT",
                "confidence": float,
                "risk_level": str,
                "triage_result": dict,
                "debate": {
                    "prosecutor": dict,
                    "defender": dict,
                    "rag_matches": list
                },
                "final_verdict": dict,
                "processing_time_ms": int,
                "debate_triggered": bool
            }
        """
        start_time = time.time()
        
        logger.info(
            "Security orchestration started",
            prompt_length=len(prompt),
            user_id=user_id,
            enable_rag=enable_rag
        )
        
        result = {
            "request_id": None,  # Will be set by caller
            "prompt_length": len(prompt),
            "debate_triggered": False,
            "processing_time_ms": 0
        }
        
        try:
            # Step 1: Triage
            triage_result = await self.triage_agent.analyze(prompt)
            result["triage_result"] = triage_result
            
            # Fast lane: SAFE requests bypass debate
            if (triage_result["classification"] == TriageClassification.SAFE.value 
                and triage_result["confidence"] > 0.95 
                and not triage_result["requires_debate"]):
                
                logger.info(
                    "Fast lane: Request approved without debate",
                    classification=triage_result["classification"],
                    confidence=triage_result["confidence"]
                )
                
                result["verdict"] = VerdictType.ALLOW.value
                result["confidence"] = triage_result["confidence"]
                result["risk_level"] = "LOW"
                result["attack_types"] = []
                result["reason"] = "Request classified as safe with high confidence"
                result["debate_triggered"] = False
                result["processing_time_ms"] = int((time.time() - start_time) * 1000)
                
                return result
            
            # Suspicious/High-risk: Trigger full debate
            logger.info(
                "Debate triggered",
                classification=triage_result["classification"],
                confidence=triage_result["confidence"]
            )
            result["debate_triggered"] = True
            
            # Step 2 & 3: Parallel execution
            # - RAG attack pattern retrieval
            # - Prosecutor argument
            rag_task = None
            if enable_rag and self.attack_memory:
                rag_task = self.attack_memory.find_similar_attacks(prompt, top_k=5)
            
            prosecutor_task = self.prosecutor_agent.analyze(
                prompt=prompt,
                triage_result=triage_result,
                rag_matches=[]  # Will be updated after RAG completes
            )
            
            # Wait for both in parallel
            if rag_task:
                rag_matches, prosecutor_argument = await asyncio.gather(
                    rag_task,
                    prosecutor_task
                )
            else:
                rag_matches = []
                prosecutor_argument = await prosecutor_task
            
            # Update prosecutor with RAG context if available
            if rag_matches:
                prosecutor_argument["rag_context"] = {
                    "matches_found": len(rag_matches),
                    "top_matches": rag_matches[:3]
                }
            
            # Step 4: Defender (needs prosecutor's argument)
            defender_argument = await self.defender_agent.analyze(
                prompt=prompt,
                triage_result=triage_result,
                prosecutor_argument=prosecutor_argument
            )
            
            # Store debate results
            result["debate"] = {
                "prosecutor": prosecutor_argument,
                "defender": defender_argument,
                "rag_matches": rag_matches if rag_matches else []
            }
            
            # Step 5: Judge renders verdict
            ml_score = None
            if enable_ml:
                try:
                    ml_classifier = get_classifier()
                    ml_prediction = ml_classifier.predict(prompt)
                    ml_score = {
                        "risk_score": ml_prediction["risk_score"],
                        "is_malicious": ml_prediction["is_malicious"],
                        "confidence": ml_prediction["confidence"],
                        "model": ml_prediction.get("model", "unknown")
                    }
                    logger.info("ML classifier prediction", ml_score=ml_score)
                except Exception as e:
                    logger.warning("ML classifier failed", exc_info=e)
                    ml_score = None
            
            final_verdict = await self.judge_agent.analyze(
                prompt=prompt,
                triage_result=triage_result,
                prosecutor_argument=prosecutor_argument,
                defender_argument=defender_argument,
                rag_matches=rag_matches,
                ml_score=ml_score
            )
            
            result["final_verdict"] = final_verdict
            result["verdict"] = final_verdict["verdict"]
            result["confidence"] = final_verdict["confidence"]
            result["risk_level"] = final_verdict["risk_level"]
            result["attack_types"] = final_verdict["attack_types"]
            result["reason"] = final_verdict["reason"]
            result["evidence"] = final_verdict.get("evidence", [])
            result["recommended_action"] = final_verdict.get("recommended_action", "")
            
            # Include ML score if available
            if ml_score:
                result["ml_score"] = ml_score
            
            # Handle redaction
            if final_verdict["verdict"] == VerdictType.REDACT.value:
                result["redacted_prompt"] = final_verdict.get("redacted_prompt")
                result["redaction_reason"] = final_verdict.get("redaction_reason")
            
            result["processing_time_ms"] = int((time.time() - start_time) * 1000)
            
            logger.info(
                "Security orchestration completed",
                verdict=result["verdict"],
                confidence=result["confidence"],
                risk_level=result["risk_level"],
                processing_time_ms=result["processing_time_ms"],
                debate_triggered=result["debate_triggered"]
            )
            
            return result
        
        except Exception as e:
            result["processing_time_ms"] = int((time.time() - start_time) * 1000)
            logger.error(
                "Security orchestration failed",
                exc_info=e,
                processing_time_ms=result["processing_time_ms"]
            )
            
            # Fail-closed: block on error
            result["verdict"] = VerdictType.BLOCK.value
            result["confidence"] = 0.5
            result["risk_level"] = "HIGH"
            result["reason"] = "Security analysis failed - blocked as precaution"
            result["error"] = str(e)
            
            return result
    
    async def evaluate_verdict_quality(
        self,
        verdict: Dict[str, Any],
        ground_truth: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate quality of a verdict (for testing/evaluation)
        
        Returns:
            {
                "correct": bool,
                "confidence_calibration": float,
                "explanation_quality": float
            }
        """
        # TODO: Implement evaluation metrics
        return {
            "correct": None,
            "confidence_calibration": None,
            "explanation_quality": None
        }
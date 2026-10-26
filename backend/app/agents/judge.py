"""
Judge Agent - Final verdict
"""

from typing import Dict, Any, List, Optional
import structlog

from app.agents.base import SecurityAgent
from app.ai.prompts import PromptTemplates
from app.security.taxonomy import VerdictType, RiskLevel
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class JudgeAgent(SecurityAgent):
    """
    Judge Agent renders final verdict after weighing both arguments
    """
    
    def __init__(self):
        super().__init__(model=settings.judge_model)
    
    async def analyze(
        self,
        prompt: str,
        triage_result: Dict[str, Any],
        prosecutor_argument: Dict[str, Any],
        defender_argument: Dict[str, Any],
        rag_matches: Optional[List[Dict]] = None,
        ml_score: Optional[float] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Render final verdict
        
        Returns:
            {
                "verdict": "ALLOW|BLOCK|REDACT",
                "confidence": float,
                "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
                "attack_types": List[str],
                "primary_attack_type": str,
                "reason": str,
                "evidence": List[str],
                "recommended_action": str,
                "redacted_prompt": Optional[str],
                "redaction_reason": Optional[str],
                "prosecutor_influence": float,
                "defender_influence": float,
                "rag_influence": float,
                "processing_time_ms": int,
                "model_used": str
            }
        """
        logger.info(
            "Judge analysis started",
            prosecutor_position=prosecutor_argument.get("position"),
            defender_position=defender_argument.get("position"),
            rag_matches_count=len(rag_matches) if rag_matches else 0
        )
        
        # Generate prompt
        messages = PromptTemplates.get_judge_prompt(
            prompt=prompt,
            triage_result=triage_result,
            prosecutor_argument=prosecutor_argument,
            defender_argument=defender_argument,
            rag_matches=rag_matches,
            ml_score=ml_score
        )
        
        # Generate response
        response = await self._generate_response(
            messages=messages,
            temperature=0.2,  # Low temperature for consistent judgments
            max_tokens=2000
        )
        
        result = response["content"]
        
        # Validate response
        required_fields = [
            "verdict", "confidence", "risk_level", "attack_types",
            "reason", "evidence", "recommended_action",
            "prosecutor_influence", "defender_influence", "rag_influence"
        ]
        self._validate_response(result, required_fields)
        
        # Ensure verdict is valid
        try:
            verdict = VerdictType(result["verdict"])
            result["verdict"] = verdict.value
        except ValueError:
            logger.warning(
                "Invalid judge verdict",
                value=result.get("verdict"),
                defaulting_to="BLOCK"
            )
            result["verdict"] = VerdictType.BLOCK.value
        
        # Ensure risk_level is valid
        try:
            risk_level = RiskLevel(result["risk_level"])
            result["risk_level"] = risk_level.value
        except ValueError:
            logger.warning(
                "Invalid risk level",
                value=result.get("risk_level"),
                defaulting_to="MEDIUM"
            )
            result["risk_level"] = RiskLevel.MEDIUM.value
        
        # Ensure lists are lists
        if not isinstance(result.get("attack_types"), list):
            result["attack_types"] = [result.get("attack_types", "other_suspicious")] if result.get("attack_types") else []
        if not isinstance(result.get("evidence"), list):
            result["evidence"] = [result.get("evidence", "No specific evidence provided")]
        
        # Set primary attack type
        if not result.get("primary_attack_type") and result["attack_types"]:
            result["primary_attack_type"] = result["attack_types"][0]
        
        # Add processing metadata
        result["processing_time_ms"] = response["processing_time_ms"]
        result["model_used"] = response["model_used"]
        
        logger.info(
            "Judge verdict rendered",
            verdict=result["verdict"],
            confidence=result["confidence"],
            risk_level=result["risk_level"],
            attack_types=result["attack_types"],
            processing_time_ms=result["processing_time_ms"]
        )
        
        return result
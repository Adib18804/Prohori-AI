"""
Defender Agent - Builds case for allowing
"""

from typing import Dict, Any
import structlog

from app.agents.base import SecurityAgent
from app.ai.prompts import PromptTemplates
from app.security.taxonomy import VerdictType
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class DefenderAgent(SecurityAgent):
    """
    Defender Agent builds the case that a prompt could be benign
    """
    
    def __init__(self):
        super().__init__(model=settings.defender_model)
    
    async def analyze(
        self,
        prompt: str,
        triage_result: Dict[str, Any],
        prosecutor_argument: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Build defense argument
        
        Returns:
            {
                "position": "ALLOW|REDACT",
                "risk_score": float,
                "confidence": float,
                "benign_interpretation": str,
                "missing_context": str,
                "evidence": List[str],
                "reasoning": str,
                "safe_alternative": str,
                "rebuttal": str,
                "processing_time_ms": int,
                "model_used": str
            }
        """
        logger.info(
            "Defender analysis started",
            prosecutor_position=prosecutor_argument.get("position"),
            prosecutor_risk=prosecutor_argument.get("risk_score")
        )
        
        # Generate prompt
        messages = PromptTemplates.get_defender_prompt(
            prompt=prompt,
            triage_result=triage_result,
            prosecutor_argument=prosecutor_argument
        )
        
        # Generate response
        response = await self._generate_response(
            messages=messages,
            temperature=0.5,
            max_tokens=1500
        )
        
        result = response["content"]
        
        # Validate response
        required_fields = [
            "position", "risk_score", "confidence", "benign_interpretation",
            "evidence", "reasoning"
        ]
        self._validate_response(result, required_fields)
        
        # Ensure position is valid
        try:
            position = VerdictType(result["position"])
            result["position"] = position.value
        except ValueError:
            logger.warning(
                "Invalid defender position",
                value=result.get("position"),
                defaulting_to="ALLOW"
            )
            result["position"] = VerdictType.ALLOW.value
        
        # Ensure evidence is a list
        if not isinstance(result.get("evidence"), list):
            result["evidence"] = [result.get("evidence", "No specific evidence provided")]
        
        # Add processing metadata
        result["processing_time_ms"] = response["processing_time_ms"]
        result["model_used"] = response["model_used"]
        
        logger.info(
            "Defender analysis completed",
            position=result["position"],
            risk_score=result["risk_score"],
            confidence=result["confidence"],
            processing_time_ms=result["processing_time_ms"]
        )
        
        return result
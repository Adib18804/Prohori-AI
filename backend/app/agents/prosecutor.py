"""
Prosecutor Agent - Builds case for blocking
"""

from typing import Dict, Any, List, Optional
import structlog

from app.agents.base import SecurityAgent
from app.ai.prompts import PromptTemplates
from app.security.taxonomy import VerdictType
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class ProsecutorAgent(SecurityAgent):
    """
    Prosecutor Agent builds the case that a prompt is malicious
    """
    
    def __init__(self):
        super().__init__(model=settings.prosecutor_model)
    
    async def analyze(
        self,
        prompt: str,
        triage_result: Dict[str, Any],
        rag_matches: Optional[List[Dict]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Build prosecutorial argument
        
        Returns:
            {
                "position": "BLOCK|REDACT",
                "risk_score": float,
                "confidence": float,
                "attack_types": List[str],
                "evidence": List[str],
                "reasoning": str,
                "severity": str,
                "recommended_action": str,
                "processing_time_ms": int,
                "model_used": str,
                "rag_context": dict
            }
        """
        logger.info(
            "Prosecutor analysis started",
            triage_classification=triage_result.get("classification"),
            rag_matches_count=len(rag_matches) if rag_matches else 0
        )
        
        # Generate prompt
        messages = PromptTemplates.get_prosecutor_prompt(
            prompt=prompt,
            triage_result=triage_result,
            rag_matches=rag_matches
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
            "position", "risk_score", "confidence", "attack_types",
            "evidence", "reasoning", "recommended_action"
        ]
        self._validate_response(result, required_fields)
        
        # Ensure position is valid
        try:
            position = VerdictType(result["position"])
            result["position"] = position.value
        except ValueError:
            logger.warning(
                "Invalid prosecutor position",
                value=result.get("position"),
                defaulting_to="BLOCK"
            )
            result["position"] = VerdictType.BLOCK.value
        
        # Ensure lists are lists
        if not isinstance(result.get("attack_types"), list):
            result["attack_types"] = [result.get("attack_types", "other_suspicious")]
        if not isinstance(result.get("evidence"), list):
            result["evidence"] = [result.get("evidence", "No specific evidence provided")]
        
        # Add processing metadata
        result["processing_time_ms"] = response["processing_time_ms"]
        result["model_used"] = response["model_used"]
        result["rag_context"] = {
            "matches_found": len(rag_matches) if rag_matches else 0,
            "top_matches": rag_matches[:3] if rag_matches else []
        }
        
        logger.info(
            "Prosecutor analysis completed",
            position=result["position"],
            risk_score=result["risk_score"],
            confidence=result["confidence"],
            attack_types=result["attack_types"],
            processing_time_ms=result["processing_time_ms"]
        )
        
        return result
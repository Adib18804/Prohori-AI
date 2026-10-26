"""
Triage Agent - Fast initial classification
"""

from typing import Dict, Any
import structlog

from app.agents.base import SecurityAgent
from app.ai.prompts import PromptTemplates
from app.security.taxonomy import TriageClassification
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class TriageAgent(SecurityAgent):
    """
    Triage Agent performs fast initial classification
    Routes requests to full debate or allows directly
    """
    
    def __init__(self):
        super().__init__(model=settings.triage_model)
    
    async def analyze(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """
        Perform triage analysis
        
        Returns:
            {
                "classification": "SAFE|SUSPICIOUS|HIGH_RISK",
                "risk_score": float,
                "requires_debate": bool,
                "attack_types": List[str],
                "confidence": float,
                "reason": str,
                "processing_time_ms": int,
                "model_used": str
            }
        """
        logger.info(
            "Triage analysis started",
            prompt_length=len(prompt),
            model=self.model
        )
        
        # Generate prompt
        messages = PromptTemplates.get_triage_prompt(prompt)
        
        # Generate response
        response = await self._generate_response(
            messages=messages,
            temperature=0.3,  # Lower temperature for classification
            max_tokens=500
        )
        
        result = response["content"]
        
        # Validate response
        required_fields = ["classification", "risk_score", "requires_debate", "confidence", "reason"]
        self._validate_response(result, required_fields)
        
        # Ensure classification is valid
        try:
            classification = TriageClassification(result["classification"])
            result["classification"] = classification.value
        except ValueError:
            logger.warning(
                "Invalid triage classification",
                value=result.get("classification"),
                defaulting_to="SUSPICIOUS"
            )
            result["classification"] = TriageClassification.SUSPICIOUS.value
        
        # Ensure attack_types is a list
        if "attack_types" not in result:
            result["attack_types"] = []
        elif isinstance(result["attack_types"], str):
            result["attack_types"] = [result["attack_types"]]
        
        # Add processing metadata
        result["processing_time_ms"] = response["processing_time_ms"]
        result["model_used"] = response["model_used"]
        
        logger.info(
            "Triage analysis completed",
            classification=result["classification"],
            risk_score=result["risk_score"],
            requires_debate=result["requires_debate"],
            processing_time_ms=result["processing_time_ms"]
        )
        
        return result
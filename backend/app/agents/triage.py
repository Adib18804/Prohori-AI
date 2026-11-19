"""
Triage Agent - Fast initial classification
"""

from typing import Dict, Any, List
import structlog
import time

from app.agents.base import SecurityAgent
from app.ai.prompts import PromptTemplates
from app.security.taxonomy import TriageClassification
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

# Load the local DeBERTa model once at startup (CPU mode)
# device=-1 forces CPU, which is appropriate for the slim Docker image
# IMPORTANT: Model download is ~284MB. Fails gracefully if unavailable.
try:
    from transformers import pipeline
    local_classifier = pipeline(
        "text-classification",
        model="neuralchemy/prompt-injection-deberta",
        device=-1,
    )
    logger.info("Local DeBERTa model loaded successfully")
except Exception as e:
    logger.warning(
        "Failed to load local DeBERTa model - will fall back to LLM only",
        error=str(e),
        note="This is expected if running without internet or in resource-constrained environment"
    )
    local_classifier = None


class TriageAgent(SecurityAgent):
    """
    Triage Agent performs fast initial classification
    Routes requests to full debate or allows directly
    """

    def __init__(self):
        super().__init__(model=settings.triage_model)

    async def analyze(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Perform triage analysis.

        The method first runs a lightweight local DeBERTa classifier. If the
        classifier returns a safe label with high confidence (> 0.90) we short‑circuit
        the request and return a SAFE verdict without invoking the LLM debate.
        Otherwise the request falls back to the existing LLM‑based triage logic.
        """
        start_time = time.time()

        # ---------- Local model shortcut ----------
        if local_classifier is not None:
            try:
                local_result = local_classifier(prompt)[0]
                label = local_result.get("label")
                score = float(local_result.get("score", 0))
                logger.info(
                    "Local DeBERTa classification",
                    prompt_length=len(prompt),
                    label=label,
                    confidence=score,
                )
                if label == "LABEL_0" and score > 0.90:
                    # Safe shortcut – no debate required
                    processing_ms = int((time.time() - start_time) * 1000)
                    safe_result: Dict[str, Any] = {
                        "classification": TriageClassification.SAFE.value,
                        "risk_score": 0.0,
                        "requires_debate": False,
                        "attack_types": [],
                        "confidence": score,
                        "reason": "Local model classified as safe",
                        "processing_time_ms": processing_ms,
                        "model_used": "local-deberta",
                    }
                    logger.info(
                        "Triage shortcut to SAFE",
                        classification=safe_result["classification"],
                        confidence=score,
                        processing_time_ms=processing_ms,
                    )
                    return safe_result
            except Exception as e:
                # Any problem with the local model should not block the request – fall back to LLM
                logger.error("Local classifier failed", error=str(e))

        # ---------- Fallback to LLM triage ----------
        logger.info(
            "Triage analysis started",
            prompt_length=len(prompt),
            model=self.model,
        )

        # Generate prompt for LLM
        messages = PromptTemplates.get_triage_prompt(prompt)

        # Generate response via the base SecurityAgent helper
        response = await self._generate_response(
            messages=messages,
            temperature=0.3,  # Lower temperature for classification
            max_tokens=500,
        )

        result = response["content"]

        # Validate response fields
        required_fields = ["classification", "risk_score", "requires_debate", "confidence", "reason"]
        self._validate_response(result, required_fields)

        # Ensure classification is a valid enum value
        try:
            classification = TriageClassification(result["classification"])
            result["classification"] = classification.value
        except ValueError:
            logger.warning(
                "Invalid triage classification",
                value=result.get("classification"),
                defaulting_to="SUSPICIOUS",
            )
            result["classification"] = TriageClassification.SUSPICIOUS.value

        # Normalise attack_types to a list
        if "attack_types" not in result:
            result["attack_types"] = []
        elif isinstance(result["attack_types"], str):
            result["attack_types"] = [result["attack_types"]]

        # Add processing metadata
        result["processing_time_ms"] = int((time.time() - start_time) * 1000)
        result["model_used"] = response.get("model_used", self.model)

        logger.info(
            "Triage analysis completed",
            classification=result["classification"],
            risk_score=result["risk_score"],
            requires_debate=result["requires_debate"],
            processing_time_ms=result["processing_time_ms"],
        )

        return result

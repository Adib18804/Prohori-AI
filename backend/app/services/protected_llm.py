"""
Protected LLM Service - Forward allowed requests to target LLM
"""

from typing import Optional
import structlog

from app.ai.llm_provider import LLMFactory
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class ProtectedLLMService:
    """
    Service for forwarding allowed requests to the protected LLM.
    Uses Groq (or Mistral fallback) via LLMFactory.
    """

    def __init__(self, model: Optional[str] = None):
        self.model = model or settings.triage_model

    async def generate_response(
        self,
        prompt: str,
        session_id: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate response from protected LLM.
        Uses plain text mode (no JSON) since this is user-facing conversation.
        """
        logger.info(
            "Generating protected LLM response",
            session_id=session_id,
            prompt_length=len(prompt),
            model=self.model,
        )

        try:
            messages = [
                {
                    "role": "system",
                    "content": system_prompt or (
                        "You are a helpful AI assistant. "
                        "Provide accurate, helpful, and safe responses."
                    ),
                },
                {"role": "user", "content": prompt},
            ]

            # No JSON mode — plain text response
            response = await LLMFactory.generate(
                messages=messages,
                model=self.model,
                temperature=0.7,
                max_tokens=2000,
                response_format=None,
            )

            content = response.get("content", "").strip()
            if not content:
                return "I'm here to help. Could you rephrase your question?"

            logger.info(
                "Protected LLM response generated",
                session_id=session_id,
                response_length=len(content),
                tokens_used=response.get("usage", {}).get("total_tokens", 0),
            )

            return content

        except Exception as e:
            logger.error(
                "Protected LLM generation failed",
                exc_info=e,
                session_id=session_id,
            )
            return (
                "I apologize, but I'm unable to generate a response at this "
                "time. Please try again later."
            )
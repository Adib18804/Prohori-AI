"""
Base agent class with JSON fallback
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
import time
import json
import structlog

from app.ai.llm_provider import LLMFactory
from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class SecurityAgent(ABC):
    """
    Base class for all security agents.
    """

    def __init__(self, model: str = None):
        self.model = model
        self.agent_name = self.__class__.__name__

    @abstractmethod
    async def analyze(self, **kwargs) -> Dict[str, Any]:
        pass

    async def _generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> Dict[str, Any]:
        """
        Generate LLM response with JSON retry + plain-text fallback.

        Strategy:
          1) Try JSON mode
          2) If parse fails, retry without JSON mode
          3) Extract JSON from markdown/text
          4) If everything fails, raise — orchestrator will handle
        """

        start_time = time.time()
        supports_json = any(
            x in self.model.lower()
            for x in ["gpt-4", "gpt-3", "turbo", "o1", "o3"]
        )

        # Attempt 1: JSON mode (only for models known to support it well)
        if supports_json:
            try:
                response = await LLMFactory.generate(
                    messages=messages,
                    model=self.model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                )
                processing_time_ms = int((time.time() - start_time) * 1000)

                try:
                    content = json.loads(response["content"])
                except json.JSONDecodeError:
                    content = self._extract_json_from_text(response["content"])

                return {
                    "content": content,
                    "processing_time_ms": processing_time_ms,
                    "model_used": response["model"],
                    "usage": response["usage"],
                }
            except Exception as e:
                logger.warning(
                    "JSON mode failed, retrying plain mode",
                    agent=self.agent_name,
                    model=self.model,
                    error=str(e)[:200],
                )

        # Attempt 2: Plain mode + tolerant JSON extraction
        response = await LLMFactory.generate(
            messages=messages,
            model=self.model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=None,
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        content = self._extract_json_from_text(response["content"])

        return {
            "content": content,
            "processing_time_ms": processing_time_ms,
            "model_used": response["model"],
            "usage": response["usage"],
        }

    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """
        Robust JSON extraction:
          - try ```json ... ``` fences
          - try first { ... last }
          - try curly-brace balancing
        """
        if not text:
            raise ValueError("Empty LLM response")

        # 1) Markdown fence
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            if end > start:
                try:
                    return json.loads(text[start:end].strip())
                except json.JSONDecodeError:
                    pass

        # 2) First '{' to last '}'
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass

        # 3) Balanced braces
        depth = 0
        start = -1
        for i, ch in enumerate(text):
            if ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start >= 0:
                    try:
                        return json.loads(text[start : i + 1])
                    except json.JSONDecodeError:
                        start = -1

        logger.error(
            "Could not extract JSON from response",
            agent=self.agent_name,
            text=text[:500],
        )
        raise ValueError("Failed to parse agent response as JSON")

    def _validate_response(
        self, response: Dict[str, Any], required_fields: List[str]
    ) -> None:
        missing_fields = [f for f in required_fields if f not in response]
        if missing_fields:
            logger.warning(
                "Agent response missing required fields",
                agent=self.agent_name,
                missing_fields=missing_fields,
            )
            for field in missing_fields:
                if "score" in field or "confidence" in field or "influence" in field:
                    response[field] = 0.5
                elif "types" in field:
                    response[field] = []
                elif isinstance(response.get(field), str):
                    response[field] = "Not provided"
                else:
                    response[field] = None
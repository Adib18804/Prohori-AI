"""
LLM provider abstraction layer.

Provider priority:
  - Nova   (primary, when NOVA_API_KEY is configured)
  - Groq   (fallback — free tier)
  - Mistral (fallback — free tier)
  - OpenAI / Anthropic (backward compatibility)
"""
import os
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

import requests
import structlog

from openai import OpenAI
from anthropic import Anthropic

from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


def _resolve_nova_api_key() -> Optional[str]:
    """Resolve the Nova API key from settings or the environment."""
    return getattr(settings, "nova_api_key", None) or os.getenv("NOVA_API_KEY")


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        pass


class NovaProvider(LLMProvider):
    """
    Nova — University AI gateway (unlimited tokens).

    Contract:
      POST {nova_base_url}
      headers: Content-Type: application/json, x-api-key: <NOVA_API_KEY>
      body:    {"prompt": "<user_prompt>", "model": "nova_g"}
      response: {"success": true, "model": "nova_g", "reply": "...", "usage": {...}}

    Model note: 'nova_c' (cognitive/text) is currently disabled gateway-side
    (HTTP 503, code=model_disabled). 'nova_g' is the enabled model id. Both are
    overridable with the NOVA_MODEL env var.
    """

    DEFAULT_MODEL = "nova_g"
    DEFAULT_BASE_URL = "https://nova.zohirrayhan.me/api/chat"
    DEFAULT_TIMEOUT = 60

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or _resolve_nova_api_key()
        if not self.api_key:
            raise ValueError("Nova API key not configured (set NOVA_API_KEY)")

        self.base_url = (
            getattr(settings, "nova_base_url", None)
            or os.getenv("NOVA_BASE_URL")
            or self.DEFAULT_BASE_URL
        )
        self.model = (
            getattr(settings, "nova_model", None)
            or os.getenv("NOVA_MODEL")
            or self.DEFAULT_MODEL
        )

    def _build_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Flatten an OpenAI-style chat history into a single Nova prompt."""
        parts: List[str] = []
        for msg in messages:
            role = (msg.get("role") or "user").lower()
            content = msg.get("content") or ""
            if role == "system":
                parts.append(f"### System Instructions\n{content}")
            elif role == "assistant":
                parts.append(f"### Assistant\n{content}")
            else:
                parts.append(f"### User\n{content}")
        return "\n\n".join(parts)

    def _post_sync(self, prompt: str) -> Dict[str, Any]:
        """Blocking HTTP call to the Nova gateway (run inside a thread)."""
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
        }
        payload = {"prompt": prompt, "model": self.model}

        response = requests.post(
            self.base_url,
            headers=headers,
            json=payload,
            timeout=self.DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # Nova accepts a single `prompt` string, ignores temperature/max_tokens.
        prompt = self._build_prompt(messages)
        try:
            data = await asyncio.to_thread(self._post_sync, prompt)

            # The Nova gateway returns {"reply": "<text>"} (plus optional usage/model).
            content = (data or {}).get("reply", "No response from AI")
            usage = (data or {}).get("usage") or {}

            return {
                "content": content,
                "usage": {
                    "prompt_tokens": usage.get("prompt_tokens", 0),
                    "completion_tokens": usage.get("completion_tokens", 0),
                    "total_tokens": usage.get("total_tokens", 0),
                },
                "model": (data or {}).get("model", self.model),
                "finish_reason": "stop",
            }
        except Exception as e:
            logger.error("Nova generation failed", exc_info=e, model=self.model)
            raise

    def get_provider_name(self) -> str:
        return "nova"


class GroqProvider(LLMProvider):
    """Groq API provider — FREE TIER"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.groq_api_key
        if not self.api_key:
            raise ValueError("Groq API key not configured")
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=settings.groq_base_url,
            timeout=8.0,
        )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if response_format and response_format.get("type") == "json_object":
                kwargs["response_format"] = {"type": "json_object"}

            response = self.client.chat.completions.create(**kwargs)

            return {
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": getattr(response.usage, "prompt_tokens", 0),
                    "completion_tokens": getattr(response.usage, "completion_tokens", 0),
                    "total_tokens": getattr(response.usage, "total_tokens", 0),
                },
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason,
            }
        except Exception as e:
            logger.error("Groq generation failed", exc_info=e, model=model)
            raise

    def get_provider_name(self) -> str:
        return "groq"


class MistralProvider(LLMProvider):
    """Mistral API provider — FREE TIER"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.mistral_api_key
        if not self.api_key:
            raise ValueError("Mistral API key not configured")
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=settings.mistral_base_url,
            timeout=8.0,
        )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if response_format and response_format.get("type") == "json_object":
                kwargs["response_format"] = {"type": "json_object"}

            response = self.client.chat.completions.create(**kwargs)

            return {
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": getattr(response.usage, "prompt_tokens", 0),
                    "completion_tokens": getattr(response.usage, "completion_tokens", 0),
                    "total_tokens": getattr(response.usage, "total_tokens", 0),
                },
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason,
            }
        except Exception as e:
            logger.error("Mistral generation failed", exc_info=e, model=model)
            raise

    def get_provider_name(self) -> str:
        return "mistral"


class GeminiProvider(GroqProvider):
    """Gemini's OpenAI-compatible endpoint, used only when configured."""
    DEFAULT_MODEL = "gemini-1.5-flash"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        if not self.api_key:
            raise ValueError("Gemini API key not configured")
        self.client = OpenAI(api_key=self.api_key, base_url=settings.gemini_base_url, timeout=20.0)

    def get_provider_name(self) -> str:
        return "gemini"


class OpenRouterProvider(GroqProvider):
    """OpenRouter OpenAI-compatible endpoint, used only when configured."""
    DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.openrouter_api_key
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")
        self.client = OpenAI(api_key=self.api_key, base_url=settings.openrouter_base_url, timeout=20.0)

    def get_provider_name(self) -> str:
        return "openrouter"


class OpenAIProvider(LLMProvider):
    """OpenAI API provider (backward compatibility)"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.openai_api_key
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")
        self.client = OpenAI(api_key=self.api_key)

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if response_format and response_format.get("type") == "json_object":
                kwargs["response_format"] = {"type": "json_object"}

            response = self.client.chat.completions.create(**kwargs)

            return {
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason,
            }
        except Exception as e:
            logger.error("OpenAI generation failed", exc_info=e, model=model)
            raise

    def get_provider_name(self) -> str:
        return "openai"


class AnthropicProvider(LLMProvider):
    """Anthropic (Claude) API provider (backward compatibility)"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.anthropic_api_key
        if not self.api_key:
            raise ValueError("Anthropic API key not configured")
        self.client = Anthropic(api_key=self.api_key)

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            system_message = None
            filtered_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    filtered_messages.append(msg)

            kwargs = {
                "model": model,
                "messages": filtered_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if system_message:
                kwargs["system"] = system_message

            response = self.client.messages.create(**kwargs)

            return {
                "content": response.content[0].text,
                "usage": {
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                },
                "model": response.model,
                "finish_reason": response.stop_reason,
            }
        except Exception as e:
            logger.error("Anthropic generation failed", exc_info=e, model=model)
            raise

    def get_provider_name(self) -> str:
        return "anthropic"


class LLMFactory:
    """Factory for creating LLM providers with automatic fallback"""

    @staticmethod
    def get_provider(model: str) -> LLMProvider:
        """
        Select a provider.

        Nova is the PRIMARY provider whenever NOVA_API_KEY is configured,
        regardless of the requested model name. If Nova is not configured,
        fall back to model-name based routing (Groq / Mistral / ...).
        """
        if _resolve_nova_api_key():
            try:
                return NovaProvider()
            except Exception as exc:
                logger.warning(
                    "Nova provider unavailable, falling back to model routing",
                    error=str(exc)[:200],
                )

        model_lower = model.lower()

        # Groq models: llama, mixtral, gemma, gpt-oss, qwen, allam, whisper, prompt-guard
        if any(x in model_lower for x in ["llama", "mixtral", "gemma", "groq", "gpt-oss", "qwen", "allam", "whisper", "prompt-guard", "canopylabs"]):
            return GroqProvider()
        # Mistral models
        elif any(x in model_lower for x in ["mistral", "magistral", "codestral", "ministral", "voxtral"]):
            return MistralProvider()
        # Anthropic models
        elif any(x in model_lower for x in ["claude", "sonnet", "opus", "haiku"]):
            return AnthropicProvider()
        # OpenAI models (only gpt-4/gpt-3 — since gpt-oss already goes to Groq)
        elif any(x in model_lower for x in ["gpt-4", "gpt-3", "turbo", "o1", "o3"]):
            return OpenAIProvider()
        # Unknown — default to Groq
        else:
            logger.warning(f"Unknown model {model}, defaulting to Groq provider")
            return GroqProvider()

    @staticmethod
    async def generate(
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            primary = LLMFactory.get_provider(model)
        except Exception as provider_error:
            primary = None
            logger.warning("Configured primary unavailable; checking fallback providers", error=str(provider_error)[:200])

        # Attempt 1: primary (Nova when configured)
        try:
            return await primary.generate(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=response_format,
            )
        except Exception as primary_error:
            logger.warning(
                "Primary provider failed, attempting fallback",
                primary=primary.get_provider_name() if primary else "unavailable",
                model=model,
                error=str(primary_error)[:200],
            )

        # Continue in the configured fallback order. Missing keys are skipped quietly.
        fallbacks = [
            ("groq", GroqProvider, settings.groq_api_key, "openai/gpt-oss-20b"),
            ("mistral", MistralProvider, settings.mistral_api_key, "mistral-small-latest"),
            ("gemini", GeminiProvider, settings.gemini_api_key, GeminiProvider.DEFAULT_MODEL),
            ("openrouter", OpenRouterProvider, settings.openrouter_api_key, OpenRouterProvider.DEFAULT_MODEL),
        ]
        for name, provider_class, api_key, fallback_model in fallbacks:
            if primary and isinstance(primary, provider_class):
                continue
            if not api_key:
                logger.debug("Skipping unconfigured LLM provider", provider=name)
                continue
            try:
                provider = provider_class()
                logger.info("Trying LLM fallback", provider=name)
                return await provider.generate(
                    messages=messages,
                    model=fallback_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format=response_format,
                )
            except Exception as provider_error:
                logger.warning("LLM fallback failed", provider=name, error=str(provider_error)[:200])

        raise RuntimeError(
            f"All LLM providers failed for model {model}. "
            f"Check API keys and network connectivity."
        )

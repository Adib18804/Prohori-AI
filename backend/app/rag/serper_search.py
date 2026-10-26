"""Optional Serper-backed live threat search. Failures never affect protection."""
import asyncio
from typing import Dict, List

import requests
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)


class SerperSearchService:
    """Fetch a small set of current public references for an attack label."""

    async def search_live_threats(self, query: str) -> List[Dict[str, str]]:
        settings = get_settings()
        if not settings.serper_api_key:
            logger.debug("Skipping live threat search: SERPER_API_KEY is not configured")
            return []
        try:
            response = await asyncio.to_thread(
                requests.post,
                settings.serper_base_url,
                headers={"X-API-KEY": settings.serper_api_key, "Content-Type": "application/json"},
                json={"q": query},
                timeout=10,
            )
            response.raise_for_status()
            results = response.json().get("organic", [])
            return [
                {
                    "title": str(item.get("title", "")),
                    "link": str(item.get("link", "")),
                    "snippet": str(item.get("snippet", "")),
                }
                for item in results[:3]
            ]
        except (requests.RequestException, ValueError, TypeError) as exc:
            logger.warning("Live threat search failed", error=str(exc)[:200])
            return []

"""Simple in-memory token-bucket rate limiter (MVP-grade; use Redis for multi-instance deployments)."""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque


class TokenBucketLimiter:
    def __init__(self, per_minute: int) -> None:
        self.per_minute = max(1, per_minute)
        self._events: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int]:
        """Return (allowed, retry_after_seconds)."""
        now = time.monotonic()
        window = 60.0
        with self._lock:
            q = self._events[key]
            while q and now - q[0] > window:
                q.popleft()
            if len(q) >= self.per_minute:
                retry_after = int(window - (now - q[0])) + 1
                return False, max(retry_after, 1)
            q.append(now)
            return True, 0


_limiter: TokenBucketLimiter | None = None


def get_limiter(per_minute: int) -> TokenBucketLimiter:
    global _limiter
    if _limiter is None or _limiter.per_minute != per_minute:
        _limiter = TokenBucketLimiter(per_minute)
    return _limiter

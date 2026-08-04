"""Token-Bucket Rate Limiter — Module 12: Security Hardening.

Interface-ready for Redis-backed distributed rate limiting.
"""

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, Tuple


class RateLimiter:
    """In-process token-bucket rate limiter (Redis-ready interface)."""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, time.time()))
        self._lock = Lock()

    def is_allowed(self, key: str) -> bool:
        """Check if request is within rate limit.

        Returns:
            True if allowed, False if rate limited.
        """
        with self._lock:
            count, window_start = self._buckets[key]
            now = time.time()
            if now - window_start > self.window_seconds:
                self._buckets[key] = (1, now)
                return True
            if count < self.max_requests:
                self._buckets[key] = (count + 1, window_start)
                return True
            return False


rate_limiter = RateLimiter()

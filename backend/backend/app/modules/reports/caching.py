"""Report Caching & Read Model Readiness Interface.

Provides caching provider abstractions for high-throughput reporting queries, preparing the platform
for Redis caching, Materialized Views, and Data Warehouse read models.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class ReportCacheProvider(ABC):
    """Abstract interface for caching pre-aggregated reporting datasets."""

    @abstractmethod
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached reporting payload by key."""
        pass

    @abstractmethod
    def set(self, key: str, data: Dict[str, Any], ttl_seconds: int = 300) -> bool:
        """Store reporting payload in cache with Time-To-Live (TTL)."""
        pass

    @abstractmethod
    def invalidate(self, pattern: str) -> bool:
        """Invalidate cached reporting entries matching pattern."""
        pass


class InMemoryReportCacheProvider(ReportCacheProvider):
    """Concrete in-memory caching provider implementation for reporting read models."""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        return self._cache.get(key)

    def set(self, key: str, data: Dict[str, Any], ttl_seconds: int = 300) -> bool:
        self._cache[key] = data
        return True

    def invalidate(self, pattern: str) -> bool:
        self._cache.clear()
        return True


report_cache = InMemoryReportCacheProvider()

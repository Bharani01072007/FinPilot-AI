"""Enterprise AI Observability Metrics — Module 9.

Provides interfaces and in-process accumulators for token usage, provider latency, error rates, and cost tracking.
"""

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Dict, List


@dataclass
class AIMetricRecord:
    """Single AI execution metric sample."""
    provider: str
    model: str
    duration_ms: float
    total_tokens: int
    estimated_cost_usd: float
    status: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AIObservabilityMetrics:
    """In-process metrics accumulator for AI Gateway executions.

    Interface-ready for Prometheus / OpenTelemetry exporters.
    """

    def __init__(self):
        self._lock = Lock()
        self._records: List[AIMetricRecord] = []
        self._error_counts: Dict[str, int] = defaultdict(int)

    def record(self, record: AIMetricRecord) -> None:
        with self._lock:
            self._records.append(record)
            if record.status != "SUCCESS":
                self._error_counts[record.provider] += 1
        if len(self._records) > 10000:
            with self._lock:
                self._records = self._records[-5000:]

    def summary(self) -> Dict[str, Any]:
        with self._lock:
            total = len(self._records)
            if total == 0:
                return {"total_executions": 0}
            avg_ms = sum(r.duration_ms for r in self._records) / total
            total_tokens = sum(r.total_tokens for r in self._records)
            total_cost = sum(r.estimated_cost_usd for r in self._records)
            return {
                "total_executions": total,
                "average_duration_ms": round(avg_ms, 2),
                "total_tokens_consumed": total_tokens,
                "total_estimated_cost_usd": round(total_cost, 6),
                "error_counts_by_provider": dict(self._error_counts),
            }


ai_observability_metrics = AIObservabilityMetrics()

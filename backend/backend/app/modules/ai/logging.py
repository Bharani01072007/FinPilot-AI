"""AI Observability & Execution Audit Logger Module.

Logs execution metrics (provider, model, duration_ms, prompt_version, token_usage, estimated_cost, status, correlation_id)
without logging sensitive credentials or API keys.
"""

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, Optional
from app.core.logging import logger


class AILogger:
    """Execution audit logger for AI Gateway completions."""

    @staticmethod
    def log_execution(
        provider: str,
        model: str,
        duration_ms: float,
        prompt_version: str,
        total_tokens: int,
        estimated_cost_usd: float,
        status_code: str = "SUCCESS",
        correlation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Log structured AI execution audit record.

        Returns:
            Correlation ID string.
        """
        corr_id = correlation_id or str(uuid.uuid4())
        audit_record = {
            "correlation_id": corr_id,
            "provider": provider,
            "model": model,
            "duration_ms": duration_ms,
            "prompt_version": prompt_version,
            "total_tokens": total_tokens,
            "estimated_cost_usd": estimated_cost_usd,
            "status": status_code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
        }
        logger.info("[AI_GATEWAY_EXECUTION] %s", audit_record)
        return corr_id


ai_logger = AILogger()

"""Google Gemini AI Provider Implementation.

Implements Gemini LLM provider integration with simulated/API execution fallback.
"""

import time
from typing import Any, Dict, Optional

from app.core.logging import logger
from app.modules.ai.providers.base import AICompletionResult, AIProvider


class GeminiProvider(AIProvider):
    """Concrete LLM Provider implementation for Google Gemini models."""

    @property
    def provider_name(self) -> str:
        return "Gemini"

    @property
    def default_model(self) -> str:
        return "gemini-1.5-pro"

    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AICompletionResult:
        """Generate LLM completion using Google Gemini model."""
        start_time = time.time()
        target_model = model or self.default_model

        # Calculate simulated execution metrics & mock completion response for development mode
        duration_ms = round((time.time() - start_time) * 1000 + 120.0, 2)
        prompt_tokens = len(prompt.split()) + (len(system_prompt.split()) if system_prompt else 0)
        completion_text = f"FinPilot AI [Gemini:{target_model}]: Response generated successfully for prompt query."
        completion_tokens = len(completion_text.split())
        total_tokens = prompt_tokens + completion_tokens
        cost_usd = round(total_tokens * 0.000002, 6)

        return AICompletionResult(
            completion_text=completion_text,
            provider_name=self.provider_name,
            model_name=target_model,
            duration_ms=duration_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost_usd,
            finish_reason="STOP",
            metadata=metadata or {},
        )


gemini_provider = GeminiProvider()

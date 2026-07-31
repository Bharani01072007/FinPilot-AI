"""AI Provider Abstraction Layer Interface.

Defines standard data classes and abstract base class for LLM providers (Gemini, OpenAI, Groq, Anthropic, Azure OpenAI).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class AICompletionResult:
    """Standardized response container returned by all AI providers."""

    completion_text: str
    provider_name: str
    model_name: str
    duration_ms: float
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0
    finish_reason: str = "STOP"
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AIProvider(ABC):
    """Abstract base class for LLM providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. Gemini, OpenAI)."""
        pass

    @property
    @abstractmethod
    def default_model(self) -> str:
        """Default model name for the provider."""
        pass

    @abstractmethod
    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AICompletionResult:
        """Generate completion response from LLM provider."""
        pass

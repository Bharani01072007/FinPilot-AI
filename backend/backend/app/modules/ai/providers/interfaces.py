"""Pluggable Provider Interfaces for Future LLM Providers.

Defines interface definitions for OpenAI, Groq, Anthropic, and Azure OpenAI providers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from app.modules.ai.providers.base import AICompletionResult


class OpenAIProvider(ABC):
    """Interface for OpenAI GPT model completions (GPT-4o, GPT-4-Turbo)."""

    @abstractmethod
    def generate_openai_completion(
        self, prompt: str, system_prompt: Optional[str] = None, model: str = "gpt-4o", temperature: float = 0.7
    ) -> AICompletionResult:
        pass


class GroqProvider(ABC):
    """Interface for Groq high-speed Llama 3 model completions."""

    @abstractmethod
    def generate_groq_completion(
        self, prompt: str, system_prompt: Optional[str] = None, model: str = "llama3-70b-8192", temperature: float = 0.7
    ) -> AICompletionResult:
        pass


class AnthropicProvider(ABC):
    """Interface for Anthropic Claude model completions (Claude 3.5 Sonnet)."""

    @abstractmethod
    def generate_claude_completion(
        self, prompt: str, system_prompt: Optional[str] = None, model: str = "claude-3-5-sonnet-20240620", temperature: float = 0.7
    ) -> AICompletionResult:
        pass


class AzureOpenAIProvider(ABC):
    """Interface for Enterprise Azure OpenAI Service deployments."""

    @abstractmethod
    def generate_azure_completion(
        self, prompt: str, deployment_id: str, system_prompt: Optional[str] = None, temperature: float = 0.7
    ) -> AICompletionResult:
        pass

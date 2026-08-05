"""AI Gateway Central Routing & Provider Selection Engine.

Serves as the single entry point for all AI model completion requests in FinPilot AI.
Enforces provider routing, security guardrails, context assembly, prompt template management, and audit logging.
"""

from typing import Any, Dict, Optional
from app.core.exceptions import BaseAppException
from app.modules.ai.context import context_builder
from app.modules.ai.guardrails import ai_guardrail
from app.modules.ai.logging import ai_logger
from app.modules.ai.prompts.engine import prompt_manager
from app.modules.ai.providers.base import AICompletionResult, AIProvider
from app.modules.ai.providers.gemini import gemini_provider


from app.modules.ai.providers.groq import groq_provider


class AIGateway:
    """Central AI Gateway routing and orchestrating AI completions."""

    def __init__(self, default_provider: Optional[AIProvider] = None):
        self._providers: Dict[str, AIProvider] = {
            "gemini": gemini_provider,
            "groq": groq_provider,
        }
        self._default_provider = default_provider or groq_provider

    def register_provider(self, name: str, provider: AIProvider) -> None:
        """Register a new LLM provider with the gateway."""
        self._providers[name.lower()] = provider

    def get_provider(self, provider_name: Optional[str] = None) -> AIProvider:
        """Fetch target provider or default provider."""
        if not provider_name:
            return self._default_provider

        prov = self._providers.get(provider_name.lower())
        if not prov:
            raise BaseAppException(message=f"Unsupported AI provider '{provider_name}'", status_code=400)
        return prov

    def list_providers(self) -> Dict[str, Any]:
        """List registered AI providers and supported default models."""
        return {
            "active_providers": [
                {
                    "name": p.provider_name,
                    "default_model": p.default_model,
                    "status": "HEALTHY",
                }
                for p in self._providers.values()
            ],
            "default_provider": self._default_provider.provider_name,
        }

    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        prompt_key: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None,
        provider_name: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AICompletionResult:
        """Orchestrate security validation, context building, prompt rendering, provider routing, and audit logging."""
        prompt_version = "1.0.0-DIRECT"

        # 1. Assemble Context & Prompt Manager Rendering
        if prompt_key:
            clean_context = context_builder.build_context(context_data or {})
            sys_p, prompt_body, p_ver = prompt_manager.render(prompt_key, clean_context)
            system_prompt = system_prompt or sys_p
            prompt = prompt_body
            prompt_version = p_ver

        # 2. Security Guardrails: Prompt Injection Protection & PII Redaction
        validated_prompt = ai_guardrail.validate_request(prompt)

        # 3. Provider Routing & Execution
        provider = self.get_provider(provider_name)
        result = provider.generate_completion(
            prompt=validated_prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            metadata=metadata,
        )

        # 4. Observability & Audit Logging
        ai_logger.log_execution(
            provider=result.provider_name,
            model=result.model_name,
            duration_ms=result.duration_ms,
            prompt_version=prompt_version,
            total_tokens=result.total_tokens,
            estimated_cost_usd=result.estimated_cost_usd,
            status_code="SUCCESS",
            metadata=metadata,
        )

        return result


ai_gateway = AIGateway()

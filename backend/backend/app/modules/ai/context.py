"""AI Context Assembly Builder Module.

Assembles contextual data payloads for LLM prompts while stripping sensitive credential keys and redacting PII data.
"""

from typing import Any, Dict, Set
from app.modules.ai.guardrails import ai_guardrail

EXCLUDED_SENSITIVE_KEYS: Set[str] = {
    "password",
    "password_hash",
    "refresh_token",
    "secret_key",
    "access_token",
    "jwt_token",
    "api_key",
    "private_key",
}


class ContextBuilder:
    """Context assembly builder stripping sensitive credentials and redacting PII."""

    @staticmethod
    def build_context(data: Dict[str, Any]) -> Dict[str, Any]:
        """Assemble clean context dictionary stripping sensitive keys and redacting PII string values.

        Returns:
            Sanitized context dictionary.
        """
        clean_ctx: Dict[str, Any] = {}
        for key, val in data.items():
            if key.lower().strip() in EXCLUDED_SENSITIVE_KEYS:
                continue

            if isinstance(val, str):
                clean_ctx[key] = ai_guardrail.redact_pii(val)
            elif isinstance(val, dict):
                clean_ctx[key] = ContextBuilder.build_context(val)
            else:
                clean_ctx[key] = val

        return clean_ctx


context_builder = ContextBuilder()

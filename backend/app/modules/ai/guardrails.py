"""AI Security Guardrails & Policy Enforcement Module.

Enforces prompt injection detection, PII data redaction, input/output validation, token length limits, and policy compliance.
"""

import re
from typing import Set, Tuple
from app.core.exceptions import BaseAppException

# Prompt injection jailbreak signatures
PROMPT_INJECTION_PATTERNS: Set[str] = {
    "ignore previous instructions",
    "ignore all previous instructions",
    "system override",
    "bypass safety filters",
    "act as dan",
    "jailbreak mode",
    "reveal internal system prompt",
    "forget all rules",
}

# PII Regex Patterns
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_REGEX = re.compile(r"\b\d{10}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b")
CARD_REGEX = re.compile(r"\b(?:\d[ -]*?){13,16}\b")
AADHAAR_REGEX = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")


class AIGuardrail:
    """Security guardrail engine detecting malicious prompts and redacting PII data."""

    @staticmethod
    def detect_prompt_injection(prompt: str) -> Tuple[bool, str]:
        """Check prompt text for jailbreak and injection signatures.

        Returns:
            Tuple of (is_injection_detected, matched_pattern).
        """
        prompt_lower = prompt.lower()
        for pattern in PROMPT_INJECTION_PATTERNS:
            if pattern in prompt_lower:
                return True, pattern
        return False, ""

    @staticmethod
    def redact_pii(text: str) -> str:
        """Redact sensitive Personal Identifiable Information (PII) from prompt context."""
        text_clean = EMAIL_REGEX.sub("[REDACTED_EMAIL]", text)
        text_clean = PHONE_REGEX.sub("[REDACTED_PHONE]", text_clean)
        text_clean = CARD_REGEX.sub("[REDACTED_CARD]", text_clean)
        text_clean = AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", text_clean)
        return text_clean

    @classmethod
    def validate_request(cls, prompt: str, max_allowed_chars: int = 32000) -> str:
        """Validate input prompt against injection signatures and length limits, returning redacted prompt.

        Raises:
            BaseAppException 400 if prompt injection detected or length limit exceeded.
        """
        if not prompt or not prompt.strip():
            raise BaseAppException(message="Prompt string cannot be empty", status_code=400)

        if len(prompt) > max_allowed_chars:
            raise BaseAppException(message=f"Prompt exceeds maximum character limit of {max_allowed_chars}", status_code=400)

        is_injection, matched = cls.detect_prompt_injection(prompt)
        if is_injection:
            raise BaseAppException(message=f"Security Guardrail Triggered: Potential prompt injection pattern detected ('{matched}')", status_code=400)

        return cls.redact_pii(prompt)


ai_guardrail = AIGuardrail()

"""AI Prompt Management & Version Control Engine Module.

Manages reusable prompt templates, variable placeholder substitution, metadata, and versioning.
"""

import re
from typing import Any, Dict, Optional, Tuple

PREDEFINED_PROMPTS: Dict[str, Dict[str, Any]] = {
    "DOCUMENT_CLASSIFICATION": {
        "version": "1.0.0",
        "system_prompt": "You are a financial document classification specialist for FinPilot AI.",
        "template": "Analyze the following document text and classify its type (e.g. Aadhaar, PAN, Bank Statement):\n\n{{document_text}}",
    },
    "FINANCIAL_RISK_ANALYSIS": {
        "version": "1.1.0",
        "system_prompt": "You are an enterprise credit risk assessment assistant.",
        "template": "Evaluate financial risk for customer {{customer_name}} with requested loan amount {{loan_amount}} and annual income {{annual_income}}.",
    },
    "APPLICATION_SUMMARIZATION": {
        "version": "1.0.0",
        "system_prompt": "You are an executive summary generator for financial operations.",
        "template": "Generate an executive summary for application {{application_number}} submitted by {{customer_name}} under loan type {{loan_type}}.",
    },
    "COMPLIANCE_VERIFICATION": {
        "version": "1.2.0",
        "system_prompt": "You are a regulatory compliance verification officer.",
        "template": "Verify compliance rules for document category {{category}} submitted for application {{application_number}}.",
    },
}

PLACEHOLDER_REGEX = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


class PromptManager:
    """Prompt template rendering engine managing placeholders, metadata, and versioning."""

    @staticmethod
    def render(prompt_key: str, context: Dict[str, Any]) -> Tuple[str, str, str]:
        """Render system prompt, prompt body, and prompt version for a template key.

        Returns:
            Tuple of (system_prompt, rendered_prompt_body, prompt_version).
        """
        template_def = PREDEFINED_PROMPTS.get(prompt_key)
        if not template_def:
            system_prompt = context.get("system_prompt", "You are an AI assistant for FinPilot AI.")
            prompt_body = context.get("prompt", "Please respond to the user query.")
            return system_prompt, prompt_body, "1.0.0-CUSTOM"

        system_prompt = template_def["system_prompt"]
        raw_template = template_def["template"]
        version = template_def["version"]

        def _substitute(match: re.Match) -> str:
            var_name = match.group(1)
            val = context.get(var_name)
            return str(val) if val is not None else ""

        rendered_body = PLACEHOLDER_REGEX.sub(_substitute, raw_template)
        return system_prompt, rendered_body, version


prompt_manager = PromptManager()

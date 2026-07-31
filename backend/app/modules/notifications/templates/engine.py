"""Notification Template Rendering Engine Module.

Provides reusable message templates with placeholder substitution logic, safe fallbacks, and template caching.
"""

import re
from typing import Any, Dict, Tuple

PREDEFINED_TEMPLATES: Dict[str, Dict[str, str]] = {
    "APPLICATION_ASSIGNED": {
        "title": "Application Assigned",
        "body": "Hello {{customer_name}}, your application {{application_number}} has been assigned to an officer.",
    },
    "APPLICATION_APPROVED": {
        "title": "Application Approved",
        "body": "Hello {{customer_name}}, congratulations! Your application {{application_number}} has been approved.",
    },
    "APPLICATION_REJECTED": {
        "title": "Application Status Update",
        "body": "Hello {{customer_name}}, your application {{application_number}} status has been updated to {{status}}.",
    },
    "DOCUMENTS_REQUESTED": {
        "title": "Action Required: Documents Pending",
        "body": "Hello {{customer_name}}, additional documents are required for your application {{application_number}}.",
    },
    "DOCUMENT_VERIFIED": {
        "title": "Document Verification Update",
        "body": "Hello {{customer_name}}, your uploaded document verification status is now {{status}}.",
    },
    "PASSWORD_CHANGED": {
        "title": "Security Alert: Password Changed",
        "body": "Hello {{customer_name}}, your password was updated successfully. If you did not perform this action, contact support immediately.",
    },
    "USER_CREATED": {
        "title": "Welcome to FinPilot AI",
        "body": "Welcome to FinPilot AI, {{customer_name}}! Your account has been initialized successfully.",
    },
}

# Matches {{ placeholder_name }}
PLACEHOLDER_REGEX = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


class NotificationTemplateEngine:
    """Template rendering engine substituting double-brace placeholders with safe fallbacks."""

    @staticmethod
    def render(template_key: str, context: Dict[str, Any]) -> Tuple[str, str]:
        """Render title and body for a template key using context dictionary values with safe fallbacks.

        Returns:
            Tuple of (title, rendered_body).
        """
        template_def = PREDEFINED_TEMPLATES.get(template_key)
        if not template_def:
            title = context.get("title", "System Notification")
            body = context.get("body", "You have a new system notification.")
            return title, body

        raw_title = template_def["title"]
        raw_body = template_def["body"]

        def _substitute(match: re.Match) -> str:
            var_name = match.group(1)
            val = context.get(var_name)
            return str(val) if val is not None else ""

        rendered_title = PLACEHOLDER_REGEX.sub(_substitute, raw_title)
        rendered_body = PLACEHOLDER_REGEX.sub(_substitute, raw_body)

        return rendered_title, rendered_body


template_engine = NotificationTemplateEngine()

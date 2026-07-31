"""User Communication Preferences Architecture Module.

Defines channel preference settings (In-App, Email, SMS, WhatsApp, Push) and event opt-in validation.
"""

from dataclasses import dataclass, field
from typing import Dict, Set


@dataclass
class UserNotificationPreferences:
    """User communication channel preference settings DTO."""

    user_id: str
    in_app_enabled: bool = True
    email_enabled: bool = True
    sms_enabled: bool = False
    whatsapp_enabled: bool = False
    push_enabled: bool = False
    disabled_events: Set[str] = field(default_factory=set)

    def is_channel_enabled(self, channel: str) -> bool:
        """Check if target communication channel is enabled."""
        channel_lower = channel.lower().strip()
        if channel_lower == "in_app":
            return self.in_app_enabled
        elif channel_lower == "email":
            return self.email_enabled
        elif channel_lower == "sms":
            return self.sms_enabled
        elif channel_lower == "whatsapp":
            return self.whatsapp_enabled
        elif channel_lower == "push":
            return self.push_enabled
        return True

    def is_event_enabled(self, event_name: str) -> bool:
        """Check if user opted in for target event notification."""
        return event_name not in self.disabled_events


def get_user_preferences(user_id: str) -> UserNotificationPreferences:
    """Fetch user communication channel preferences (defaults to enabled)."""
    return UserNotificationPreferences(user_id=user_id)

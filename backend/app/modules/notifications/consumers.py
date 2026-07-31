"""Notification Event Consumer Layer Module.

Consumes Business Events emitted across FinPilot AI modules, checks user preferences,
renders templates safely, and dispatches matching In-App notifications.
"""

from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.database.enums import NotificationType, Priority
from app.modules.notifications.preferences import get_user_preferences
from app.modules.notifications.providers.in_app import in_app_provider
from app.modules.notifications.templates.engine import template_engine


class NotificationEventConsumer:
    """Consumer mapping domain business events to rendered template notification dispatches."""

    def __init__(self, provider=None, engine=None):
        self.provider = provider or in_app_provider
        self.engine = engine or template_engine

    def handle_event(self, event_name: str, payload: Dict[str, Any], db: Optional[Session] = None) -> bool:
        """Handle incoming domain business event and generate appropriate notification.

        Args:
            event_name: Business event identifier (e.g. ApplicationAssigned).
            payload: Event metadata context dictionary.
            db: Optional active SQLAlchemy Session.
        """
        recipient_id = payload.get("customer_id") or payload.get("user_id") or payload.get("actor_id")
        if not recipient_id:
            logger.warning("[EVENT_CONSUMER] Missing recipient_id in event payload for '%s'", event_name)
            return False

        # User Preferences Opt-In Check
        prefs = get_user_preferences(recipient_id)
        if not prefs.is_channel_enabled("in_app") or not prefs.is_event_enabled(event_name):
            logger.info("[EVENT_CONSUMER] User '%s' opted out of notification for event '%s'", recipient_id, event_name)
            return False

        template_key = None
        notif_type = NotificationType.APPLICATION
        priority = Priority.MEDIUM

        if event_name == "ApplicationAssigned":
            template_key = "APPLICATION_ASSIGNED"
            priority = Priority.HIGH
        elif event_name == "ApplicationStatusChanged":
            status_val = payload.get("to_status", "")
            if status_val == "APPROVED":
                template_key = "APPLICATION_APPROVED"
                priority = Priority.HIGH
            elif status_val == "REJECTED":
                template_key = "APPLICATION_REJECTED"
                priority = Priority.HIGH
            else:
                template_key = "APPLICATION_ASSIGNED"
        elif event_name == "DocumentVerified":
            template_key = "DOCUMENT_VERIFIED"
            notif_type = NotificationType.DOCUMENT
        elif event_name == "PasswordChanged":
            template_key = "PASSWORD_CHANGED"
            notif_type = NotificationType.SYSTEM
            priority = Priority.HIGH
        elif event_name == "UserCreated":
            template_key = "USER_CREATED"
            notif_type = NotificationType.SYSTEM

        try:
            if not template_key:
                title = f"Update: {event_name}"
                body = f"A new activity ({event_name}) was recorded for your account."
            else:
                title, body = self.engine.render(template_key, payload)

            return self.provider.send(
                recipient_id=recipient_id,
                title=title,
                message=body,
                notification_type=notif_type,
                priority=priority,
                db=db,
            )
        except Exception as e:
            logger.error("[EVENT_PROCESSING_FAILURE] Event '%s' processing failed: %s", event_name, e)
            return False


notification_consumer = NotificationEventConsumer()

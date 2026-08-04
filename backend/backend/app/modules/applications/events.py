"""Application Domain Business Events Architecture Module.

Defines business events emitted during application creation, assignment, status transition, and completion.
Prepares event infrastructure for future Notification, OCR, and AI Agent event listeners.
"""

from datetime import datetime, timezone
from typing import Any, Dict
from app.core.logging import logger


class ApplicationEvents:
    APPLICATION_CREATED = "ApplicationCreated"
    APPLICATION_ASSIGNED = "ApplicationAssigned"
    APPLICATION_REASSIGNED = "ApplicationReassigned"
    APPLICATION_UNASSIGNED = "ApplicationUnassigned"
    APPLICATION_STATUS_CHANGED = "ApplicationStatusChanged"
    APPLICATION_COMPLETED = "ApplicationCompleted"
    APPLICATION_CANCELLED = "ApplicationCancelled"


def publish_application_event(
    event_name: str,
    application_id: str,
    actor_id: str,
    payload: Dict[str, Any],
) -> None:
    """Publish a structured business event to logger / event hub.

    Args:
        event_name: Business event identifier.
        application_id: Target application UUID.
        actor_id: Initiating user UUID.
        payload: Event payload details.
    """
    event_data = {
        "event_name": event_name,
        "application_id": application_id,
        "actor_id": actor_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }
    logger.info("[BUSINESS_EVENT] %s: %s", event_name, event_data)

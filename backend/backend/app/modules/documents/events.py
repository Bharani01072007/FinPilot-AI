"""Document Domain Business Events Architecture Module.

Defines business events emitted during document upload, verification, versioning, vault reuse, and expiration.
Prepares event infrastructure for future OCR, AI Extraction, and Compliance Engine listeners.
"""

from datetime import datetime, timezone
from typing import Any, Dict
from app.core.logging import logger


class DocumentEvents:
    DOCUMENT_UPLOADED = "DocumentUploaded"
    DOCUMENT_VERIFIED = "DocumentVerified"
    DOCUMENT_REJECTED = "DocumentRejected"
    DOCUMENT_VERSION_CREATED = "DocumentVersionCreated"
    DOCUMENT_EXPIRED = "DocumentExpired"
    DOCUMENT_REUSED = "DocumentReused"


def publish_document_event(
    event_name: str,
    document_id: str,
    actor_id: str,
    payload: Dict[str, Any],
) -> None:
    """Publish a structured document business event to logger / event hub.

    Args:
        event_name: Business event identifier.
        document_id: Target document UUID.
        actor_id: Initiating user UUID.
        payload: Event payload details.
    """
    event_data = {
        "event_name": event_name,
        "document_id": document_id,
        "actor_id": actor_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }
    logger.info("[BUSINESS_EVENT] %s: %s", event_name, event_data)

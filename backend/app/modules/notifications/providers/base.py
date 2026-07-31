"""Notification Provider Abstraction Layer Interface.

Defines the contract for all communication channel providers (In-App, Email, SMS, WhatsApp, Push, Webhook).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.database.enums import NotificationType, Priority


class NotificationProvider(ABC):
    """Abstract base class for notification communication channel providers."""

    @abstractmethod
    def send(
        self,
        recipient_id: str,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM,
        priority: Priority = Priority.MEDIUM,
        metadata: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None,
    ) -> bool:
        """Send notification via communication channel provider.

        Returns:
            True if notification successfully dispatched or persisted.
        """
        pass

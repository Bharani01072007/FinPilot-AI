"""In-App Notification Provider Implementation.

Persists notification records directly into database 'notifications' table.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.database.enums import NotificationType, Priority
from app.database.session import SessionLocal
from app.modules.notifications.models import Notification
from app.modules.notifications.providers.base import NotificationProvider


class InAppNotificationProvider(NotificationProvider):
    """Concrete provider implementing In-App database notification dispatch."""

    def __init__(self, db: Optional[Session] = None):
        self.db = db

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
        """Persist In-App notification record into database."""
        session = db or self.db
        should_close = False
        if not session:
            try:
                session = SessionLocal()
                should_close = True
            except Exception as e:
                logger.warning("SessionLocal unavailable in environment: %s", e)
                return False

        try:
            now = datetime.now(timezone.utc)
            notification = Notification(
                user_id=recipient_id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                read_status=False,
                is_sent=True,
                sent_at=now,
            )
            session.add(notification)
            session.commit()
            return True
        except Exception as e:
            logger.error("Failed to persist In-App notification: %s", e)
            try:
                session.rollback()
            except Exception:
                pass
            return False
        finally:
            if should_close and session:
                try:
                    session.close()
                except Exception:
                    pass


in_app_provider = InAppNotificationProvider()

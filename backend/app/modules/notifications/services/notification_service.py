"""Notification Management Business Logic Service Module.

Encapsulates notification dispatching, provider abstraction integration, read/unread state updates,
unread analytics queries, and audit logging.
"""

import math
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BaseAppException, ForbiddenException, NotFoundException
from app.modules.audit.models import AuditLog
from app.modules.identity.models import User
from app.modules.notifications.models import Notification
from app.modules.notifications.providers.in_app import in_app_provider
from app.modules.notifications.repositories.notification_repository import NotificationRepository
from app.modules.notifications.schemas.notification import (
    NotificationCreateRequest,
    NotificationListResponse,
    NotificationResponse,
    NotificationSearchFilter,
    NotificationUnreadCountResponse,
)


class NotificationService:
    """Service handling notification operations, channel provider dispatch, and unread analytics."""

    def __init__(
        self,
        notif_repo: Optional[NotificationRepository] = None,
        provider: Optional[Any] = None,
    ):
        self.notif_repo = notif_repo or NotificationRepository()
        self.provider = provider or in_app_provider

    def _log_audit_event(
        self,
        db: Session,
        action: str,
        actor_id: str,
        target_notif_id: str,
        recipient_user_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log a notification infrastructure action into audit_logs."""
        audit_entry = AuditLog(
            user_id=actor_id,
            entity="Notification",
            entity_id=target_notif_id,
            action=action,
            new_value={"recipient_id": recipient_user_id, **(details or {})},
        )
        db.add(audit_entry)
        db.commit()

    def create_notification(self, db: Session, req: NotificationCreateRequest, actor_id: str) -> NotificationResponse:
        """Create and dispatch a notification via In-App provider."""
        dispatched = self.provider.send(
            recipient_id=req.user_id,
            title=req.title,
            message=req.message,
            notification_type=req.notification_type,
            priority=req.priority,
            db=db,
        )
        if not dispatched:
            raise BaseAppException(message="Failed to dispatch notification via provider", status_code=500)

        # Retrieve created notification record
        filters = NotificationSearchFilter(page=1, page_size=1)
        items, _ = self.notif_repo.search_notifications(db, req.user_id, filters)
        notif = items[0] if items else Notification(user_id=req.user_id, title=req.title, message=req.message, notification_type=req.notification_type, priority=req.priority)

        self._log_audit_event(
            db, action="Notification Created", actor_id=actor_id, target_notif_id=getattr(notif, "id", "NEW"), recipient_user_id=req.user_id, details={"title": req.title}
        )

        return NotificationResponse.model_validate(notif)

    def get_notification_by_id(self, db: Session, notif_id: str, current_user: User) -> NotificationResponse:
        """Fetch notification by ID with access permission validation."""
        notif = self.notif_repo.get_by_id(db, notif_id)
        if not notif:
            raise NotFoundException(message="Notification not found")

        # Permission check: Users can only access their own notifications
        user_roles = [ur.role.name for ur in current_user.user_roles if ur.role]
        if "Admin" not in user_roles and notif.user_id != current_user.id:
            raise ForbiddenException(message="Permission denied to access this notification")

        return NotificationResponse.model_validate(notif)

    def mark_as_read(self, db: Session, notif_id: str, current_user: User) -> NotificationResponse:
        """Mark notification as READ."""
        notif = self.notif_repo.get_by_id(db, notif_id)
        if not notif:
            raise NotFoundException(message="Notification not found")

        if notif.user_id != current_user.id:
            raise ForbiddenException(message="Permission denied")

        updated = self.notif_repo.mark_read(db, notif)
        self._log_audit_event(
            db, action="Notification Read", actor_id=current_user.id, target_notif_id=notif.id, recipient_user_id=notif.user_id
        )
        return NotificationResponse.model_validate(updated)

    def mark_as_unread(self, db: Session, notif_id: str, current_user: User) -> NotificationResponse:
        """Mark notification as UNREAD."""
        notif = self.notif_repo.get_by_id(db, notif_id)
        if not notif:
            raise NotFoundException(message="Notification not found")

        if notif.user_id != current_user.id:
            raise ForbiddenException(message="Permission denied")

        updated = self.notif_repo.mark_unread(db, notif)
        return NotificationResponse.model_validate(updated)

    def archive_notification(self, db: Session, notif_id: str, current_user: User) -> NotificationResponse:
        """Archive notification."""
        notif = self.notif_repo.get_by_id(db, notif_id)
        if not notif:
            raise NotFoundException(message="Notification not found")

        if notif.user_id != current_user.id:
            raise ForbiddenException(message="Permission denied")

        updated = self.notif_repo.archive_notification(db, notif)
        self._log_audit_event(
            db, action="Notification Archived", actor_id=current_user.id, target_notif_id=notif.id, recipient_user_id=notif.user_id
        )
        return NotificationResponse.model_validate(updated)

    def delete_notification(self, db: Session, notif_id: str, current_user: User) -> None:
        """Soft delete notification."""
        notif = self.notif_repo.get_by_id(db, notif_id)
        if not notif:
            raise NotFoundException(message="Notification not found")

        if notif.user_id != current_user.id:
            raise ForbiddenException(message="Permission denied")

        self.notif_repo.soft_delete_notification(db, notif)
        self._log_audit_event(
            db, action="Notification Deleted", actor_id=current_user.id, target_notif_id=notif.id, recipient_user_id=notif.user_id
        )

    def get_unread_count(self, db: Session, user_id: str) -> NotificationUnreadCountResponse:
        """Return fast scalar count of unread notifications for a user."""
        count = self.notif_repo.get_unread_count(db, user_id)
        return NotificationUnreadCountResponse(unread_count=count)

    def mark_all_as_read(self, db: Session, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        count = self.notif_repo.mark_all_read(db, user_id)
        self._log_audit_event(db, action="All Notifications Marked Read", actor_id=user_id, target_notif_id="", recipient_user_id=user_id)
        return count

    def clear_all_notifications(self, db: Session, user_id: str) -> int:
        """Clear/delete all notifications for a user."""
        count = self.notif_repo.clear_all_notifications(db, user_id)
        self._log_audit_event(db, action="All Notifications Cleared", actor_id=user_id, target_notif_id="", recipient_user_id=user_id)
        return count

    def search_notifications(self, db: Session, user_id: str, filters: NotificationSearchFilter) -> NotificationListResponse:
        """Search and paginate notifications for recipient user."""
        items, total = self.notif_repo.search_notifications(db, user_id, filters)
        total_pages = math.ceil(total / filters.page_size) if total > 0 else 0

        responses = [NotificationResponse.model_validate(n) for n in items]
        return NotificationListResponse(
            items=responses,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages,
        )


notification_service = NotificationService()

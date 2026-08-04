"""Notification Repository Module.

Provides data access logic for Notification model queries, unread counts, status updates, and search.
"""

from typing import Any, List, Optional, Tuple
from sqlalchemy import or_, func, desc, asc
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas.notification import NotificationSearchFilter


class NotificationRepository(BaseRepository[Notification, Any, Any]):
    """Repository managing database queries for notifications."""

    def __init__(self):
        super().__init__(model=Notification)

    def get_by_id(self, db: Session, notif_id: str) -> Optional[Notification]:
        """Fetch notification by ID."""
        return db.query(Notification).filter(Notification.id == notif_id, Notification.is_deleted == False).first()

    def get_unread_count(self, db: Session, user_id: str) -> int:
        """Fast scalar query computing total unread notifications for a user."""
        return (
            db.query(func.count(Notification.id))
            .filter(
                Notification.user_id == user_id,
                Notification.read_status == False,
                Notification.is_active == True,
                Notification.is_deleted == False,
            )
            .scalar()
            or 0
        )

    def mark_read(self, db: Session, notification: Notification) -> Notification:
        """Mark notification as READ."""
        notification.read_status = True
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def mark_unread(self, db: Session, notification: Notification) -> Notification:
        """Mark notification as UNREAD."""
        notification.read_status = False
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def archive_notification(self, db: Session, notification: Notification) -> Notification:
        """Archive notification."""
        notification.is_active = False
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def soft_delete_notification(self, db: Session, notification: Notification) -> None:
        """Soft delete notification."""
        notification.is_deleted = True
        notification.is_active = False
        db.add(notification)
        db.commit()

    def search_notifications(self, db: Session, user_id: str, filters: NotificationSearchFilter) -> Tuple[List[Notification], int]:
        """Search, filter, sort, and paginate active notifications for a recipient user.

        Returns:
            Tuple of (List[Notification], total_count).
        """
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_deleted == False,
        )

        # 1. Search (Title, Message)
        if filters.search and filters.search.strip():
            term = f"%{filters.search.strip()}%"
            query = query.filter(
                or_(
                    Notification.title.ilike(term),
                    Notification.message.ilike(term),
                )
            )

        # 2. Filters
        if filters.notification_type:
            query = query.filter(Notification.notification_type == filters.notification_type)

        if filters.read_status is not None:
            query = query.filter(Notification.read_status == filters.read_status)

        if filters.priority:
            query = query.filter(Notification.priority == filters.priority)

        if filters.date_from:
            query = query.filter(Notification.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Notification.created_at <= filters.date_to)

        total_count = query.count()

        # 3. Sorting
        sort_col = getattr(Notification, filters.sort_by, Notification.created_at)
        if filters.sort_order.lower() == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        # 4. Pagination
        skip = (filters.page - 1) * filters.page_size
        items = query.offset(skip).limit(filters.page_size).all()

        return items, total_count

"""Notification Domain Pydantic Schemas.

Defines request/response DTOs for notifications, unread counts, search filters, and pagination.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database.enums import NotificationType, Priority


class NotificationCreateRequest(BaseModel):
    """Payload for creating a new notification."""

    user_id: str = Field(..., description="Target recipient User UUID")
    title: str = Field(..., min_length=1, max_length=255, description="Notification title")
    message: str = Field(..., min_length=1, description="Notification message body")
    notification_type: NotificationType = Field(default=NotificationType.SYSTEM, description="Notification category type")
    priority: Priority = Field(default=Priority.MEDIUM, description="Notification priority level")


class NotificationResponse(BaseModel):
    """Notification entity detail response schema."""

    id: str
    tenant_id: Optional[str] = None
    user_id: str
    title: str
    message: str
    notification_type: NotificationType
    priority: Priority
    read_status: bool
    is_sent: bool
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationUnreadCountResponse(BaseModel):
    """Unread notifications count response model."""

    unread_count: int = Field(..., description="Total unread notifications count for current user")


class NotificationListResponse(BaseModel):
    """Paginated notifications search list response model."""

    items: List[NotificationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class NotificationSearchFilter(BaseModel):
    """Filter parameters for querying user notifications."""

    search: Optional[str] = Field(default=None, description="Search term across title or message")
    notification_type: Optional[NotificationType] = Field(default=None)
    read_status: Optional[bool] = Field(default=None)
    priority: Optional[Priority] = Field(default=None)
    date_from: Optional[datetime] = Field(default=None)
    date_to: Optional[datetime] = Field(default=None)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)

"""Notification Infrastructure REST Controller Endpoints.

Provides API endpoints for notification creation, search/filtering, unread counts,
read/unread state management, archiving, and deletion.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.enums import NotificationType, Priority
from app.database.session import get_db
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse
from app.modules.notifications.schemas.notification import (
    NotificationCreateRequest,
    NotificationListResponse,
    NotificationResponse,
    NotificationSearchFilter,
    NotificationUnreadCountResponse,
)
from app.modules.notifications.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notification Infrastructure"])


@router.post(
    "",
    response_model=APIResponse[NotificationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Notification",
    description="Manually dispatch a notification via In-App provider interface. (Admin, Manager)",
    dependencies=[Depends(RequireRoles("Admin", "Manager"))],
)
def create_notification(
    req: NotificationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationResponse]:
    notif = notification_service.create_notification(db, req, actor_id=current_user.id)
    return APIResponse(success=True, message="Notification created successfully", data=notif)


@router.get(
    "/unread-count",
    response_model=APIResponse[NotificationUnreadCountResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Unread Notifications Count",
    description="Retrieve fast scalar count of unread notifications for current user.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationUnreadCountResponse]:
    res = notification_service.get_unread_count(db, current_user.id)
    return APIResponse(success=True, message="Unread count retrieved successfully", data=res)


@router.get(
    "/history",
    response_model=APIResponse[NotificationListResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Notification History",
    description="Retrieve full notification history for current user.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_notification_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationListResponse]:
    filters = NotificationSearchFilter(page=page, page_size=page_size)
    res = notification_service.search_notifications(db, current_user.id, filters)
    return APIResponse(success=True, message="Notification history retrieved successfully", data=res)


@router.get(
    "",
    response_model=APIResponse[NotificationListResponse],
    status_code=status.HTTP_200_OK,
    summary="List & Search Notifications",
    description="Search, filter, and paginate current user notifications.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def list_notifications(
    search: Optional[str] = Query(None, description="Search title or message"),
    notification_type: Optional[NotificationType] = Query(None, description="Filter by NotificationType enum"),
    read_status: Optional[bool] = Query(None, description="Filter by read status"),
    priority: Optional[Priority] = Query(None, description="Filter by Priority enum"),
    date_from: Optional[datetime] = Query(None, description="Starting date range"),
    date_to: Optional[datetime] = Query(None, description="Ending date range"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort direction (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationListResponse]:
    filters = NotificationSearchFilter(
        search=search,
        notification_type=notification_type,
        read_status=read_status,
        priority=priority,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    res = notification_service.search_notifications(db, current_user.id, filters)
    return APIResponse(success=True, message="Notifications retrieved successfully", data=res)


@router.get(
    "/{id}",
    response_model=APIResponse[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Notification by ID",
    description="Retrieve notification details by ID for current user.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_notification(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationResponse]:
    res = notification_service.get_notification_by_id(db, id, current_user)
    return APIResponse(success=True, message="Notification retrieved successfully", data=res)


@router.patch(
    "/{id}/read",
    response_model=APIResponse[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="Mark Notification Read",
    description="Mark notification status as READ.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def mark_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationResponse]:
    res = notification_service.mark_as_read(db, id, current_user)
    return APIResponse(success=True, message="Notification marked as READ", data=res)


@router.patch(
    "/{id}/unread",
    response_model=APIResponse[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="Mark Notification Unread",
    description="Mark notification status as UNREAD.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def mark_unread(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationResponse]:
    res = notification_service.mark_as_unread(db, id, current_user)
    return APIResponse(success=True, message="Notification marked as UNREAD", data=res)


@router.patch(
    "/{id}/archive",
    response_model=APIResponse[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="Archive Notification",
    description="Archive notification for current user.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def archive_notification(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationResponse]:
    res = notification_service.archive_notification(db, id, current_user)
    return APIResponse(success=True, message="Notification archived successfully", data=res)


@router.delete(
    "/{id}",
    response_model=APIResponse[None],
    status_code=status.HTTP_200_OK,
    summary="Delete Notification",
    description="Soft delete notification for current user.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def delete_notification(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[None]:
    notification_service.delete_notification(db, id, current_user)
    return APIResponse(success=True, message="Notification deleted successfully", data=None)

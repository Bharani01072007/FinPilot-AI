"""Reporting & Analytics REST Controller Endpoints.

Provides API routes for Executive Dashboard, Business Analytics, KPIs, and Report Exports.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.enums import ApplicationStatus
from app.database.session import get_db
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse
from app.modules.reports.schemas.report import (
    ApplicationAnalyticsResponse,
    AuditAnalyticsResponse,
    DocumentAnalyticsResponse,
    ExecutiveDashboardResponse,
    KPISummaryResponse,
    NotificationAnalyticsResponse,
    ReportFilter,
    UserAnalyticsResponse,
)
from app.modules.reports.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reporting & Analytics"])


@router.get(
    "/dashboard",
    response_model=APIResponse[ExecutiveDashboardResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Executive Dashboard Metrics",
    description="Retrieve executive dashboard summary metrics including application totals, status breakdowns, and type distributions. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def get_dashboard(
    date_from: Optional[datetime] = Query(None, description="Starting date range"),
    date_to: Optional[datetime] = Query(None, description="Ending date range"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ExecutiveDashboardResponse]:
    filters = ReportFilter(date_from=date_from, date_to=date_to)
    res = report_service.get_executive_dashboard(db, filters, current_user)
    return APIResponse(success=True, message="Executive dashboard retrieved successfully", data=res)


@router.get(
    "/applications",
    response_model=APIResponse[ApplicationAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Application Performance Analytics",
    description="Retrieve application analytics including daily/monthly creation trends, approval/rejection rates, and officer assignment distribution. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def get_application_analytics(
    date_from: Optional[datetime] = Query(None, description="Starting date range"),
    date_to: Optional[datetime] = Query(None, description="Ending date range"),
    application_type: Optional[str] = Query(None, description="Filter by application type"),
    app_status: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationAnalyticsResponse]:
    filters = ReportFilter(date_from=date_from, date_to=date_to, application_type=application_type, status=app_status)
    res = report_service.get_application_analytics(db, filters, current_user)
    return APIResponse(success=True, message="Application analytics retrieved successfully", data=res)


@router.get(
    "/documents",
    response_model=APIResponse[DocumentAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Document Intelligence Analytics",
    description="Retrieve document analytics including upload totals, verification rates, category distribution datasets, and vault usage counts. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def get_document_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentAnalyticsResponse]:
    res = report_service.get_document_analytics(db, current_user)
    return APIResponse(success=True, message="Document analytics retrieved successfully", data=res)


@router.get(
    "/users",
    response_model=APIResponse[UserAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get User & Employee Workload Analytics",
    description="Retrieve user analytics including active/inactive user counts and employee workload distribution datasets. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[UserAnalyticsResponse]:
    res = report_service.get_user_analytics(db, current_user)
    return APIResponse(success=True, message="User analytics retrieved successfully", data=res)


@router.get(
    "/notifications",
    response_model=APIResponse[NotificationAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Notification Analytics",
    description="Retrieve notification infrastructure analytics including read rates, unread counts, and notification type pie chart datasets. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def get_notification_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[NotificationAnalyticsResponse]:
    res = report_service.get_notification_analytics(db, current_user)
    return APIResponse(success=True, message="Notification analytics retrieved successfully", data=res)


@router.get(
    "/audit",
    response_model=APIResponse[AuditAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Audit Log Analytics",
    description="Retrieve audit activity analytics including login statistics, failed login counts, password changes, and administrative actions. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def get_audit_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[AuditAnalyticsResponse]:
    res = report_service.get_audit_analytics(db, current_user)
    return APIResponse(success=True, message="Audit analytics retrieved successfully", data=res)


@router.get(
    "/kpis",
    response_model=APIResponse[KPISummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Operational KPI Summary",
    description="Retrieve operational Key Performance Indicators (KPIs) including average approval time, verification time, completion rate %, and employee productivity index. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def get_kpis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[KPISummaryResponse]:
    res = report_service.get_kpis(db, current_user)
    return APIResponse(success=True, message="KPI summary retrieved successfully", data=res)


@router.get(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export Report Dataset",
    description="Export specified report dataset (dashboard, applications, documents, kpis) into formatted JSON file bytes. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def export_report(
    report_type: str = Query("dashboard", description="Target report type to export (dashboard, applications, documents, kpis)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes, filename, mime_type = report_service.export_report(db, report_type, current_user)
    return Response(
        content=file_bytes,
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

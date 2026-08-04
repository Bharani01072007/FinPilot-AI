"""Report Domain Pydantic Schemas.

Defines DTOs for Executive Dashboard, Analytics Datasets, Charts, KPIs, and Report Filters.
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.database.enums import ApplicationStatus


class ChartDatasetItem(BaseModel):
    """Visualization chart label-value pair model."""

    label: str = Field(..., description="Chart axis label or date string")
    value: float = Field(..., description="Metric value or count")


class ExecutiveDashboardResponse(BaseModel):
    """Executive Dashboard summary metrics response schema."""

    total_applications: int
    pending_reviews: int
    completed_applications: int
    rejected_applications: int
    cancelled_applications: int
    status_breakdown: Dict[str, int]
    type_breakdown: Dict[str, int]


class ApplicationAnalyticsResponse(BaseModel):
    """Application performance analytics response schema."""

    total_applications: int
    approval_rate_percent: float
    rejection_rate_percent: float
    avg_processing_time_hours: float
    daily_trend: List[ChartDatasetItem]
    monthly_trend: List[ChartDatasetItem]
    assignment_distribution: List[ChartDatasetItem]


class DocumentAnalyticsResponse(BaseModel):
    """Document intelligence analytics response schema."""

    uploaded_documents: int
    verified_documents: int
    rejected_documents: int
    pending_verification: int
    avg_verification_time_hours: float
    categories_breakdown: List[ChartDatasetItem]
    vault_usage_count: int


class UserAnalyticsResponse(BaseModel):
    """User and employee workload analytics response schema."""

    active_users: int
    inactive_users: int
    total_employees: int
    workload_distribution: List[ChartDatasetItem]


class NotificationAnalyticsResponse(BaseModel):
    """Notification & Communication analytics response schema."""

    notifications_created: int
    unread_count: int
    read_rate_percent: float
    type_distribution: List[ChartDatasetItem]


class AuditAnalyticsResponse(BaseModel):
    """Audit log activity analytics response schema."""

    total_logins: int
    failed_logins: int
    password_changes: int
    admin_actions: int


class KPISummaryResponse(BaseModel):
    """Key Performance Indicators (KPIs) response schema."""

    average_approval_time_hours: float
    average_verification_time_hours: float
    completion_rate_percent: float
    employee_productivity_index: float
    daily_activity_count: int
    monthly_activity_count: int


class ReportFilter(BaseModel):
    """Filter criteria for reporting & analytics queries."""

    date_from: Optional[datetime] = Field(default=None)
    date_to: Optional[datetime] = Field(default=None)
    application_type: Optional[str] = Field(default=None)
    status: Optional[ApplicationStatus] = Field(default=None)
    assigned_employee_id: Optional[str] = Field(default=None)
    category_id: Optional[str] = Field(default=None)

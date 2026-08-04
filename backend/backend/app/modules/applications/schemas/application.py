"""Application Domain Pydantic Schemas.

Defines DTOs for application creation, status transitions, search/filtering, history tracking, and dashboard metrics.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database.enums import ApplicationStatus, Priority
from app.modules.identity.schemas.auth import UserResponse


class ApplicationCreateRequest(BaseModel):
    """Payload for creating a new financial application."""

    application_type: str = Field(..., min_length=2, max_length=100, description="Application Type (e.g. Loan, Savings Account, Credit Card)")
    customer_id: Optional[str] = Field(default=None, description="Customer User UUID (if submitted by Admin/Employee)")
    priority: Priority = Field(default=Priority.MEDIUM, description="Application priority level")
    remarks: Optional[str] = Field(default=None, description="Initial remarks or notes")
    assigned_employee_id: Optional[str] = Field(default=None, description="Optional initial officer assignment")


class ApplicationUpdateRequest(BaseModel):
    """Payload for updating application metadata."""

    application_type: Optional[str] = Field(default=None, min_length=2, max_length=100)
    priority: Optional[Priority] = Field(default=None)
    remarks: Optional[str] = Field(default=None)


class ApplicationAssignRequest(BaseModel):
    """Payload for assigning or reassigning an application to an officer."""

    assigned_employee_id: Optional[str] = Field(..., description="Target employee user ID or None to unassign")


class StatusTransitionRequest(BaseModel):
    """Payload for transitioning application workflow status."""

    status: ApplicationStatus = Field(..., description="Target ApplicationStatus enum value")
    remarks: Optional[str] = Field(default=None, description="Reason or remarks for status change")


class StatusHistoryResponse(BaseModel):
    """Status transition history record DTO."""

    id: str
    application_id: str
    status: ApplicationStatus
    remarks: Optional[str] = None
    changed_by: Optional[str] = None
    changed_at: datetime
    changer: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class ApplicationResponse(BaseModel):
    """Complete application details response model."""

    id: str
    tenant_id: Optional[str] = None
    application_number: str
    customer_id: str
    assigned_employee_id: Optional[str] = None
    assigned_by: Optional[str] = None
    assigned_at: Optional[datetime] = None
    application_type: str
    status: ApplicationStatus
    priority: Priority
    remarks: Optional[str] = None
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    customer: Optional[UserResponse] = None
    assigned_employee: Optional[UserResponse] = None
    assigner: Optional[UserResponse] = None
    status_history: List[StatusHistoryResponse] = []

    model_config = {"from_attributes": True}


class ApplicationListResponse(BaseModel):
    """Paginated application search response model."""

    items: List[ApplicationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DashboardSummaryResponse(BaseModel):
    """System and officer dashboard summary metric counts."""

    total_applications: int
    pending_review: int
    approved: int
    rejected: int
    completed: int
    cancelled: int
    assigned_to_me: int
    created_today: int


class ApplicationSearchFilter(BaseModel):
    """Filter criteria for searching applications."""

    application_number: Optional[str] = Field(default=None)
    search: Optional[str] = Field(default=None, description="Search term across application number, customer name, email")
    application_type: Optional[str] = Field(default=None)
    status: Optional[ApplicationStatus] = Field(default=None)
    priority: Optional[Priority] = Field(default=None)
    assigned_employee_id: Optional[str] = Field(default=None)
    customer_id: Optional[str] = Field(default=None)
    created_by: Optional[str] = Field(default=None)
    date_from: Optional[datetime] = Field(default=None)
    date_to: Optional[datetime] = Field(default=None)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)

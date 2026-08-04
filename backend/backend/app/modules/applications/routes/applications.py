"""Application Management REST Controller Endpoints.

Provides API endpoints for application creation, search/filtering, employee assignment,
status workflow transitions, status history tracking, and dashboard summary metrics.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.enums import ApplicationStatus, Priority
from app.database.session import get_db
from app.modules.applications.schemas.application import (
    ApplicationAssignRequest,
    ApplicationCreateRequest,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationSearchFilter,
    ApplicationUpdateRequest,
    DashboardSummaryResponse,
    StatusHistoryResponse,
    StatusTransitionRequest,
)
from app.modules.applications.services.application_service import app_service
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/applications", tags=["Application Management"])


@router.post(
    "",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Application",
    description="Submit a new financial application (Loan, Savings Account, Credit Card, etc.) auto-generating a unique application number.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def create_application(
    req: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationResponse]:
    app = app_service.create_application(db, req, current_user)
    return APIResponse(success=True, message="Application created successfully", data=ApplicationResponse.model_validate(app))


@router.get(
    "",
    response_model=APIResponse[ApplicationListResponse],
    status_code=status.HTTP_200_OK,
    summary="List & Search Applications",
    description="Search, filter, and paginate applications. (Staff members can view all; Customers view own applications).",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def list_applications(
    application_number: Optional[str] = Query(None, description="Exact application number"),
    search: Optional[str] = Query(None, description="Search term across application number, customer name, email"),
    application_type: Optional[str] = Query(None, description="Filter by application type"),
    app_status: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter by ApplicationStatus enum"),
    priority: Optional[Priority] = Query(None, description="Filter by Priority enum"),
    assigned_employee_id: Optional[str] = Query(None, description="Filter by assigned officer ID"),
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    date_from: Optional[datetime] = Query(None, description="Filter creation starting date"),
    date_to: Optional[datetime] = Query(None, description="Filter creation ending date"),
    sort_by: str = Query("created_at", description="Sort field (created_at, application_number, priority)"),
    sort_order: str = Query("desc", description="Sort direction (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationListResponse]:
    filters = ApplicationSearchFilter(
        application_number=application_number,
        search=search,
        application_type=application_type,
        status=app_status,
        priority=priority,
        assigned_employee_id=assigned_employee_id,
        customer_id=customer_id,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    result = app_service.search_applications(db, filters, current_user)
    return APIResponse(success=True, message="Applications retrieved successfully", data=result)


@router.get(
    "/dashboard/summary",
    response_model=APIResponse[DashboardSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="Dashboard Summary Metrics",
    description="Retrieve system and personal dashboard counts for applications.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DashboardSummaryResponse]:
    summary = app_service.get_dashboard_summary(db, current_user)
    return APIResponse(success=True, message="Dashboard summary retrieved successfully", data=summary)


@router.get(
    "/number/{applicationNumber}",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Application by Number",
    description="Retrieve application details by application number string.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_application_by_number(
    applicationNumber: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationResponse]:
    app = app_service.get_application_by_number(db, applicationNumber, current_user)
    return APIResponse(success=True, message="Application retrieved successfully", data=ApplicationResponse.model_validate(app))


@router.get(
    "/{id}",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Application by ID",
    description="Retrieve full application details by ID including current status, customer details, assigned officer, and history summary.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_application(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationResponse]:
    app = app_service.get_application_by_id(db, id, current_user)
    return APIResponse(success=True, message="Application retrieved successfully", data=ApplicationResponse.model_validate(app))


@router.put(
    "/{id}",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_200_OK,
    summary="Update Application",
    description="Update application metadata, priority, and remarks.",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def update_application(
    id: str,
    req: ApplicationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationResponse]:
    app = app_service.update_application(db, id, req, current_user)
    return APIResponse(success=True, message="Application updated successfully", data=ApplicationResponse.model_validate(app))


@router.patch(
    "/{id}/assign",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_200_OK,
    summary="Assign Employee",
    description="Assign or reassign an officer employee to an application. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def assign_application(
    id: str,
    req: ApplicationAssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationResponse]:
    app = app_service.assign_application(db, id, req, current_user)
    return APIResponse(success=True, message="Officer assigned successfully", data=ApplicationResponse.model_validate(app))


@router.patch(
    "/{id}/unassign",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_200_OK,
    summary="Unassign Employee",
    description="Unassign officer employee from an application. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def unassign_application(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationResponse]:
    app = app_service.unassign_application(db, id, current_user)
    return APIResponse(success=True, message="Officer unassigned successfully", data=ApplicationResponse.model_validate(app))


@router.patch(
    "/{id}/status",
    response_model=APIResponse[ApplicationResponse],
    status_code=status.HTTP_200_OK,
    summary="Transition Application Status",
    description="Transition workflow status, validate state machine, and log status history entry.",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def transition_status(
    id: str,
    req: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[ApplicationResponse]:
    app = app_service.transition_status(db, id, req, current_user)
    return APIResponse(success=True, message=f"Application status updated to '{req.status.value}'", data=ApplicationResponse.model_validate(app))


@router.get(
    "/{id}/history",
    response_model=APIResponse[List[StatusHistoryResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get Status History",
    description="Retrieve full status transition history audit trail for an application.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_status_history(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[List[StatusHistoryResponse]]:
    history = app_service.get_status_history(db, id, current_user)
    return APIResponse(
        success=True,
        message="Status history retrieved successfully",
        data=[StatusHistoryResponse.model_validate(h) for h in history],
    )

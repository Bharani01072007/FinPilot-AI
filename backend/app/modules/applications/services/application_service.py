"""Application Management Business Logic Service Module.

Encapsulates application creation, employee assignment, workflow state machine status transitions,
status history tracking, Business Event publishing, and dashboard analytics metrics.
"""

from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BaseAppException, ForbiddenException, NotFoundException
from app.database.enums import ApplicationStatus
from app.modules.applications.events import ApplicationEvents, publish_application_event
from app.modules.applications.models import Application, ApplicationStatusHistory
from app.modules.applications.repositories.application_repository import ApplicationRepository
from app.modules.applications.schemas.application import (
    ApplicationAssignRequest,
    ApplicationCreateRequest,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationSearchFilter,
    ApplicationUpdateRequest,
    DashboardSummaryResponse,
    StatusTransitionRequest,
)
from app.modules.applications.validators import generate_application_number, validate_status_transition
from app.modules.audit.models import AuditLog
from app.modules.identity.models import User
from app.modules.identity.repositories.user_repository import UserRepository


class ApplicationService:
    """Service handling financial application workflow operations, assignments, and state transitions."""

    def __init__(
        self,
        app_repo: Optional[ApplicationRepository] = None,
        user_repo: Optional[UserRepository] = None,
    ):
        self.app_repo = app_repo or ApplicationRepository()
        self.user_repo = user_repo or UserRepository()

    def _log_audit_event(
        self,
        db: Session,
        action: str,
        actor_id: str,
        target_app_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log an application workflow event into audit_logs."""
        audit_entry = AuditLog(
            user_id=actor_id,
            entity="Application",
            entity_id=target_app_id,
            action=action,
            new_value=details or {},
        )
        db.add(audit_entry)
        db.commit()

    def _check_user_role_permission(self, current_user: User, allowed_roles: List[str]) -> bool:
        """Check if user has any of the specified roles."""
        user_roles = [ur.role.name.lower() for ur in current_user.user_roles if ur.role and ur.role.name]
        if "admin" in user_roles:
            return True
        allowed_lower = [role.lower() for role in allowed_roles]
        return any(role in user_roles for role in allowed_lower)

    def _enforce_employee_assignment_boundary(self, app: Application, current_user: User) -> None:
        """Verify regular Employee is assigned to the target application before modifying."""
        is_admin_or_mgr = self._check_user_role_permission(current_user, ["Admin", "Manager"])
        if not is_admin_or_mgr:
            user_roles = [ur.role.name for ur in current_user.user_roles if ur.role]
            if "Employee" in user_roles and app.assigned_employee_id != current_user.id:
                raise ForbiddenException(message="Permission denied. You can only update applications assigned to you.")

    def create_application(self, db: Session, req: ApplicationCreateRequest, current_user: User) -> Application:
        """Create a new financial application, auto-generate number, publish Business Event, and log status history."""
        user_roles = [ur.role.name for ur in current_user.user_roles if ur.role]
        if "Customer" in user_roles and not self._check_user_role_permission(current_user, ["Admin", "Manager", "Employee"]):
            customer_id = current_user.id
        else:
            customer_id = req.customer_id or current_user.id

        customer = self.user_repo.get_by_id(db, customer_id)
        if not customer:
            raise NotFoundException(message="Customer user not found")

        app_number = generate_application_number()
        while self.app_repo.get_by_number(db, app_number):
            app_number = generate_application_number()

        now = datetime.now(timezone.utc)
        app = Application(
            application_number=app_number,
            customer_id=customer_id,
            assigned_employee_id=req.assigned_employee_id,
            application_type=req.application_type,
            status=ApplicationStatus.SUBMITTED,
            priority=req.priority,
            remarks=req.remarks,
            submitted_at=now,
            created_by=current_user.id,
        )
        db.add(app)
        db.commit()
        db.refresh(app)

        # Log initial status history entry
        self.app_repo.add_status_history(
            db=db,
            app_id=app.id,
            status=ApplicationStatus.SUBMITTED,
            remarks="Application submitted successfully",
            changed_by=current_user.id,
        )

        self._log_audit_event(
            db, action="Application Created", actor_id=current_user.id, target_app_id=app.id, details={"application_number": app.application_number}
        )

        # Publish Business Event
        publish_application_event(
            event_name=ApplicationEvents.APPLICATION_CREATED,
            application_id=app.id,
            actor_id=current_user.id,
            payload={"application_number": app.application_number, "application_type": app.application_type, "customer_id": customer_id},
        )

        return self.app_repo.get_by_id(db, app.id) or app

    def get_application_by_id(self, db: Session, app_id: str, current_user: User) -> Application:
        """Retrieve application by ID with permission checks."""
        app = self.app_repo.get_by_id(db, app_id)
        if not app:
            raise NotFoundException(message="Application not found")

        is_staff = self._check_user_role_permission(current_user, ["Admin", "Manager", "Employee"])
        if not is_staff and app.customer_id != current_user.id:
            raise ForbiddenException(message="Permission denied to access this application")

        return app

    def get_application_by_number(self, db: Session, app_number: str, current_user: User) -> Application:
        """Retrieve application by application_number string."""
        app = self.app_repo.get_by_number(db, app_number)
        if not app:
            raise NotFoundException(message=f"Application '{app_number}' not found")

        is_staff = self._check_user_role_permission(current_user, ["Admin", "Manager", "Employee"])
        if not is_staff and app.customer_id != current_user.id:
            raise ForbiddenException(message="Permission denied to access this application")

        return app

    def update_application(self, db: Session, app_id: str, req: ApplicationUpdateRequest, current_user: User) -> Application:
        """Update application metadata enforcing assignment boundary."""
        app = self.get_application_by_id(db, app_id, current_user)
        self._enforce_employee_assignment_boundary(app, current_user)

        if app.status == ApplicationStatus.COMPLETED and not self._check_user_role_permission(current_user, ["Admin", "Manager"]):
            raise BaseAppException(message="Completed applications cannot be edited unless reopened by a Manager/Admin", status_code=400)

        updated_fields = {}
        if req.application_type is not None:
            app.application_type = req.application_type
            updated_fields["application_type"] = req.application_type
        if req.priority is not None:
            app.priority = req.priority
            updated_fields["priority"] = req.priority.value
        if req.remarks is not None:
            app.remarks = req.remarks
            updated_fields["remarks"] = req.remarks

        app.updated_by = current_user.id
        db.add(app)
        db.commit()

        self._log_audit_event(
            db, action="Application Updated", actor_id=current_user.id, target_app_id=app.id, details=updated_fields
        )

        return self.get_application_by_id(db, app.id, current_user)

    def assign_application(self, db: Session, app_id: str, req: ApplicationAssignRequest, current_user: User) -> Application:
        """Assign or reassign an officer employee to an application."""
        app = self.get_application_by_id(db, app_id, current_user)

        previous_assigned = app.assigned_employee_id
        if req.assigned_employee_id:
            employee = self.user_repo.get_by_id(db, req.assigned_employee_id)
            if not employee:
                raise NotFoundException(message="Target employee officer not found")
            app.assigned_employee_id = employee.id
            app.assigned_by = current_user.id
            app.assigned_at = datetime.now(timezone.utc)
            event_name = ApplicationEvents.APPLICATION_REASSIGNED if previous_assigned else ApplicationEvents.APPLICATION_ASSIGNED
        else:
            app.assigned_employee_id = None
            app.assigned_by = None
            app.assigned_at = None
            event_name = ApplicationEvents.APPLICATION_UNASSIGNED

        db.add(app)
        db.commit()

        self._log_audit_event(
            db, action="Assignment Changed", actor_id=current_user.id, target_app_id=app.id, details={"assigned_employee_id": app.assigned_employee_id}
        )

        # Publish Business Event
        publish_application_event(
            event_name=event_name,
            application_id=app.id,
            actor_id=current_user.id,
            payload={"previous_assigned": previous_assigned, "assigned_employee_id": app.assigned_employee_id},
        )

        return self.get_application_by_id(db, app.id, current_user)

    def unassign_application(self, db: Session, app_id: str, current_user: User) -> Application:
        """Unassign officer from application."""
        req = ApplicationAssignRequest(assigned_employee_id=None)
        return self.assign_application(db, app_id, req, current_user)

    def transition_status(self, db: Session, app_id: str, req: StatusTransitionRequest, current_user: User) -> Application:
        """Transition application workflow status, enforce assignment boundaries, and emit Business Event."""
        app = self.get_application_by_id(db, app_id, current_user)
        self._enforce_employee_assignment_boundary(app, current_user)

        is_admin_or_manager = self._check_user_role_permission(current_user, ["Admin", "Manager"])
        validate_status_transition(app.status, req.status, is_admin_or_manager=is_admin_or_manager)

        old_status = app.status
        app.status = req.status
        if req.status == ApplicationStatus.COMPLETED:
            app.completed_at = datetime.now(timezone.utc)

        db.add(app)
        db.commit()

        # Log status history entry
        self.app_repo.add_status_history(
            db=db,
            app_id=app.id,
            status=req.status,
            remarks=req.remarks,
            changed_by=current_user.id,
        )

        self._log_audit_event(
            db, action="Status Changed", actor_id=current_user.id, target_app_id=app.id, details={"from_status": old_status.value, "to_status": req.status.value, "remarks": req.remarks}
        )

        # Determine Business Event Type
        if req.status == ApplicationStatus.COMPLETED:
            evt_type = ApplicationEvents.APPLICATION_COMPLETED
        elif req.status == ApplicationStatus.CANCELLED:
            evt_type = ApplicationEvents.APPLICATION_CANCELLED
        else:
            evt_type = ApplicationEvents.APPLICATION_STATUS_CHANGED

        publish_application_event(
            event_name=evt_type,
            application_id=app.id,
            actor_id=current_user.id,
            payload={"from_status": old_status.value, "to_status": req.status.value, "remarks": req.remarks},
        )

        return self.get_application_by_id(db, app.id, current_user)

    def get_status_history(self, db: Session, app_id: str, current_user: User) -> List[ApplicationStatusHistory]:
        """Retrieve full status history for an application."""
        self.get_application_by_id(db, app_id, current_user)
        return self.app_repo.get_status_history(db, app_id)

    def search_applications(self, db: Session, filters: ApplicationSearchFilter, current_user: User) -> ApplicationListResponse:
        """Search and paginate applications."""
        is_staff = self._check_user_role_permission(current_user, ["Admin", "Manager", "Employee"])
        if not is_staff:
            filters.customer_id = current_user.id

        items, total = self.app_repo.search_applications(db, filters)
        total_pages = math.ceil(total / filters.page_size) if total > 0 else 0

        app_responses = [ApplicationResponse.model_validate(app) for app in items]
        return ApplicationListResponse(
            items=app_responses,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=total_pages,
        )

    def get_dashboard_summary(self, db: Session, current_user: User) -> DashboardSummaryResponse:
        """Compute dashboard metrics summary."""
        return self.app_repo.get_dashboard_summary(db, current_user.id)


app_service = ApplicationService()

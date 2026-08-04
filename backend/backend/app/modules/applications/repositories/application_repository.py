"""Application Repository Module.

Provides data access logic for Application and ApplicationStatusHistory models with eager loading.
"""

from datetime import datetime, time, timezone
from typing import Any, List, Optional, Tuple
from sqlalchemy import or_, func, desc, asc
from sqlalchemy.orm import Session, joinedload
from app.database.enums import ApplicationStatus
from app.repositories.base import BaseRepository
from app.modules.applications.models import Application, ApplicationStatusHistory
from app.modules.applications.schemas.application import ApplicationSearchFilter, DashboardSummaryResponse
from app.modules.identity.models import User


class ApplicationRepository(BaseRepository[Application, Any, Any]):
    """Repository managing database queries for applications and workflow status history."""

    def __init__(self):
        super().__init__(model=Application)

    def get_by_id(self, db: Session, app_id: str) -> Optional[Application]:
        """Fetch application by ID with loaded relationships."""
        return (
            db.query(Application)
            .options(
                joinedload(Application.customer),
                joinedload(Application.assigned_employee),
                joinedload(Application.assigner),
                joinedload(Application.status_history).joinedload(ApplicationStatusHistory.changer),
            )
            .filter(Application.id == app_id, Application.is_deleted == False)
            .first()
        )

    def get_by_number(self, db: Session, app_number: str) -> Optional[Application]:
        """Fetch application by application_number string."""
        return (
            db.query(Application)
            .options(
                joinedload(Application.customer),
                joinedload(Application.assigned_employee),
                joinedload(Application.assigner),
                joinedload(Application.status_history).joinedload(ApplicationStatusHistory.changer),
            )
            .filter(Application.application_number == app_number, Application.is_deleted == False)
            .first()
        )

    def search_applications(self, db: Session, filters: ApplicationSearchFilter) -> Tuple[List[Application], int]:
        """Search, filter, sort, and paginate active applications.

        Returns:
            Tuple of (List[Application], total_count).
        """
        query = db.query(Application).filter(Application.is_deleted == False)

        # 1. Exact Application Number Filter
        if filters.application_number and filters.application_number.strip():
            query = query.filter(Application.application_number == filters.application_number.strip())

        # 2. Free-text Search (Application Number, Customer First/Last Name, Email)
        if filters.search and filters.search.strip():
            term = f"%{filters.search.strip()}%"
            query = query.join(Application.customer).filter(
                or_(
                    Application.application_number.ilike(term),
                    User.first_name.ilike(term),
                    User.last_name.ilike(term),
                    User.email.ilike(term),
                )
            )

        # 3. Filters
        if filters.application_type and filters.application_type.strip():
            query = query.filter(Application.application_type.ilike(filters.application_type.strip()))

        if filters.status:
            query = query.filter(Application.status == filters.status)

        if filters.priority:
            query = query.filter(Application.priority == filters.priority)

        if filters.assigned_employee_id:
            query = query.filter(Application.assigned_employee_id == filters.assigned_employee_id)

        if filters.customer_id:
            query = query.filter(Application.customer_id == filters.customer_id)

        if filters.created_by:
            query = query.filter(Application.created_by == filters.created_by)

        if filters.date_from:
            query = query.filter(Application.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Application.created_at <= filters.date_to)

        # Total Count
        total_count = query.count()

        # 4. Sorting
        sort_col = getattr(Application, filters.sort_by, Application.created_at)
        if filters.sort_order.lower() == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        # 5. Pagination with Eager Loading to eliminate N+1 queries
        skip = (filters.page - 1) * filters.page_size
        items = (
            query.options(
                joinedload(Application.customer),
                joinedload(Application.assigned_employee),
                joinedload(Application.assigner),
            )
            .offset(skip)
            .limit(filters.page_size)
            .all()
        )

        return items, total_count

    def add_status_history(
        self,
        db: Session,
        app_id: str,
        status: ApplicationStatus,
        remarks: Optional[str] = None,
        changed_by: Optional[str] = None,
    ) -> ApplicationStatusHistory:
        """Create an immutable status history audit record."""
        history = ApplicationStatusHistory(
            application_id=app_id,
            status=status,
            remarks=remarks,
            changed_by=changed_by,
        )
        db.add(history)
        db.commit()
        db.refresh(history)
        return history

    def get_status_history(self, db: Session, app_id: str) -> List[ApplicationStatusHistory]:
        """Retrieve full status history for an application."""
        return (
            db.query(ApplicationStatusHistory)
            .options(joinedload(ApplicationStatusHistory.changer))
            .filter(ApplicationStatusHistory.application_id == app_id)
            .order_by(asc(ApplicationStatusHistory.changed_at))
            .all()
        )

    def get_dashboard_summary(self, db: Session, current_user_id: str) -> DashboardSummaryResponse:
        """Compute system and officer dashboard summary metrics."""
        now = datetime.now(timezone.utc)
        today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)

        total_applications = db.query(func.count(Application.id)).filter(Application.is_deleted == False).scalar() or 0
        
        pending_review = (
            db.query(func.count(Application.id))
            .filter(
                Application.is_deleted == False,
                Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW]),
            )
            .scalar() or 0
        )

        pending_documents = (
            db.query(func.count(Application.id))
            .filter(Application.is_deleted == False, Application.status == ApplicationStatus.DOCUMENT_PENDING)
            .scalar() or 0
        )

        approved = (
            db.query(func.count(Application.id))
            .filter(Application.is_deleted == False, Application.status == ApplicationStatus.APPROVED)
            .scalar() or 0
        )

        rejected = (
            db.query(func.count(Application.id))
            .filter(Application.is_deleted == False, Application.status == ApplicationStatus.REJECTED)
            .scalar() or 0
        )

        completed = (
            db.query(func.count(Application.id))
            .filter(Application.is_deleted == False, Application.status == ApplicationStatus.COMPLETED)
            .scalar() or 0
        )

        cancelled = (
            db.query(func.count(Application.id))
            .filter(Application.is_deleted == False, Application.status == ApplicationStatus.CANCELLED)
            .scalar() or 0
        )

        assigned_to_me = (
            db.query(func.count(Application.id))
            .filter(Application.is_deleted == False, Application.assigned_employee_id == current_user_id)
            .scalar() or 0
        )

        created_today = (
            db.query(func.count(Application.id))
            .filter(Application.is_deleted == False, Application.created_at >= today_start)
            .scalar() or 0
        )

        return DashboardSummaryResponse(
            total_applications=total_applications,
            pending_review=pending_review,
            approved=approved,
            rejected=rejected,
            completed=completed,
            cancelled=cancelled,
            assigned_to_me=assigned_to_me,
            created_today=created_today,
        )

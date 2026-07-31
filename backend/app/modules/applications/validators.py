"""Application Domain Validation & Workflow State Machine Module.

Provides application number generation and centralized workflow state transition validation.
"""

from datetime import datetime, timezone
import random
from app.core.exceptions import BaseAppException
from app.database.enums import ApplicationStatus


def generate_application_number(prefix: str = "APP") -> str:
    """Generate a unique human-readable application number format.

    Example format: APP-20260731-9842
    """
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_digits = random.randint(1000, 9999)
    return f"{prefix}-{now_str}-{random_digits}"


# Centralized Workflow State Machine Allowed Transitions Map
ALLOWED_TRANSITIONS = {
    ApplicationStatus.SUBMITTED: {
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.DOCUMENT_PENDING,
        ApplicationStatus.REJECTED,
        ApplicationStatus.APPROVED,
        ApplicationStatus.COMPLETED,
        ApplicationStatus.CANCELLED,
    },
    ApplicationStatus.DOCUMENT_PENDING: {
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.APPROVED,
        ApplicationStatus.CANCELLED,
    },
    ApplicationStatus.UNDER_REVIEW: {
        ApplicationStatus.DOCUMENT_PENDING,
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.CANCELLED,
    },
    ApplicationStatus.APPROVED: {
        ApplicationStatus.COMPLETED,
        ApplicationStatus.CANCELLED,
    },
    ApplicationStatus.REJECTED: set(),  # Terminal state (Admin/Manager reopen override allowed)
    ApplicationStatus.COMPLETED: set(),  # Terminal state (Admin/Manager reopen override allowed)
    ApplicationStatus.CANCELLED: set(),  # Terminal state
}


class ApplicationWorkflowValidator:
    """Centralized validator for application lifecycle status transitions."""

    @staticmethod
    def validate_transition(
        current_status: ApplicationStatus,
        new_status: ApplicationStatus,
        is_admin_or_manager: bool = False,
    ) -> None:
        """Validate workflow status transition state machine.

        Raises:
            BaseAppException 400 if illegal status transition requested.
        """
        if current_status == new_status:
            return

        # Reopen Override for Terminal States (REJECTED / COMPLETED) by Staff Managers/Admins
        if is_admin_or_manager and current_status in {ApplicationStatus.COMPLETED, ApplicationStatus.REJECTED}:
            if new_status in {ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SUBMITTED, ApplicationStatus.DOCUMENT_PENDING}:
                return

        allowed = ALLOWED_TRANSITIONS.get(current_status, set())
        if new_status not in allowed:
            raise BaseAppException(
                message=f"Invalid workflow status transition from '{current_status.value}' to '{new_status.value}'.",
                status_code=400,
            )


def validate_status_transition(
    current_status: ApplicationStatus,
    new_status: ApplicationStatus,
    is_admin_or_manager: bool = False,
) -> None:
    """Helper wrapper for ApplicationWorkflowValidator."""
    ApplicationWorkflowValidator.validate_transition(current_status, new_status, is_admin_or_manager)

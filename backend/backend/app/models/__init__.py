"""Central Models Export Package.

Imports all ORM models across business domain modules for Alembic migration discovery and SQLAlchemy metadata tracking.
"""

from app.database.base import Base, BaseEntity
from app.modules.identity.models import User, Role, UserRole, UserSession
from app.modules.applications.models import Application, ApplicationStatusHistory
from app.modules.documents.models import (
    DocumentCategory,
    Document,
    DocumentVersion,
    DocumentVault,
    Tag,
    DocumentTag,
    Attachment,
)
from app.modules.notifications.models import Notification
from app.modules.tasks.models import Task
from app.modules.appointments.models import Appointment
from app.modules.reports.models import Report
from app.modules.audit.models import AuditLog, AIAgentLog
from app.modules.system.models import Setting, Integration
from app.modules.ai.document_intelligence.models import DocumentAnalysisResult
from app.modules.ai.kyc.models import KYCVerificationResult
from app.modules.ai.risk.models import RiskAssessmentResult

__all__ = [
    "Base",
    "BaseEntity",
    # Identity
    "User", "Role", "UserRole", "UserSession",
    # Applications
    "Application", "ApplicationStatusHistory",
    # Documents
    "DocumentCategory", "Document", "DocumentVersion",
    "DocumentVault", "Tag", "DocumentTag", "Attachment",
    # Notifications
    "Notification",
    # Tasks
    "Task",
    # Appointments
    "Appointment",
    # Reports
    "Report",
    # Audit
    "AuditLog", "AIAgentLog",
    # System
    "Setting", "Integration",
    # AI Document Intelligence
    "DocumentAnalysisResult",
    # AI KYC Agent
    "KYCVerificationResult",
    # AI Risk Assessment Agent
    "RiskAssessmentResult",
]

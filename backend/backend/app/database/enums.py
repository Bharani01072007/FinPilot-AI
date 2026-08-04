"""PostgreSQL Compatible Python Enums for FinPilot AI Database.

Defines operational enums used across application domains.
"""

from enum import Enum


class ApplicationStatus(str, Enum):
    """Status workflow enumeration for financial applications."""

    SUBMITTED = "SUBMITTED"
    DOCUMENT_PENDING = "DOCUMENT_PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class VerificationStatus(str, Enum):
    """Document verification status enumeration."""

    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class Priority(str, Enum):
    """System-wide task, application, and notification priority enumeration."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class NotificationType(str, Enum):
    """Categorization enumeration for system notifications."""

    SYSTEM = "SYSTEM"
    APPLICATION = "APPLICATION"
    DOCUMENT = "DOCUMENT"
    PAYMENT = "PAYMENT"
    REMINDER = "REMINDER"


class TaskStatus(str, Enum):
    """Task workflow state enumeration."""

    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MeetingMode(str, Enum):
    """Appointment mode enumeration."""

    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    PHONE = "PHONE"

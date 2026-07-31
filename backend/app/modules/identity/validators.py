"""Identity Domain Reusable Validators Module.

Provides centralized validation for email formatting, phone numbers, and database uniqueness checks.
"""

import re
from typing import Optional
from sqlalchemy.orm import Session
from app.core.exceptions import BaseAppException
from app.modules.identity.models import User

# Phone format regex (supports international formats)
PHONE_REGEX = re.compile(r"^\+?[1-9]\d{1,14}$")


def validate_email_format(email: str) -> str:
    """Validate email string format."""
    email_clean = email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise BaseAppException(message="Invalid email address format", status_code=400)
    return email_clean


def validate_phone_format(phone: str) -> str:
    """Validate phone number string format."""
    phone_clean = phone.strip()
    if not PHONE_REGEX.match(phone_clean):
        raise BaseAppException(
            message="Invalid phone number format. Must be in E.164 international format (e.g. +1234567890).",
            status_code=400,
        )
    return phone_clean


def validate_unique_email(db: Session, email: str, exclude_user_id: Optional[str] = None) -> None:
    """Verify email uniqueness across non-deleted users.

    Raises:
        BaseAppException 400 if duplicate email found.
    """
    query = db.query(User).filter(User.email == email, User.is_deleted == False)
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    if query.first():
        raise BaseAppException(message="User with this email already exists", status_code=400)


def validate_unique_phone(db: Session, phone: str, exclude_user_id: Optional[str] = None) -> None:
    """Verify phone number uniqueness across non-deleted users.

    Raises:
        BaseAppException 400 if duplicate phone found.
    """
    query = db.query(User).filter(User.phone == phone, User.is_deleted == False)
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    if query.first():
        raise BaseAppException(message="User with this phone number already exists", status_code=400)

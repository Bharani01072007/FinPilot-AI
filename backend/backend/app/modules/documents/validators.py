"""Document Validation & Security Checksum Utilities Module.

Validates file upload sizes, MIME types, computes SHA-256 hashes, and enforces verification status workflows.
"""

import hashlib
from typing import Set
from app.core.exceptions import BaseAppException
from app.database.enums import VerificationStatus

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_MIME_TYPES: Set[str] = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


def compute_sha256(file_bytes: bytes) -> str:
    """Compute SHA-256 hexadecimal hash string for binary file contents."""
    return hashlib.sha256(file_bytes).hexdigest()


def validate_file_upload(file_size: int, mime_type: str, original_filename: str) -> None:
    """Validate uploaded document file size and MIME type.

    Raises:
        BaseAppException 400 if validation fails.
    """
    if file_size <= 0:
        raise BaseAppException(message="Uploaded file cannot be empty", status_code=400)

    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise BaseAppException(
            message=f"File size exceeds maximum allowed limit of {max_mb} MB.",
            status_code=400,
        )

    mime_clean = mime_type.lower().strip()
    if mime_clean not in ALLOWED_MIME_TYPES:
        allowed_str = ", ".join(sorted(ALLOWED_MIME_TYPES))
        raise BaseAppException(
            message=f"Unsupported file type '{mime_type}'. Allowed types: {allowed_str}.",
            status_code=400,
        )


class DocumentWorkflowValidator:
    """Validator managing document verification state machine."""

    @staticmethod
    def validate_verification_transition(current_status: VerificationStatus, new_status: VerificationStatus) -> None:
        """Validate verification state transition."""
        if current_status == new_status:
            return
        # All verification status transitions (PENDING -> VERIFIED/REJECTED, VERIFIED -> REJECTED, etc.) are allowed for staff officers.

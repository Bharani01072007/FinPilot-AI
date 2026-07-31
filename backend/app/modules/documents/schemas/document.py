"""Document Domain Pydantic Schemas.

Defines request/response models for document uploads, version control, verification, vault linking, and tags.
"""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database.enums import VerificationStatus
from app.modules.identity.schemas.auth import UserResponse


class DocumentCategoryResponse(BaseModel):
    """Document category master definition response schema."""

    id: str
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class DocumentVersionResponse(BaseModel):
    """Document historical version record DTO."""

    id: str
    document_id: str
    version_number: int
    storage_path: str
    sha256_hash: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class VerificationRequest(BaseModel):
    """Payload for verifying or rejecting a document."""

    verification_status: VerificationStatus = Field(..., description="Target verification status (VERIFIED, REJECTED, PENDING)")
    remarks: Optional[str] = Field(default=None, description="Verification review remarks or rejection reason")


class DocumentVaultRequest(BaseModel):
    """Payload for linking a reusable document to Customer Document Vault."""

    customer_id: str = Field(..., description="Target Customer User UUID")
    document_id: str = Field(..., description="Document UUID to link to vault")
    expiry_date: Optional[date] = Field(default=None, description="Optional document expiry date")
    reusable: bool = Field(default=True, description="Whether document can be reused across applications")


class TagRequest(BaseModel):
    """Payload for assigning a tag to a document."""

    tag_name: str = Field(..., min_length=1, max_length=100, description="Tag name (e.g. Urgent, Incomplete, Fraud Review, Verified, KYC)")


class TagResponse(BaseModel):
    """Tag entity response model."""

    id: str
    name: str

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    """Complete document detail response model."""

    id: str
    tenant_id: Optional[str] = None
    application_id: Optional[str] = None
    category_id: str
    uploaded_by: str
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    file_name: str
    original_name: str
    storage_path: str
    mime_type: str
    file_size: int
    
    # Security Compliance Fields
    sha256_hash: Optional[str] = None
    storage_provider: str = "LOCAL"
    storage_bucket: str = "finpilot-uploads"
    encryption_status: str = "AES-256"
    virus_scan_status: str = "CLEAN"
    
    verification_status: VerificationStatus
    created_at: datetime
    updated_at: datetime

    category: Optional[DocumentCategoryResponse] = None
    uploader: Optional[UserResponse] = None
    verifier: Optional[UserResponse] = None
    versions: List[DocumentVersionResponse] = []
    tags: List[TagResponse] = []
    download_url: Optional[str] = None
    preview_url: Optional[str] = None

    model_config = {"from_attributes": True}


class DocumentVaultResponse(BaseModel):
    """Customer Document Vault item response model."""

    id: str
    customer_id: str
    document_id: str
    expiry_date: Optional[date] = None
    is_expired: bool = False
    reusable: bool = True
    created_at: datetime
    document: Optional[DocumentResponse] = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    """Paginated document search list response model."""

    items: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DocumentSearchFilter(BaseModel):
    """Filter parameters for querying documents."""

    search: Optional[str] = Field(default=None, description="Search term across original filename, file name")
    application_id: Optional[str] = Field(default=None)
    category_id: Optional[str] = Field(default=None)
    verification_status: Optional[VerificationStatus] = Field(default=None)
    uploaded_by: Optional[str] = Field(default=None)
    date_from: Optional[datetime] = Field(default=None)
    date_to: Optional[datetime] = Field(default=None)
    tag: Optional[str] = Field(default=None)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)

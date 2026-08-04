"""Document Management REST Controller Endpoints.

Provides API routes for document uploads, version history, verification workflows,
tagging, search/filtering, and secure file downloads.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.enums import VerificationStatus
from app.database.session import get_db
from app.modules.documents.schemas.document import (
    DocumentCategoryResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentSearchFilter,
    DocumentVersionResponse,
    TagRequest,
    VerificationRequest,
)
from app.modules.documents.services.document_service import doc_service
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/documents", tags=["Document Management"])


@router.post(
    "/upload",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload Document",
    description="Upload a document file linked to an application, saving via storage abstraction and creating version #1.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
async def upload_document(
    file: UploadFile = File(..., description="Binary document file (PDF, JPEG, PNG, WEBP)"),
    category_id: str = Form(..., description="Target document category UUID"),
    application_id: Optional[str] = Form(None, description="Optional linked application UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    file_bytes = await file.read()
    res = doc_service.upload_document(
        db=db,
        file_bytes=file_bytes,
        filename=file.filename or "upload.bin",
        mime_type=file.content_type or "application/octet-stream",
        category_id=category_id,
        application_id=application_id,
        current_user=current_user,
    )
    return APIResponse(success=True, message="Document uploaded successfully", data=res)


@router.get(
    "/categories",
    response_model=APIResponse[List[DocumentCategoryResponse]],
    status_code=status.HTTP_200_OK,
    summary="List Document Categories",
    description="Fetch list of system document categories (Identity Proof, Address Proof, PAN, Aadhaar, etc.).",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def list_categories(
    db: Session = Depends(get_db),
) -> APIResponse[List[DocumentCategoryResponse]]:
    categories = doc_service.list_categories(db)
    return APIResponse(success=True, message="Categories retrieved successfully", data=categories)


@router.get(
    "",
    response_model=APIResponse[DocumentListResponse],
    status_code=status.HTTP_200_OK,
    summary="List & Search Documents",
    description="Search, filter, and paginate uploaded documents.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def list_documents(
    search: Optional[str] = Query(None, description="Search term across original filename"),
    application_id: Optional[str] = Query(None, description="Filter by application ID"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    verification_status: Optional[VerificationStatus] = Query(None, description="Filter by verification status"),
    uploaded_by: Optional[str] = Query(None, description="Filter by uploader user ID"),
    tag: Optional[str] = Query(None, description="Filter by tag name"),
    date_from: Optional[datetime] = Query(None, description="Uploaded date starting range"),
    date_to: Optional[datetime] = Query(None, description="Uploaded date ending range"),
    sort_by: str = Query("created_at", description="Sort field (created_at, original_name, verification_status)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentListResponse]:
    filters = DocumentSearchFilter(
        search=search,
        application_id=application_id,
        category_id=category_id,
        verification_status=verification_status,
        uploaded_by=uploaded_by,
        tag=tag,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    result = doc_service.search_documents(db, filters, current_user)
    return APIResponse(success=True, message="Documents retrieved successfully", data=result)


@router.get(
    "/{id}",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Document Details",
    description="Retrieve document metadata details, preview URL, download URL, and assigned tags.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_document(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    res = doc_service.get_document_by_id(db, id, current_user)
    return APIResponse(success=True, message="Document details retrieved successfully", data=res)


@router.get(
    "/{id}/versions",
    response_model=APIResponse[List[DocumentVersionResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get Document Version History",
    description="Retrieve complete version history audit list for a document.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def get_document_versions(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[List[DocumentVersionResponse]]:
    versions = doc_service.get_document_versions(db, id, current_user)
    return APIResponse(success=True, message="Version history retrieved successfully", data=versions)


@router.post(
    "/{id}/verify",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Verify Document",
    description="Mark document verification status as VERIFIED. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def verify_document(
    id: str,
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    req.verification_status = VerificationStatus.VERIFIED
    res = doc_service.verify_document(db, id, req, current_user)
    return APIResponse(success=True, message="Document marked as VERIFIED", data=res)


@router.post(
    "/{id}/reject",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Reject Document",
    description="Mark document verification status as REJECTED. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def reject_document(
    id: str,
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    req.verification_status = VerificationStatus.REJECTED
    res = doc_service.verify_document(db, id, req, current_user)
    return APIResponse(success=True, message="Document marked as REJECTED", data=res)


@router.post(
    "/{id}/pending",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Mark Document Pending",
    description="Mark document verification status as PENDING review. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def mark_pending(
    id: str,
    req: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    req.verification_status = VerificationStatus.PENDING
    res = doc_service.verify_document(db, id, req, current_user)
    return APIResponse(success=True, message="Document marked as PENDING review", data=res)


@router.get(
    "/{id}/download",
    status_code=status.HTTP_200_OK,
    summary="Download Document File",
    description="Download raw binary document file securely with permission verification.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def download_document(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes, filename, mime_type = doc_service.get_document_file_bytes(db, id, current_user)
    return Response(
        content=file_bytes,
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/{id}/preview",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Document Preview Metadata",
    description="Retrieve secure temporary access preview metadata and URLs without exposing internal filesystem paths.",
    dependencies=[Depends(RequireRoles("Customer", "Employee", "Manager", "Admin"))],
)
def preview_document(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    res = doc_service.get_document_by_id(db, id, current_user)
    return APIResponse(success=True, message="Document preview metadata retrieved successfully", data=res)


@router.post(
    "/{id}/tags",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Assign Tag to Document",
    description="Assign a tag (Urgent, Incomplete, Fraud Review, Verified, KYC) to a document. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def add_tag(
    id: str,
    req: TagRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    res = doc_service.add_tag(db, id, req.tag_name, current_user)
    return APIResponse(success=True, message=f"Tag '{req.tag_name}' assigned to document", data=res)


@router.delete(
    "/{id}/tags/{tagId}",
    response_model=APIResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Remove Tag from Document",
    description="Remove a tag assignment from a document. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def remove_tag(
    id: str,
    tagId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentResponse]:
    res = doc_service.remove_tag(db, id, tagId, current_user)
    return APIResponse(success=True, message="Tag removed from document", data=res)

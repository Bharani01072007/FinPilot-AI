"""Document Intelligence REST Controller Endpoints.

Provides API routes for document processing, structured result retrieval, pipeline status checks, and reprocessing.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.ai.document_intelligence.schemas.document_intelligence import (
    DocumentAnalysisResultResponse,
    DocumentProcessRequest,
    DocumentStatusResponse,
)
from app.modules.ai.document_intelligence.services.document_intelligence_service import document_intelligence_service
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/ai/documents", tags=["Document Intelligence Agent"])


@router.post(
    "/process",
    response_model=APIResponse[DocumentAnalysisResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Process Document via AI Pipeline",
    description="Execute multi-stage Document Intelligence Pipeline (Classification, OCR, Cleaning, Field Extraction, Validation, Confidence Scoring). (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def process_document(
    req: DocumentProcessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentAnalysisResultResponse]:
    res = document_intelligence_service.process_document(db, req.document_id, current_user)
    return APIResponse(success=True, message="Document processed successfully", data=res)


@router.get(
    "/{id}/result",
    response_model=APIResponse[DocumentAnalysisResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Document Extraction Result",
    description="Retrieve OCR text, cleaned text, extracted fields JSON, validation flags, and confidence ratings for a document. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def get_document_result(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentAnalysisResultResponse]:
    res = document_intelligence_service.get_result(db, id, current_user)
    return APIResponse(success=True, message="Document analysis result retrieved", data=res)


@router.get(
    "/{id}/status",
    response_model=APIResponse[DocumentStatusResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Pipeline Processing Status",
    description="Retrieve processing status and confidence rating for a document. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def get_document_status(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentStatusResponse]:
    res = document_intelligence_service.get_status(db, id, current_user)
    return APIResponse(success=True, message="Document pipeline status retrieved", data=res)


@router.post(
    "/{id}/reprocess",
    response_model=APIResponse[DocumentAnalysisResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Reprocess Document",
    description="Re-run Document Intelligence Pipeline for a document. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def reprocess_document(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[DocumentAnalysisResultResponse]:
    res = document_intelligence_service.reprocess_document(db, id, current_user)
    return APIResponse(success=True, message="Document reprocessed successfully", data=res)

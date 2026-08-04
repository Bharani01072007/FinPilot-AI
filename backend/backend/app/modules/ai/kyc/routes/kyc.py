"""KYC Verification Agent REST Controller Endpoints.

Provides API routes for automated KYC verification execution, result retrieval, and reverification.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.ai.kyc.schemas.kyc import (
    KYCVerificationResultResponse,
    KYCVerifyRequest,
)
from app.modules.ai.kyc.services.kyc_service import kyc_verification_service
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/ai/kyc", tags=["KYC Verification Agent"])


@router.post(
    "/verify",
    response_model=APIResponse[KYCVerificationResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Execute Automated KYC Verification",
    description=(
        "Run automated KYC verification pipeline: cross-document identity consistency checks, "
        "business rule evaluation, risk indicator detection, confidence scoring, and non-final recommendation generation. "
        "Does NOT perform final application approval. (Employee, Manager, Admin)"
    ),
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def verify_kyc(
    req: KYCVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[KYCVerificationResultResponse]:
    res = kyc_verification_service.verify_kyc(db, req.application_id, current_user)
    return APIResponse(success=True, message="KYC verification completed successfully", data=res)


@router.get(
    "/{application_id}",
    response_model=APIResponse[KYCVerificationResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Get KYC Verification Result",
    description="Retrieve KYC verification findings, consistency checks, risk indicators, and recommendation for an application. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def get_kyc_result(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[KYCVerificationResultResponse]:
    res = kyc_verification_service.get_result(db, application_id, current_user)
    return APIResponse(success=True, message="KYC verification result retrieved", data=res)


@router.post(
    "/{application_id}/reverify",
    response_model=APIResponse[KYCVerificationResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Re-Run KYC Verification",
    description="Re-execute automated KYC verification pipeline for an application. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def reverify_kyc(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[KYCVerificationResultResponse]:
    res = kyc_verification_service.reverify_kyc(db, application_id, current_user)
    return APIResponse(success=True, message="KYC reverification completed successfully", data=res)

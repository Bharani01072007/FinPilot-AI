"""Risk Assessment REST Endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.ai.risk.schemas.risk import RiskAssessRequest, RiskAssessmentResultResponse
from app.modules.ai.risk.services.risk_service import risk_assessment_service
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/ai/risk", tags=["Financial Risk Assessment Agent"])


@router.post(
    "/assess",
    response_model=APIResponse[RiskAssessmentResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Execute Financial Risk Assessment",
    description="Run AI-powered financial risk pipeline (income, employment, debt, document consistency). Never auto-approves. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def assess_risk(
    req: RiskAssessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[RiskAssessmentResultResponse]:
    res = risk_assessment_service.assess(db, req.application_id, current_user)
    return APIResponse(success=True, message="Risk assessment completed", data=res)


@router.get(
    "/{application_id}",
    response_model=APIResponse[RiskAssessmentResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Risk Assessment Result",
    description="Retrieve risk scores, breakdown, and explanation for an application. (Employee, Manager, Admin)",
    dependencies=[Depends(RequireRoles("Employee", "Manager", "Admin"))],
)
def get_risk_result(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[RiskAssessmentResultResponse]:
    res = risk_assessment_service.get_result(db, application_id, current_user)
    return APIResponse(success=True, message="Risk assessment result retrieved", data=res)


@router.post(
    "/{application_id}/reassess",
    response_model=APIResponse[RiskAssessmentResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Re-Run Risk Assessment",
    description="Re-execute risk assessment pipeline for an application. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def reassess_risk(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> APIResponse[RiskAssessmentResultResponse]:
    res = risk_assessment_service.reassess(db, application_id, current_user)
    return APIResponse(success=True, message="Risk reassessment completed", data=res)

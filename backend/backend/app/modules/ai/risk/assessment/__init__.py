"""Risk Assessment Package."""

from app.modules.ai.risk.assessment.income import IncomeAssessmentService, income_assessment_service
from app.modules.ai.risk.assessment.employment import EmploymentStabilityService, employment_stability_service
from app.modules.ai.risk.assessment.debt import DebtIndicatorService, debt_indicator_service
from app.modules.ai.risk.assessment.document_consistency import DocumentConsistencyService, document_consistency_service

__all__ = [
    "IncomeAssessmentService", "income_assessment_service",
    "EmploymentStabilityService", "employment_stability_service",
    "DebtIndicatorService", "debt_indicator_service",
    "DocumentConsistencyService", "document_consistency_service",
]

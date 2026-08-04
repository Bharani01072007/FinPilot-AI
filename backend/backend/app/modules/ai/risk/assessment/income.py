"""Income Stability Assessment Service."""

from typing import Any, Dict, List, Tuple


class IncomeAssessmentService:
    """Assesses income stability from extracted financial document data."""

    @staticmethod
    def assess(extracted_docs: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
        """Evaluate income stability.

        Returns:
            Tuple of (income_score 0.0-1.0, risk_factors list).
        """
        factors: List[str] = []
        has_salary_slip = any(d.get("document_type") == "Salary Slip" for d in extracted_docs)
        has_bank_statement = any(d.get("document_type") == "Bank Statement" for d in extracted_docs)

        score = 1.0
        if not has_salary_slip:
            factors.append("MISSING_SALARY_SLIP: No salary slip provided for income verification")
            score -= 0.35
        if not has_bank_statement:
            factors.append("MISSING_BANK_STATEMENT: No bank statement provided for income verification")
            score -= 0.25

        return max(round(score, 2), 0.0), factors


income_assessment_service = IncomeAssessmentService()

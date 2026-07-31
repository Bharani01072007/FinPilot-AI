"""Employment Stability Assessment Service."""

from typing import Any, Dict, List, Tuple


class EmploymentStabilityService:
    """Assesses employment stability from extracted document data."""

    @staticmethod
    def assess(extracted_docs: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
        """Evaluate employment stability.

        Returns:
            Tuple of (employment_score 0.0-1.0, risk_factors list).
        """
        factors: List[str] = []
        has_salary_slip = any(d.get("document_type") == "Salary Slip" for d in extracted_docs)
        score = 1.0

        if not has_salary_slip:
            factors.append("MISSING_EMPLOYMENT_PROOF: No salary slip or employment letter provided")
            score -= 0.4

        return max(round(score, 2), 0.0), factors


employment_stability_service = EmploymentStabilityService()

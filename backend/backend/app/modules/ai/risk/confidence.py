"""Risk Confidence & Level Computation Module."""

from typing import Any, Dict, List, Tuple


# Module 3 — Configurable thresholds (Risk Governance)
LOW_RISK_THRESHOLD = 0.75
MEDIUM_RISK_THRESHOLD = 0.50


class RiskConfidenceService:
    """Computes composite risk rating and confidence from component scores."""

    @staticmethod
    def calculate(
        income_score: float,
        employment_score: float,
        debt_score: float,
        doc_consistency_score: float,
        completeness_score: float,
    ) -> Tuple[str, str, str]:
        """Compute overall_risk_level, overall_confidence, and human-readable explanation.

        Returns:
            Tuple of (risk_level, confidence, explanation).
        """
        composite = round(
            (income_score * 0.30) +
            (employment_score * 0.25) +
            (debt_score * 0.20) +
            (doc_consistency_score * 0.15) +
            (completeness_score * 0.10),
            2,
        )

        if composite >= LOW_RISK_THRESHOLD:
            risk_level = "LOW"
            confidence = "HIGH"
            explanation = (
                f"Composite risk score {composite:.2f} indicates LOW risk. "
                "Income and employment evidence is satisfactory. No adverse debt signals detected."
            )
        elif composite >= MEDIUM_RISK_THRESHOLD:
            risk_level = "MEDIUM"
            confidence = "MEDIUM"
            explanation = (
                f"Composite risk score {composite:.2f} indicates MEDIUM risk. "
                "Some documentation gaps or confidence concerns require human review."
            )
        else:
            risk_level = "HIGH"
            confidence = "LOW"
            explanation = (
                f"Composite risk score {composite:.2f} indicates HIGH risk. "
                "Significant documentation deficiencies or consistency issues detected."
            )

        return risk_level, confidence, explanation


risk_confidence_service = RiskConfidenceService()

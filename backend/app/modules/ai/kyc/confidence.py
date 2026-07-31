"""KYC Confidence Scoring Module.

Computes completeness scores, consistency scores, and overall verification confidence ratings.
"""

from typing import Any, Dict, List, Tuple


class KYCConfidenceService:
    """Service computing KYC verification confidence scores."""

    @staticmethod
    def calculate_confidence(
        consistency_score: float,
        rule_score: float,
        extracted_docs: List[Dict[str, Any]],
    ) -> Tuple[float, float, str]:
        """Compute completeness_score, consistency_score, and overall_confidence rating.

        Returns:
            Tuple of (completeness_score, consistency_score, overall_rating).
        """
        completeness_score = 1.0 if len(extracted_docs) > 0 else 0.0

        composite_score = round(
            (completeness_score * 0.3) + (consistency_score * 0.4) + (rule_score * 0.3),
            2,
        )

        if composite_score >= 0.85:
            rating = "HIGH"
        elif composite_score >= 0.65:
            rating = "MEDIUM"
        else:
            rating = "LOW"

        return completeness_score, consistency_score, rating


kyc_confidence_service = KYCConfidenceService()

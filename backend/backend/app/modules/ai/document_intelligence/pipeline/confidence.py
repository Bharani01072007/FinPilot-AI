"""Confidence Scoring Pipeline Service Module.

Computes classification confidence, extraction confidence, and overall rating (HIGH, MEDIUM, LOW).
"""

from typing import Any, Dict, Tuple


class ConfidenceScoringService:
    """Service evaluating confidence scores across pipeline stages."""

    @staticmethod
    def calculate_confidence(
        classification_conf: float,
        validation_results: Dict[str, Any],
        extracted_fields: Dict[str, Any],
    ) -> Tuple[float, float, str]:
        """Compute classification_confidence, extraction_confidence, and overall_confidence rating.

        Returns:
            Tuple of (class_conf, extract_conf, overall_rating).
        """
        if not extracted_fields:
            extract_conf = 0.5
        else:
            valid_count = sum(1 for v in validation_results.values() if isinstance(v, dict) and v.get("valid"))
            extract_conf = round(valid_count / len(extracted_fields), 2) if len(extracted_fields) > 0 else 0.5

        composite_score = round((classification_conf * 0.4) + (extract_conf * 0.6), 2)

        if composite_score >= 0.85:
            rating = "HIGH"
        elif composite_score >= 0.65:
            rating = "MEDIUM"
        else:
            rating = "LOW"

        return classification_conf, extract_conf, rating


confidence_scoring_service = ConfidenceScoringService()

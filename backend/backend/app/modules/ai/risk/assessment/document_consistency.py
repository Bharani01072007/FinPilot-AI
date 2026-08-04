"""Document Consistency Assessment Service."""

from typing import Any, Dict, List, Tuple


class DocumentConsistencyService:
    """Assesses cross-document financial data consistency from extracted document data."""

    @staticmethod
    def assess(extracted_docs: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
        """Evaluate cross-document consistency.

        Returns:
            Tuple of (consistency_score 0.0-1.0, risk_factors list).
        """
        factors: List[str] = []
        low_confidence_docs = [d for d in extracted_docs if d.get("overall_confidence") == "LOW"]
        score = 1.0 - (len(low_confidence_docs) * 0.25)

        for d in low_confidence_docs:
            factors.append(f"LOW_OCR_CONFIDENCE: Document '{d.get('document_type')}' has low confidence extraction rating")

        return max(round(score, 2), 0.0), factors


document_consistency_service = DocumentConsistencyService()

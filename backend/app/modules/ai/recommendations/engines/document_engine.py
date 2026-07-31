"""Document Recommendation Engine — Module 6."""

from typing import Any, Dict, List


class DocumentRecommendationEngine:
    """Identifies missing/expired documents and recommends re-uploads."""

    @staticmethod
    def generate(extracted_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        recommendations = []
        doc_types = {d.get("document_type") for d in extracted_docs}

        required = {"Aadhaar Card", "PAN Card"}
        for missing in required - doc_types:
            recommendations.append({
                "type": "MISSING_DOCUMENT",
                "action": f"Upload {missing}",
                "reason": f"{missing} is a mandatory identity document required for verification.",
                "confidence": "HIGH",
                "evidence": f"Document type '{missing}' not found in application submission.",
            })

        for d in extracted_docs:
            if d.get("overall_confidence") == "LOW":
                recommendations.append({
                    "type": "POOR_QUALITY_DOCUMENT",
                    "action": f"Re-upload {d.get('document_type')} with better image quality",
                    "reason": "Low OCR extraction confidence detected.",
                    "confidence": "MEDIUM",
                    "evidence": f"Document '{d.get('document_type')}' received LOW confidence rating.",
                })

        return recommendations


document_recommendation_engine = DocumentRecommendationEngine()

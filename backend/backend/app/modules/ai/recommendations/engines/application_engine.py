"""Application Improvement Recommendation Engine — Module 6."""

from typing import Any, Dict, List


class ApplicationRecommendationEngine:
    """Recommends application improvements and next-best actions."""

    @staticmethod
    def generate(application_data: Dict[str, Any], risk_level: str = "LOW") -> List[Dict[str, Any]]:
        recommendations = []

        if risk_level == "HIGH":
            recommendations.append({
                "type": "NEXT_BEST_ACTION",
                "action": "Provide additional income proofs or collateral documentation",
                "reason": "High financial risk level detected during assessment.",
                "confidence": "HIGH",
                "evidence": f"Risk assessment returned HIGH risk level.",
            })
        elif risk_level == "MEDIUM":
            recommendations.append({
                "type": "NEXT_BEST_ACTION",
                "action": "Upload additional bank statements for past 6 months",
                "reason": "Medium risk: additional income evidence would strengthen the application.",
                "confidence": "MEDIUM",
                "evidence": "Risk assessment returned MEDIUM risk level.",
            })

        return recommendations


application_recommendation_engine = ApplicationRecommendationEngine()

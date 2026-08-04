"""Recommendation Service — Module 6."""

from typing import Any, Dict, List, Optional
from app.modules.ai.recommendations.engines.document_engine import document_recommendation_engine
from app.modules.ai.recommendations.engines.application_engine import application_recommendation_engine


class RecommendationService:
    """Aggregates recommendations from all engines with confidence, reason, and evidence."""

    def generate(
        self,
        extracted_docs: List[Dict[str, Any]],
        application_data: Optional[Dict[str, Any]] = None,
        risk_level: str = "LOW",
    ) -> Dict[str, Any]:
        doc_recs = document_recommendation_engine.generate(extracted_docs)
        app_recs = application_recommendation_engine.generate(application_data or {}, risk_level)
        all_recs = doc_recs + app_recs
        return {
            "total_recommendations": len(all_recs),
            "recommendations": all_recs,
            "summary": f"{len(all_recs)} recommendation(s) generated to improve application outcomes.",
        }


recommendation_service = RecommendationService()

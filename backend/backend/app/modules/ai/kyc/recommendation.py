"""KYC Recommendation Engine Module.

Generates automated verification recommendations (RECOMMENDED_APPROVAL, RECOMMENDED_MANUAL_REVIEW, RECOMMENDED_REJECTION)
for human review without performing final application approvals.
"""

from typing import Any, Dict, List, Tuple


class RecommendationEngine:
    """Engine synthesizing verification checks and generating non-final recommendations for human officers."""

    @staticmethod
    def generate_recommendation(
        risks: List[Dict[str, str]],
        overall_confidence: str,
        consistency_checks: Dict[str, Any],
    ) -> Tuple[str, List[str], str]:
        """Generate non-final KYC recommendation and bulleted findings list for human review.

        Returns:
            Tuple of (recommendation, findings_list, verification_summary).
        """
        findings: List[str] = []

        high_severity_risks = [r for r in risks if r.get("severity") == "HIGH"]
        
        if high_severity_risks:
            recommendation = "RECOMMENDED_REJECTION"
            summary = "KYC Verification flagged high severity compliance risks. Manual review or document resubmission required."
            for r in risks:
                findings.append(f"RISK [{r.get('code')}]: {r.get('message')}")
        elif overall_confidence in ["MEDIUM", "LOW"] or len(risks) > 0:
            recommendation = "RECOMMENDED_MANUAL_REVIEW"
            summary = "KYC Verification requires human officer review due to medium confidence or minor warnings."
            for r in risks:
                findings.append(f"WARNING [{r.get('code')}]: {r.get('message')}")
            if not risks:
                findings.append("Confidence rating requires manual officer confirmation.")
        else:
            recommendation = "RECOMMENDED_APPROVAL"
            summary = "Automated KYC verification checks completed successfully with high confidence."
            findings.append("All mandatory identity proof documents verified successfully.")
            findings.append("Cross-document name and Date of Birth matches confirmed.")

        return recommendation, findings, summary


recommendation_engine = RecommendationEngine()

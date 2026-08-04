"""Risk Governance Configuration — Module 3.

Configurable risk policy thresholds, versioning, and human review routing.
"""

from dataclasses import dataclass, field
from typing import Any, Dict


RISK_POLICY_VERSION = "1.0.0"


@dataclass
class RiskGovernanceConfig:
    """Configurable risk governance thresholds and routing policy."""

    low_risk_threshold: float = 0.75
    medium_risk_threshold: float = 0.50
    auto_approve_risk_levels: list = field(default_factory=lambda: [])  # Never auto-approve
    manual_review_risk_levels: list = field(default_factory=lambda: ["LOW", "MEDIUM", "HIGH"])
    policy_version: str = RISK_POLICY_VERSION

    def route_for_review(self, risk_level: str) -> str:
        """Determine human review routing based on risk level.

        Returns:
            Review routing action: MANUAL_REVIEW (all levels always require human review).
        """
        return "MANUAL_REVIEW"

    def to_metadata(self) -> Dict[str, Any]:
        """Return governance metadata for audit logging."""
        return {
            "policy_version": self.policy_version,
            "low_risk_threshold": self.low_risk_threshold,
            "medium_risk_threshold": self.medium_risk_threshold,
            "auto_approve": False,
        }


risk_governance_config = RiskGovernanceConfig()

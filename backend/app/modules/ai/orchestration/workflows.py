"""Pre-defined Agent Workflow Definitions — Module 8."""

from typing import Dict, List

# Workflow step sequences (ordered agent names)
WORKFLOW_REGISTRY: Dict[str, List[str]] = {
    "KYC_WORKFLOW": ["DOCUMENT_INTELLIGENCE", "KYC_VERIFICATION"],
    "RISK_WORKFLOW": ["DOCUMENT_INTELLIGENCE", "RISK_ASSESSMENT"],
    "FULL_ONBOARDING_WORKFLOW": ["DOCUMENT_INTELLIGENCE", "KYC_VERIFICATION", "RISK_ASSESSMENT", "RECOMMENDATION"],
}

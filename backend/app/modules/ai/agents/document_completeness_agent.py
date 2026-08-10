"""Agent 5 — Document Completeness Agent

Purpose: Detect missing documents and generate actionable checklist
Workflow: Customer Selected -> Required Docs -> Compare Uploaded -> Missing Docs -> Generate Checklist
Nodes: Rule Engine, Compare, Decision, LLM, Notification
"""

import uuid
from typing import Dict, Any, List


class DocumentCompletenessAgent:
    """Code-based agent for document checklist validation and missing document detection."""

    REQUIRED_BY_PRODUCT = {
        "PERSONAL_LOAN": ["PAN Card", "Aadhaar Card", "Salary Slip", "Bank Statement"],
        "HOME_LOAN": ["PAN Card", "Aadhaar Card", "Salary Slip", "Bank Statement", "Form-16", "Property Deed"],
        "BUSINESS_LOAN": ["PAN Card", "Aadhaar Card", "Bank Statement", "GST Return", "ITR 2 Years"],
    }

    def execute(self, product_type: str = "PERSONAL_LOAN", uploaded_docs: List[str] = None) -> Dict[str, Any]:
        """Execute Agent 5 pipeline."""
        execution_id = str(uuid.uuid4())
        uploaded = uploaded_docs or ["PAN Card", "Aadhaar Card", "Salary Slip", "Bank Statement"]
        required = self.REQUIRED_BY_PRODUCT.get(product_type.upper(), self.REQUIRED_BY_PRODUCT["PERSONAL_LOAN"])

        missing = [doc for doc in required if doc not in uploaded]
        is_complete = len(missing) == 0
        completeness_percentage = round(((len(required) - len(missing)) / len(required)) * 100, 1)

        checklist = []
        for doc in required:
            status = "VERIFIED" if doc in uploaded else "MISSING"
            checklist.append({
                "document_name": doc,
                "status": status,
                "action_required": "None" if status == "VERIFIED" else f"Upload {doc} to Vault",
            })

        return {
            "agent_id": "agent-5-document-completeness",
            "execution_id": execution_id,
            "status": "SUCCESS",
            "data": {
                "product_type": product_type,
                "required_documents": required,
                "uploaded_documents": uploaded,
                "missing_documents": missing,
                "is_complete": is_complete,
                "completeness_percentage": completeness_percentage,
                "checklist": checklist,
                "notification_trigger": f"SEND_REMINDER_FOR_{len(missing)}_DOCS" if missing else "DOSSIER_COMPLETE",
            },
        }

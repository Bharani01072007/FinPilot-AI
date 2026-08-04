"""Knowledge Sources Registry — Module 4: Customer Support Knowledge Assistant."""

from typing import Any, Dict, List


KNOWLEDGE_SOURCES: Dict[str, List[Dict[str, Any]]] = {
    "application_status": [
        {"topic": "Application Status", "content": "Submitted applications are reviewed within 3-5 business days. You can check status via the application portal."},
        {"topic": "Application Review", "content": "Applications are evaluated for completeness, document verification, KYC compliance, and financial risk."},
        {"topic": "Application Approval", "content": "Final approval decisions are made by human officers after automated verification checks."},
    ],
    "document_faq": [
        {"topic": "Required Documents", "content": "Typical required documents include: Aadhaar Card, PAN Card, Bank Statement (last 3 months), Salary Slips (last 3 months)."},
        {"topic": "Document Upload", "content": "Upload documents in PDF, JPG, or PNG format. Maximum file size is 10 MB per document."},
        {"topic": "Document Verification", "content": "Uploaded documents are processed through OCR extraction and automated field validation."},
    ],
    "kyc_faq": [
        {"topic": "KYC Process", "content": "KYC verification validates your identity by cross-checking name, date of birth, and address across submitted documents."},
        {"topic": "KYC Status", "content": "KYC status can be PENDING, VERIFIED, MANUAL_REVIEW, or REJECTED. Manual review requires human officer assessment."},
    ],
    "general_faq": [
        {"topic": "Account Access", "content": "Login with your registered email and password. Contact support if you are locked out."},
        {"topic": "Processing Time", "content": "Standard processing time is 5-7 business days from submission of all required documents."},
        {"topic": "Contact Support", "content": "Reach our support team at support@finpilot.ai or call 1800-123-4567 (Mon-Sat, 9AM-6PM IST)."},
    ],
}


class KnowledgeSource:
    """Registry for knowledge base document chunks."""

    @staticmethod
    def get_all_chunks() -> List[Dict[str, Any]]:
        """Return all knowledge chunks across all categories."""
        chunks: List[Dict[str, Any]] = []
        for category, items in KNOWLEDGE_SOURCES.items():
            for item in items:
                chunks.append({"category": category, **item})
        return chunks

    @staticmethod
    def search(query: str) -> List[Dict[str, Any]]:
        """Simple keyword-based retrieval from knowledge sources."""
        query_lower = query.lower()
        results = []
        for category, items in KNOWLEDGE_SOURCES.items():
            for item in items:
                if any(w in item["content"].lower() or w in item["topic"].lower()
                       for w in query_lower.split() if len(w) > 3):
                    results.append({"category": category, **item})
        return results[:5] or KnowledgeSource.get_all_chunks()[:3]


knowledge_source = KnowledgeSource()

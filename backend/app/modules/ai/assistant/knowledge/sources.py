"""Knowledge Sources Registry — Module 4: Customer Support Knowledge Assistant.

Enriched with comprehensive FinPilot AI app feature mapping & step-by-step navigation instructions.
"""

from typing import Any, Dict, List


KNOWLEDGE_SOURCES: Dict[str, List[Dict[str, Any]]] = {
    "account_opening": [
        {
            "topic": "Account Opening Requirements & In-App Workflow",
            "content": (
                "REQUIREMENTS FOR SAVINGS & CURRENT ACCOUNTS:\n"
                "1. PAN Card & Aadhaar Card (mandatory e-KYC)\n"
                "2. Residential Address Proof\n"
                "3. Initial Deposit Amount (₹10,000 for regular savings, ₹0 for salary account)\n"
                "4. Nominee Name & Relationship\n"
                "5. FATCA Declaration (for US/International tax compliance)\n\n"
                "HOW TO DO IT IN FINPILOT AI APP:\n"
                "Option A (1-Click AI Smart Form): Go to Applications -> Smart Form Filling tab -> Select 'Savings Account'. "
                "FinPilot AI automatically pre-fills your verified PAN, Aadhaar, DOB, and Address from your Document Vault!\n"
                "Option B (Manual Application): Go to Applications -> Click 'Start New Application' -> Choose Savings/Current Account -> Enter nominee & deposit -> Click Submit."
            )
        },
        {
            "topic": "Fixed Deposit & Recurring Deposit Opening",
            "content": (
                "REQUIREMENTS:\n"
                "1. Active Savings Account in FinPilot AI\n"
                "2. Principal Deposit Amount (min ₹5,000 for FD, ₹1,000/mo for RD)\n"
                "3. Nominee Designation\n\n"
                "IN-APP STEPS:\n"
                "Go to Applications -> Click 'Start New Application' -> Select 'Fixed Deposit (FD)' or 'Recurring Deposit (RD)' -> Submit to lock competitive interest rates."
            )
        }
    ],
    "loan_products": [
        {
            "topic": "Home Loan Application & In-App Dynamic Form",
            "content": (
                "REQUIREMENTS FOR HOME LOAN:\n"
                "1. Applicant Identity (PAN, Aadhaar)\n"
                "2. Property Details (Estimated Value, Property Address, Type)\n"
                "3. Financial Proofs (Form 16, Salary Slips, 6-Month Bank Statement)\n"
                "4. Co-Applicant Details (Name, PAN, Relation) & Nominee\n"
                "5. Down Payment Amount & Requested Loan Term (up to 30 years)\n\n"
                "HOW TO DO IT IN FINPILOT AI APP:\n"
                "1. Click 'Applications' in sidebar -> Click 'Start New Application'.\n"
                "2. Select 'Home Loan (Housing Credit)' from product dropdown.\n"
                "3. Our Dynamic Application Engine will open dedicated fields for Property Address, Value, Down Payment, Co-Applicant, and Nominee.\n"
                "4. Alternatively, use 'Smart Form Filling' tab to pre-fill 80% of fields directly from your Vault!"
            )
        },
        {
            "topic": "Personal Loan & Credit Card Applications",
            "content": (
                "REQUIREMENTS FOR PERSONAL LOAN & CREDIT CARDS:\n"
                "1. Net Monthly Income Proof (₹25,000+ per month)\n"
                "2. Corporate Employer Name & Designation\n"
                "3. PAN Card & Aadhaar Identity\n"
                "4. Preferred Credit Limit or Requested Loan Amount\n\n"
                "HOW TO DO IT IN FINPILOT AI APP:\n"
                "Navigate to Applications -> Start New Application -> Choose 'Personal Loan' or 'Credit Card Application'. "
                "Fill in employer details and click Submit for fast-track AI risk scoring."
            )
        },
        {
            "topic": "Vehicle / Auto Loan & Business Expansion Credit",
            "content": (
                "REQUIREMENTS:\n"
                "1. Auto Loan: Vehicle Category (EV, SUV), Dealer Name, On-Road Price, Down Payment.\n"
                "2. Business Loan: Business Entity Type, GSTIN / Udyam Number, Annual Turnover.\n\n"
                "HOW TO DO IT IN FINPILOT AI APP:\n"
                "Go to Applications -> Start New Application -> Select 'Vehicle Financing (Auto Loan)' or 'Business Expansion Loan'. "
                "The form dynamically adjusts to gather vehicle specs or business turnover figures."
            )
        }
    ],
    "appointments": [
        {
            "topic": "Officer Consultation & Appointment Scheduling",
            "content": (
                "APPOINTMENT OPTIONS:\n"
                "- 1-on-1 Video KYC Call\n"
                "- Branch In-Person Visit\n\n"
                "HOW TO DO IT IN FINPILOT AI APP:\n"
                "1. Navigate to Applications -> Select 'Appointments' tab.\n"
                "2. Pick mode: 1-on-1 Video Call or Branch Visit.\n"
                "3. Choose an available officer (Senior Underwriting Officer, KYC Specialist, VP Risk Ops).\n"
                "4. Select Date & Time Slot (10:00 AM, 11:30 AM, 02:00 PM, 04:30 PM).\n"
                "5. Click 'Confirm Appointment Booking'. An instant reference ID (e.g. APT-2026-8801) is created and saved in your account!"
            )
        }
    ],
    "document_vault": [
        {
            "topic": "Document Vault & Automated e-KYC Verification",
            "content": (
                "VAULT FEATURES:\n"
                "- ISO 27001 document encryption & SHA-256 hash validation.\n"
                "- Automated OCR extraction with 98%+ confidence rating.\n"
                "- Supported files: PAN, Aadhaar, Form 16, Bank Statements (PDF/JPG/PNG up to 10MB).\n\n"
                "HOW TO DO IT IN FINPILOT AI APP:\n"
                "Go to Document Vault in sidebar -> Drag & drop files or click Upload Document -> Watch AI scan and assign verification status (VERIFIED). "
                "All verified documents in your Vault automatically attach to future loan and account applications!"
            )
        }
    ],
    "application_status": [
        {
            "topic": "Tracking Application Status & History Timeline",
            "content": (
                "APPLICATION STAGES:\n"
                "SUBMITTED -> UNDER_REVIEW -> APPROVED -> DISBURSED (or REJECTED/REQUIRES_INFO)\n\n"
                "HOW TO DO IT IN FINPILOT AI APP:\n"
                "1. Go to Applications -> 'Applications List' to view summary cards, status badges, and sanction amounts.\n"
                "2. Click 'Application History' tab to see step-by-step audit logs, reviewer timestamps, and officer comments."
            )
        }
    ]
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
                       for w in query_lower.split() if len(w) > 2):
                    results.append({"category": category, **item})
        return results[:5] or KnowledgeSource.get_all_chunks()[:4]


knowledge_source = KnowledgeSource()

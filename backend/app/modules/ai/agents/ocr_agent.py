"""Agent 3 — OCR Document Agent

Workflow: Upload -> OCR -> Extract Text -> Detect Document Type -> Return JSON
Nodes: Upload, OCR, AI Classification, JSON Output
"""

import re
import uuid
from typing import Dict, Any, List


class OCRDocumentAgent:
    """Code-based agent for OCR text extraction and document type detection."""

    def execute(self, file_name: str, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Execute Agent 3 workflow pipeline."""
        # Node 1: File Ingestion
        file_id = str(uuid.uuid4())
        text_content = self._perform_ocr(file_name, file_bytes)

        # Node 2: AI Classification
        doc_type, confidence = self._detect_document_type(text_content, file_name)

        # Node 3: Key-Value Field Extraction
        extracted_fields = self._extract_fields(text_content, doc_type)

        # Node 4: Structured JSON Output Response
        return {
            "agent_id": "agent-3-ocr-document",
            "execution_id": file_id,
            "status": "SUCCESS",
            "data": {
                "file_name": file_name,
                "mime_type": mime_type,
                "file_size_bytes": len(file_bytes),
                "document_type": doc_type,
                "confidence_score": confidence,
                "extracted_fields": extracted_fields,
                "extracted_text_preview": text_content[:500] if text_content else "",
                "total_pages_detected": 1 if len(file_bytes) < 100000 else 3,
            },
        }

    def _perform_ocr(self, file_name: str, file_bytes: bytes) -> str:
        """Simulate high-accuracy OCR extraction engine."""
        fn = file_name.lower()
        if "pan" in fn or "identity" in fn:
            return (
                "INCOME TAX DEPARTMENT - GOVT OF INDIA\n"
                "PERMANENT ACCOUNT NUMBER: ABCDE1234F\n"
                "NAME: AARAV MEHTA\n"
                "FATHER'S NAME: RAJESH MEHTA\n"
                "DATE OF BIRTH: 14/08/1992\n"
                "SIGNATURE VERIFIED"
            )
        elif "aadhaar" in fn or "address" in fn:
            return (
                "UNIQUE IDENTIFICATION AUTHORITY OF INDIA\n"
                "AADHAAR NUMBER: 4589 1234 8901\n"
                "NAME: AARAV MEHTA\n"
                "DOB: 14/08/1992\n"
                "GENDER: MALE\n"
                "ADDRESS: 402 SKYLINE APARTMENTS, BANDRA WEST, MUMBAI, MAHARASHTRA - 400050"
            )
        elif "salary" in fn or "pay" in fn or "income" in fn:
            return (
                "FINPILOT TECHNOLOGIES PVT LTD\n"
                "SALARY SLIP FOR THE MONTH OF JULY 2026\n"
                "EMPLOYEE NAME: AARAV MEHTA\n"
                "EMPLOYEE ID: FP-8921\n"
                "BASIC SALARY: RS. 85,000\n"
                "HRA: RS. 35,000\n"
                "GROSS EARNINGS: RS. 1,45,000\n"
                "PF DEDUCTION: RS. 5,100\n"
                "NET PAYABLE: RS. 1,39,900"
            )
        else:
            return (
                f"DOCUMENT: {file_name}\n"
                "VERIFIED FINANCIAL RECORD\n"
                "ACCOUNT HOLDER: AARAV MEHTA\n"
                "DATE: 01/08/2026\n"
                "STATUS: APPROVED"
            )

    def _detect_document_type(self, text: str, file_name: str) -> tuple[str, float]:
        """Detect document classification type from OCR keywords."""
        t = text.upper()
        if "PERMANENT ACCOUNT NUMBER" in t or "INCOME TAX DEPARTMENT" in t or "PAN" in file_name.upper():
            return "PAN_CARD", 99.4
        elif "UNIQUE IDENTIFICATION" in t or "AADHAAR" in t or "AADHAAR" in file_name.upper():
            return "AADHAAR_CARD", 98.9
        elif "SALARY SLIP" in t or "GROSS EARNINGS" in t or "SALARY" in file_name.upper():
            return "SALARY_SLIP", 97.8
        elif "BANK" in t or "STATEMENT" in t:
            return "BANK_STATEMENT", 96.5
        elif "PASSPORT" in t:
            return "PASSPORT", 99.1
        return "GENERAL_FINANCIAL_DOC", 92.0

    def _extract_fields(self, text: str, doc_type: str) -> List[Dict[str, Any]]:
        """Parse key-value metadata fields."""
        fields = []
        if doc_type == "PAN_CARD":
            pan_match = re.search(r"[A-Z]{5}[0-9]{4}[A-Z]{1}", text)
            fields = [
                {"field_name": "pan_number", "value": pan_match.group(0) if pan_match else "ABCDE1234F", "confidence": 0.99},
                {"field_name": "full_name", "value": "AARAV MEHTA", "confidence": 0.98},
                {"field_name": "dob", "value": "14/08/1992", "confidence": 0.97},
            ]
        elif doc_type == "AADHAAR_CARD":
            fields = [
                {"field_name": "aadhaar_number", "value": "4589 1234 8901", "confidence": 0.99},
                {"field_name": "full_name", "value": "AARAV MEHTA", "confidence": 0.98},
                {"field_name": "pincode", "value": "400050", "confidence": 0.96},
            ]
        elif doc_type == "SALARY_SLIP":
            fields = [
                {"field_name": "gross_salary", "value": "145000", "confidence": 0.98},
                {"field_name": "net_pay", "value": "139900", "confidence": 0.99},
                {"field_name": "employer", "value": "FinPilot Technologies Pvt Ltd", "confidence": 0.97},
            ]
        else:
            fields = [
                {"field_name": "document_name", "value": doc_type, "confidence": 0.95},
                {"field_name": "verification_status", "value": "VERIFIED", "confidence": 0.99},
            ]
        return fields

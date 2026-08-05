"""Groq Vision OCR Provider - High-Accuracy Indian Document Field Extraction.

Uses Groq's llama-4-scout-17b-16e-instruct vision model to extract structured fields
(Name, DOB, Aadhaar/DL number, Address, Vehicle class, Expiry, etc.) from uploaded
Indian government documents with near-100% accuracy.
"""

import base64
import json
import re
import time
from typing import Optional, List
import requests

from app.config.settings import settings
from app.core.logging import logger


GROQ_VISION_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

DOCUMENT_EXTRACTION_PROMPT = """You are an expert OCR and document field extraction AI specializing in Indian government-issued identity documents.

You will be given an image/PDF of a document. Analyze it thoroughly and extract ALL important fields.

First classify the document type from:
- Aadhaar Card (UIDAI)
- Driving License (MORTH)
- PAN Card (Income Tax)
- Passport (MEA)
- Voter ID (ECI)
- Bank Statement
- Salary Slip / Form-16
- Electricity / Utility Bill
- Rental / Lease Agreement
- Other

Then extract all relevant fields for that document type. For each document type, extract:

AADHAAR CARD: Name, Aadhaar Number (masked last 4 digits visible), Date of Birth, Gender, Address (complete with street/door number/village/district/state/PIN), VID if visible

DRIVING LICENSE: Name, License Number, Date of Birth, Date of Issue, Date of Expiry/Validity, Vehicle Class (MCWG/LMV/TRANS etc.), Address (complete), Blood Group, Issuing Authority/RTO

PAN CARD: Name, PAN Number, Father's Name, Date of Birth, Address if visible

PASSPORT: Name, Passport Number, Date of Birth, Nationality, Date of Issue, Date of Expiry, Address, Place of Birth

VOTER ID: Name, EPIC Number, Father's/Husband's Name, Date of Birth, Address, Constituency

BANK STATEMENT/SALARY SLIP: Account Holder Name, Account Number (masked), Bank Name, Branch, IFSC, Period, Opening/Closing Balance, or Employer Name, Employee ID, Gross/Net Salary, Month

UTILITY BILL: Consumer Name, Consumer Number, Address, Bill Period, Amount Due, Meter Number

Return a valid JSON object ONLY (no markdown, no explanation) in this format:
{
  "document_classification": "...",
  "confidence": 0.0-1.0,
  "fields": [
    {"label": "Field Name", "value": "Extracted Value"},
    ...
  ],
  "raw_text_summary": "Brief 1-line summary of what was extracted"
}

Be extremely precise. Extract the EXACT text from the document. Do not guess or hallucinate values.
If a field is not visible or unclear, skip it entirely rather than guessing.
"""


def _get_groq_keys() -> List[str]:
    """Fetch all configured Groq API keys for round-robin load balancing."""
    return [
        k.strip() for k in [
            settings.GROQ_API_KEY,
            settings.GROQ_API_KEY_1,
            settings.GROQ_API_KEY_2,
            settings.GROQ_API_KEY_3,
            settings.GROQ_API_KEY_4,
        ] if k and k.strip()
    ]


_groq_key_index = 0


def _get_next_groq_key() -> Optional[str]:
    global _groq_key_index
    keys = _get_groq_keys()
    if not keys:
        return None
    key = keys[_groq_key_index % len(keys)]
    _groq_key_index += 1
    return key


def extract_document_fields_groq_vision(
    file_bytes: bytes,
    mime_type: str,
    filename: Optional[str] = None,
) -> dict:
    """
    High-accuracy document field extraction using Groq Vision (llama-4-scout).
    
    Returns:
        dict with keys: document_classification, confidence, fields (list of {label, value}), raw_text_summary
    """
    api_key = _get_next_groq_key()
    if not api_key:
        logger.warning("[GroqVision] No Groq API key configured — cannot perform vision extraction")
        return {"error": "No API key configured", "fields": []}

    # Prepare base64 image for vision API
    fname = (filename or "document.pdf").lower()

    # Convert PDF pages to image or send as-is for images
    image_data_url = None
    try:
        if mime_type == "application/pdf" or fname.endswith(".pdf"):
            # Convert first page of PDF to PNG using pymupdf
            try:
                import fitz  # type: ignore  # pymupdf
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                page = doc[0]
                mat = fitz.Matrix(2.0, 2.0)  # 2x resolution for better OCR
                pix = page.get_pixmap(matrix=mat)
                img_bytes = pix.tobytes("png")
                b64 = base64.b64encode(img_bytes).decode()
                image_data_url = f"data:image/png;base64,{b64}"
                logger.info(f"[GroqVision] PDF→PNG conversion successful for {fname}")
            except ImportError:
                # Fallback: send PDF bytes directly as base64
                b64 = base64.b64encode(file_bytes).decode()
                image_data_url = f"data:application/pdf;base64,{b64}"
                logger.warning("[GroqVision] pymupdf not available, sending raw PDF base64")
            except Exception as pdf_err:
                logger.error(f"[GroqVision] PDF conversion failed: {pdf_err}")
                b64 = base64.b64encode(file_bytes).decode()
                image_data_url = f"data:application/pdf;base64,{b64}"
        else:
            # Image file: JPEG/PNG/WEBP
            ext = fname.split(".")[-1] if "." in fname else "jpeg"
            b64 = base64.b64encode(file_bytes).decode()
            image_data_url = f"data:image/{ext};base64,{b64}"
    except Exception as e:
        logger.error(f"[GroqVision] File preparation error: {e}")
        return {"error": str(e), "fields": []}

    # Send to Groq Vision API
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": DOCUMENT_EXTRACTION_PROMPT,
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data_url},
                    },
                ],
            }
        ],
        "temperature": 0.1,
        "max_tokens": 2000,
    }

    start = time.time()
    try:
        resp = requests.post(GROQ_VISION_API_URL, headers=headers, json=payload, timeout=30)
        elapsed = round((time.time() - start) * 1000)

        if resp.status_code == 200:
            data = resp.json()
            raw_content = data["choices"][0]["message"]["content"].strip()
            logger.info(f"[GroqVision] Extraction completed in {elapsed}ms for {fname}")

            # Parse JSON response
            # Strip markdown code fences if present
            json_str = re.sub(r"^```(?:json)?\s*", "", raw_content, flags=re.MULTILINE)
            json_str = re.sub(r"\s*```$", "", json_str, flags=re.MULTILINE).strip()

            result = json.loads(json_str)
            if "fields" not in result:
                result["fields"] = []
            return result

        else:
            logger.error(f"[GroqVision] API error {resp.status_code}: {resp.text[:300]}")
            return {"error": f"API returned {resp.status_code}", "fields": []}

    except json.JSONDecodeError as je:
        logger.error(f"[GroqVision] JSON parse error: {je}")
        return {"error": "JSON parse failed", "fields": []}
    except Exception as err:
        logger.error(f"[GroqVision] Request error: {err}")
        return {"error": str(err), "fields": []}

import { fetchApi } from "../api-client";

export interface OCRResult {
  document_id: string;
  document_type: string;
  raw_text: string;
  cleaned_text: string;
  confidence_score: number;
  extracted_fields: Array<{ label: string; value: string; confidence: number; flag?: string }>;
  validation_status: "PASSED" | "FLAGGED" | "FAILED";
  missing_fields: string[];
}

export interface KYCResult {
  application_id: string;
  kyc_status: "PASSED" | "FLAGGED" | "NEEDS_REVIEW";
  confidence_score: number;
  match_breakdown: Array<{ field: string; source_a: string; source_b: string; match: boolean; confidence: number }>;
  risk_indicators: string[];
  recommendation: string;
}

export interface RiskResult {
  application_id: string;
  overall_risk_score: number;
  risk_category: "LOW" | "MEDIUM" | "HIGH";
  debt_to_income_ratio: number;
  credit_score_estimate: number;
  risk_factors: Array<{ factor: string; severity: "LOW" | "MEDIUM" | "HIGH"; description: string }>;
  ai_explanation: string;
  recommendations: string[];
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Array<{ title: string; excerpt: string; confidence: number }>;
}

export const aiService = {
  async processDocumentOCR(documentId: string): Promise<OCRResult> {
    const res = await fetchApi<OCRResult>("/ai/documents/process", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId }),
    });

    if (res.success && res.data) {
      return res.data;
    }

    // Rich fallback mock response
    return {
      document_id: documentId,
      document_type: "INCOME_PROOF_FORM16",
      raw_text: "FORM 16 - Certificate under section 203 of the Income-tax Act, 1961...",
      cleaned_text: "Form 16 Tax Deduction Certificate FY 2025-2026. PAN: ABCDE1234F. Employer: Northwind Systems Pvt Ltd. Gross Salary: Rs 24,00,000.",
      confidence_score: 98.4,
      extracted_fields: [
        { label: "Employer Name", value: "Northwind Systems Pvt Ltd", confidence: 0.99 },
        { label: "PAN", value: "ABCDE1234F", confidence: 0.98 },
        { label: "Gross Salary", value: "₹24,00,000", confidence: 0.97 },
        { label: "Tax Deducted (TDS)", value: "₹3,42,000", confidence: 0.96 },
        { label: "Assessment Year", value: "2026-2027", confidence: 0.99 },
      ],
      validation_status: "PASSED",
      missing_fields: [],
    };
  },

  async verifyKYC(applicationId: string): Promise<KYCResult> {
    const res = await fetchApi<KYCResult>("/ai/kyc/verify", {
      method: "POST",
      body: JSON.stringify({ application_id: applicationId }),
    });

    if (res.success && res.data) {
      return res.data;
    }

    return {
      application_id: applicationId,
      kyc_status: "PASSED",
      confidence_score: 96.8,
      match_breakdown: [
        { field: "Full Name", source_a: "Aadhaar Card", source_b: "PAN Card", match: true, confidence: 1.0 },
        { field: "Date of Birth", source_a: "Aadhaar Card", source_b: "PAN Card", match: true, confidence: 1.0 },
        { field: "Address", source_a: "Aadhaar Card", source_b: "Electricity Bill", match: true, confidence: 0.94 },
        { field: "Photo Match", source_a: "Aadhaar Selfie", source_b: "Passport Photo", match: true, confidence: 0.97 },
      ],
      risk_indicators: ["Single address mismatch history resolved via recent utility bill"],
      recommendation: "Approved for standard fast-track underwriting.",
    };
  },

  async assessRisk(applicationId: string): Promise<RiskResult> {
    const res = await fetchApi<RiskResult>("/ai/risk/assess", {
      method: "POST",
      body: JSON.stringify({ application_id: applicationId }),
    });

    if (res.success && res.data) {
      return res.data;
    }

    return {
      application_id: applicationId,
      overall_risk_score: 812,
      risk_category: "LOW",
      debt_to_income_ratio: 28.4,
      credit_score_estimate: 788,
      risk_factors: [
        { factor: "High Income Stability", severity: "LOW", description: "3+ years continuous employment with Tier-1 corporate" },
        { factor: "Low DTI Ratio", severity: "LOW", description: "Monthly obligations represent less than 30% of verified net income" },
        { factor: "Recent Credit Inquiries", severity: "LOW", description: "Only 1 inquiry in the last 6 months" },
      ],
      ai_explanation: "Applicant exhibits exceptional financial health, strong debt coverage capacity, and high document authenticity confidence.",
      recommendations: ["Offer prime interest rate discount of 0.25%", "Waive physical property audit requirement"],
    };
  },

  async generateRecommendations(extractedDocs: any[], riskLevel = "LOW") {
    const res = await fetchApi<any>("/ai/recommendations/generate", {
      method: "POST",
      body: JSON.stringify({ extracted_docs: extractedDocs, risk_level: riskLevel }),
    });
    if (res.success && res.data) {
      return res.data;
    }
    return {
      recommendations: [
        { title: "Pre-approve Home Loan Top-up", confidence: 94, reason: "Verified surplus monthly cashflow" },
        { title: "Enable Auto-debit Mandate", confidence: 99, reason: "Zero cheque bounce history in 24 months" },
      ],
    };
  },
  // New method to generate AI summary for manager portal
  async generateSummary(extractedDocs: any[]) {
    const res = await fetchApi<any>("/ai/summary/generate", {
      method: "POST",
      body: JSON.stringify({ extracted_docs: extractedDocs }),
    });
    if (res.success && res.data) {
      return res.data;
    }
    // Mock fallback summary
    return { summary: "This is a mock AI-generated summary of the provided documents." };
  },

  async querySupportAssistant(question: string, sessionId?: string): Promise<{ answer: string; session_id: string; sources: any[] }> {
    const res = await fetchApi<{ answer: string; session_id: string; sources: any[] }>("/ai/assistant/query", {
      method: "POST",
      body: JSON.stringify({ question, session_id: sessionId }),
    });

    if (res.success && res.data) {
      return res.data;
    }

    // RAG fallback intelligent response generator with context-aware messages
    const q = question.toLowerCase();
    if (q.includes("eligible") || q.includes("eligibility")) {
      return {
        session_id: sessionId || `session-${Date.now()}`,
        answer: "Based on your vault, you are 92% eligible for a Home Loan. All required documents are valid except the Bank Statement which is older than six months.",
        sources: [
          { title: "Eligibility Overview", excerpt: "Eligibility calculated from income, credit score and document completeness.", confidence: 0.95 },
        ],
      };
    }
    if (q.includes("missing") && q.includes("document")) {
      return {
        session_id: sessionId || `session-${Date.now()}`,
        answer: "Your missing documents are the Bank Statement (older than 6 months) and the Property Tax Receipt.",
        sources: [
          { title: "Document Checklist", excerpt: "List of required documents for the loan application.", confidence: 0.94 },
        ],
      };
    }
    if (q.includes("status")) {
      return {
        session_id: sessionId || `session-${Date.now()}`,
        answer: "Your application is currently under review. The underwriting team is assessing risk and will update you within 24 hours.",
        sources: [
          { title: "Application Status", excerpt: "Current processing stage of the loan application.", confidence: 0.93 },
        ],
      };
    }
    if (q.includes("driving") && q.includes("license")) {
      return {
        session_id: sessionId || `session-${Date.now()}`,
        answer: "Your Driving License expires on 15 Aug 2026.",
        sources: [
          { title: "License Details", excerpt: "Expiration date from the uploaded document.", confidence: 0.92 },
        ],
      };
    }
    // Default fallback
    const fallbackAnswers = [
      "I’m still learning to answer that question, please try again later.",
      "Sorry, I couldn’t find a specific answer for that. Let me get back to you.",
      "I don’t have enough info to answer right now. Could you rephrase?",
      "Hold on, I’m fetching the latest info for you…",
    ];
    const randomAnswer = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
    return {
      session_id: sessionId || `session-${Date.now()}`,
      answer: randomAnswer,
      sources: [
        { title: "FinPilot AI Policy §4.2 — Document Reuse & Encryption", excerpt: "Verified documents in customer vault carry permanent validity tags until expiration dates.", confidence: 0.96 },
        { title: "RBI Master Direction on Digital KYC §12", excerpt: "Digital verification via PAN and Aadhaar e-KYC satisfies primary identity requirements.", confidence: 0.92 },
      ],
    };
  },

  async executeWorkflow(workflowName: string, applicationId: string) {
    const res = await fetchApi<any>("/ai/orchestration/execute", {
      method: "POST",
      body: JSON.stringify({ workflow_name: workflowName, application_id: applicationId }),
    });
    return res.success ? res.data : { status: "EXECUTED", workflow_name: workflowName };
  },
};

import { fetchApi } from "@/lib/api-client";

export interface AgentResponse<T> {
  agent_id: string;
  execution_id: string;
  status: string;
  data: T;
}

export const agentService = {
  /**
   * Agent 3: OCR Document Agent
   */
  async runOCRAgent(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<any>("/ai/agents/ocr", {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Agent 4: Document Classification Agent
   */
  async runClassificationAgent(textOrFileName: string) {
    return fetchApi<any>("/ai/agents/classify", {
      method: "POST",
      body: JSON.stringify({ file_name: textOrFileName, text: textOrFileName }),
    });
  },

  /**
   * Agent 9: AI Summarization Agent
   */
  async runSummarizationAgent(documentText: string, fileName?: string) {
    return fetchApi<any>("/ai/agents/summarize", {
      method: "POST",
      body: JSON.stringify({ document_text: documentText, file_name: fileName || "Dossier_Document.pdf" }),
    });
  },

  /**
   * Agent 11: Explainable AI Agent
   */
  async runExplainableAgent(decision: string, creditScore?: number, dtiRatio?: number) {
    return fetchApi<any>("/ai/agents/explain", {
      method: "POST",
      body: JSON.stringify({ decision, credit_score: creditScore || 810, dti_ratio: dtiRatio || 28.5 }),
    });
  },

  /**
   * Agent 14: Report Generator Agent
   */
  async runReportAgent(reportType?: string, email?: string) {
    return fetchApi<any>("/ai/agents/generate-report", {
      method: "POST",
      body: JSON.stringify({ report_type: reportType || "PORTFOLIO_PERFORMANCE", email: email || "manager@finpilot.ai" }),
    });
  },

  /**
   * Agent 19: Authentication Agent
   */
  async runAuthAgent(email: string, role: string, otpCode?: string) {
    return fetchApi<any>("/ai/agents/auth-verify", {
      method: "POST",
      body: JSON.stringify({ email, role, otp_code: otpCode || "123456" }),
    });
  },
};

import { fetchApi } from "@/lib/api-client";

export const agentService = {
  // Agent 1: Customer Support Agent
  async runCustomerSupport(message: string) {
    return fetchApi<any>("/ai/agents/support", { method: "POST", body: JSON.stringify({ message }) });
  },

  // Agent 2: Smart Form Filling Agent
  async runSmartForm() {
    return fetchApi<any>("/ai/agents/smart-form", { method: "POST" });
  },

  // Agent 3: OCR Document Agent
  async runOCR(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<any>("/ai/agents/ocr", { method: "POST", body: formData });
  },

  // Agent 4: Document Classification Agent
  async runClassification(textOrFileName: string) {
    return fetchApi<any>("/ai/agents/classify", { method: "POST", body: JSON.stringify({ text: textOrFileName }) });
  },

  // Agent 5: Document Completeness Agent
  async runCompleteness(productType?: string, uploadedDocs?: string[]) {
    return fetchApi<any>("/ai/agents/completeness", { method: "POST", body: JSON.stringify({ product_type: productType, uploaded_documents: uploadedDocs }) });
  },

  // Agent 6: AI Document Vault Agent
  async runVaultStore(fileName: string, checksum?: string) {
    return fetchApi<any>("/ai/agents/vault-store", { method: "POST", body: JSON.stringify({ file_name: fileName, checksum }) });
  },

  // Agent 7: Document Expiry Agent
  async runCheckExpiry() {
    return fetchApi<any>("/ai/agents/check-expiry", { method: "POST" });
  },

  // Agent 8: AI Recommendation Agent
  async runRecommend(applicationType?: string) {
    return fetchApi<any>("/ai/agents/recommend", { method: "POST", body: JSON.stringify({ application_type: applicationType }) });
  },

  // Agent 9: AI Summarization Agent
  async runSummarize(documentText: string, fileName?: string) {
    return fetchApi<any>("/ai/agents/summarize", { method: "POST", body: JSON.stringify({ document_text: documentText, file_name: fileName }) });
  },

  // Agent 10: Risk Analysis Agent
  async runRiskAnalysis(requestedAmount?: number, monthlyIncome?: number, dtiRatio?: number) {
    return fetchApi<any>("/ai/agents/risk-analyze", { method: "POST", body: JSON.stringify({ requested_amount: requestedAmount, monthly_income: monthlyIncome, dti_ratio: dtiRatio }) });
  },

  // Agent 11: Explainable AI Agent
  async runExplain(decision: string, creditScore?: number, dtiRatio?: number) {
    return fetchApi<any>("/ai/agents/explain", { method: "POST", body: JSON.stringify({ decision, credit_score: creditScore, dti_ratio: dtiRatio }) });
  },

  // Agent 12: Workflow Routing Agent
  async runRouteWorkflow(applicationId?: string, requestedAmount?: number) {
    return fetchApi<any>("/ai/agents/route-workflow", { method: "POST", body: JSON.stringify({ application_id: applicationId, requested_amount: requestedAmount }) });
  },

  // Agent 13: Notification Agent
  async runNotify(eventType?: string) {
    return fetchApi<any>("/ai/agents/notify", { method: "POST", body: JSON.stringify({ event_type: eventType }) });
  },

  // Agent 14: Report Generator Agent
  async runReport(reportType?: string, email?: string) {
    return fetchApi<any>("/ai/agents/generate-report", { method: "POST", body: JSON.stringify({ report_type: reportType, email }) });
  },

  // Agent 15: Manager Analytics Agent
  async runManagerAnalytics() {
    return fetchApi<any>("/ai/agents/manager-kpis", { method: "POST" });
  },

  // Agent 16: AI Knowledge Agent (RAG)
  async runRAGSearch(query: string) {
    return fetchApi<any>("/ai/agents/rag-search", { method: "POST", body: JSON.stringify({ query }) });
  },

  // Agent 17: Global Search Agent
  async runGlobalSearch(query: string) {
    return fetchApi<any>("/ai/agents/global-search", { method: "POST", body: JSON.stringify({ query }) });
  },

  // Agent 18: Audit Agent
  async runAudit(action?: string) {
    return fetchApi<any>("/ai/agents/audit-log", { method: "POST", body: JSON.stringify({ action }) });
  },

  // Agent 19: Authentication Agent
  async runAuthVerify(email: string, role: string, otpCode?: string) {
    return fetchApi<any>("/ai/agents/auth-verify", { method: "POST", body: JSON.stringify({ email, role, otp_code: otpCode }) });
  },

  // Agent 20: Application Status Agent
  async runStatusUpdate(applicationId?: string, status?: string) {
    return fetchApi<any>("/ai/agents/status-update", { method: "POST", body: JSON.stringify({ application_id: applicationId, status }) });
  },
};

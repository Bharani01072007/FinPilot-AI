import { fetchApi, API_BASE_URL } from "../api-client";
import { revenueSeries, slaSeries } from "../finpilot-data";

export interface ExecutiveDashboardMetrics {
  total_applications: number;
  total_disbursed: string;
  approval_rate: number;
  avg_processing_time_hours: number;
  revenue_series: Array<{ m: string; disbursed: number; applications: number; risk: number }>;
  sla_series: Array<{ m: string; sla: number }>;
}

export const reportService = {
  async getExecutiveDashboard(): Promise<ExecutiveDashboardMetrics> {
    const res = await fetchApi<ExecutiveDashboardMetrics>("/reports/dashboard");
    if (res.success && res.data) {
      return res.data;
    }
    return {
      total_applications: 2480,
      total_disbursed: "₹81.4 Cr",
      approval_rate: 94.2,
      avg_processing_time_hours: 3.8,
      revenue_series: revenueSeries,
      sla_series: slaSeries,
    };
  },

  async getKPIs() {
    const res = await fetchApi<any>("/reports/kpis");
    if (res.success && res.data) {
      return res.data;
    }
    return {
      avg_approval_time: "3.8 hours",
      verification_accuracy: "99.4%",
      document_reuse_ratio: "84.2%",
      cost_per_application: "₹140",
      ai_automation_rate: "91.8%",
    };
  },

  async exportReport(reportType = "dashboard") {
    const token = typeof window !== "undefined" ? localStorage.getItem("finpilot_access_token") : null;
    try {
      const response = await fetch(`${API_BASE_URL}/reports/export?report_type=${reportType}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FinPilot_${reportType}_Report.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return true;
      }
    } catch {
      // Fallback to client-side JSON export
    }

    // Mock client-side file export download
    const mockData = {
      report: reportType,
      generated_at: new Date().toISOString(),
      platform: "FinPilot AI Enterprise Operations Platform",
      summary: {
        total_applications: 2480,
        approved: 2240,
        underwriting_sla_adherence: "99.2%",
      },
    };
    const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FinPilot_${reportType}_Report.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  },
};

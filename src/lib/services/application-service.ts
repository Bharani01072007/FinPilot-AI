import { fetchApi } from "../api-client";
import { applications as mockApplications, activity as mockActivity } from "../finpilot-data";

export interface ApplicationItem {
  id: string;
  application_number: string;
  customer_name: string;
  customer_id?: string;
  application_type: string;
  requested_amount: number;
  status: string;
  priority: string;
  assigned_employee_id?: string;
  assigned_employee_name?: string;
  created_at: string;
  updated_at: string;
  risk_score?: number;
  risk_level?: string;
}

export interface ApplicationDashboardSummary {
  total_applications: number;
  pending_count: number;
  underwriting_count: number;
  approved_count: number;
  rejected_count: number;
  sla_breached_count: number;
  total_disbursed_amount: number;
}

export const applicationService = {
  async getDashboardSummary(): Promise<ApplicationDashboardSummary> {
    const res = await fetchApi<ApplicationDashboardSummary>("/applications/dashboard/summary");
    if (res.success && res.data) {
      return res.data;
    }
    return {
      total_applications: 1248,
      pending_count: 18,
      underwriting_count: 42,
      approved_count: 1120,
      rejected_count: 68,
      sla_breached_count: 3,
      total_disbursed_amount: 81000000,
    };
  },

  async listApplications(params?: {
    search?: string;
    status?: string;
    application_type?: string;
    page?: number;
  }): Promise<{ items: ApplicationItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status) query.append("status", params.status);
    if (params?.application_type) query.append("application_type", params.application_type);
    if (params?.page) query.append("page", params.page.toString());

    const res = await fetchApi<{ items: ApplicationItem[]; total: number }>(`/applications?${query.toString()}`);
    if (res.success && res.data?.items) {
      return res.data;
    }

    // Map mock data fallback
    const mappedMock: ApplicationItem[] = mockApplications.map((app, idx) => ({
      id: app.id,
      application_number: app.id,
      customer_name: app.customer,
      application_type: app.product,
      requested_amount: parseInt(app.amount.replace(/[^0-9]/g, "")) || 5000000,
      status: app.stage,
      priority: app.risk === "High" ? "HIGH" : app.risk === "Medium" ? "MEDIUM" : "LOW",
      created_at: new Date(Date.now() - idx * 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - idx * 3600000).toISOString(),
      risk_score: app.score,
      risk_level: app.risk,
    }));

    return {
      items: mappedMock,
      total: mappedMock.length,
    };
  },

  async getApplicationById(id: string): Promise<ApplicationItem | null> {
    const res = await fetchApi<ApplicationItem>(`/applications/${id}`);
    if (res.success && res.data) {
      return res.data;
    }
    const match = mockApplications.find((a) => a.id === id);
    if (match) {
      return {
        id: match.id,
        application_number: match.id,
        customer_name: match.customer,
        application_type: match.product,
        requested_amount: parseInt(match.amount.replace(/[^0-9]/g, "")) || 5000000,
        status: match.stage,
        priority: match.risk === "High" ? "HIGH" : "MEDIUM",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        risk_score: match.score,
        risk_level: match.risk,
      };
    }
    return null;
  },

  async createApplication(data: {
    customer_name: string;
    application_type: string;
    requested_amount: number;
    notes?: string;
  }): Promise<ApplicationItem> {
    const res = await fetchApi<ApplicationItem>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.success && res.data) {
      return res.data;
    }
    return {
      id: `APP-${Math.floor(10000 + Math.random() * 90000)}`,
      application_number: `APP-${Math.floor(10000 + Math.random() * 90000)}`,
      customer_name: data.customer_name,
      application_type: data.application_type,
      requested_amount: data.requested_amount,
      status: "Submitted",
      priority: "MEDIUM",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      risk_score: 750,
      risk_level: "Low",
    };
  },

  async transitionStatus(id: string, newStatus: string, remarks?: string): Promise<boolean> {
    const res = await fetchApi(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus, remarks }),
    });
    return res.success;
  },

  async assignOfficer(id: string, employeeId: string): Promise<boolean> {
    const res = await fetchApi(`/applications/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ employee_id: employeeId }),
    });
    return res.success;
  },

  async getStatusHistory(id: string) {
    const res = await fetchApi<any[]>(`/applications/${id}/history`);
    if (res.success && res.data) {
      return res.data;
    }
    return mockActivity.map((act, i) => ({
      id: `hist-${i}`,
      status: act.title,
      remarks: act.meta,
      created_at: new Date(Date.now() - i * 3600000 * 2).toISOString(),
    }));
  },
};

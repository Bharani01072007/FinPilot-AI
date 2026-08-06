/**
 * FinPilot AI — Application Service
 * All data fetched live from Supabase. No mock fallbacks.
 */

import { supabase } from "../supabase";
import { fetchApi } from "../api-client";

export interface ApplicationItem {
  id: string;
  application_number: string;
  customer_name: string;
  customer_email?: string;
  customer_id?: string;
  application_type: string;
  requested_amount: number;
  sanctioned_amount?: number;
  status: string;
  priority: string;
  risk_score?: number;
  risk_level?: string;
  dti_ratio?: number;
  assigned_employee_id?: string;
  assigned_employee_name?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
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

function mapRiskLevel(score?: number): string {
  if (!score) return "Unknown";
  if (score >= 750) return "Low";
  if (score >= 650) return "Medium";
  return "High";
}

function mapPriority(risk?: string): string {
  if (risk === "High") return "HIGH";
  if (risk === "Medium") return "MEDIUM";
  return "LOW";
}

export const applicationService = {
  async getDashboardSummary(): Promise<ApplicationDashboardSummary> {
    const { data, error } = await supabase
      .from("applications")
      .select("status, sanctioned_amount, requested_amount");

    if (!error && data) {
      const total = data.length;
      const pending = data.filter((a) => a.status === "SUBMITTED" || a.status === "DOCUMENT_PENDING").length;
      const underwriting = data.filter((a) => a.status === "UNDER_REVIEW").length;
      const approved = data.filter((a) => a.status === "APPROVED" || a.status === "COMPLETED").length;
      const rejected = data.filter((a) => a.status === "REJECTED").length;
      const totalDisbursed = data
        .filter((a) => a.status === "APPROVED" || a.status === "COMPLETED")
        .reduce((sum, a) => sum + (Number(a.sanctioned_amount) || Number(a.requested_amount) || 0), 0);

      return {
        total_applications: total,
        pending_count: pending,
        underwriting_count: underwriting,
        approved_count: approved,
        rejected_count: rejected,
        sla_breached_count: 0, // would need SLA timestamps
        total_disbursed_amount: totalDisbursed,
      };
    }

    // Fallback to backend API
    const res = await fetchApi<ApplicationDashboardSummary>("/applications/dashboard/summary");
    if (res.success && res.data) return res.data;

    return {
      total_applications: 0,
      pending_count: 0,
      underwriting_count: 0,
      approved_count: 0,
      rejected_count: 0,
      sla_breached_count: 0,
      total_disbursed_amount: 0,
    };
  },

  async listApplications(params?: {
    search?: string;
    status?: string;
    application_type?: string;
    user_id?: string;
    page?: number;
  }): Promise<{ items: ApplicationItem[]; total: number }> {
    let query = supabase
      .from("applications")
      .select(`
        *,
        users!applications_user_id_fkey(first_name, last_name, email),
        assigned:users!applications_assigned_officer_id_fkey(first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    if (params?.status) query = query.eq("status", params.status);
    if (params?.application_type) query = query.ilike("application_type", `%${params.application_type}%`);
    if (params?.user_id) query = query.eq("user_id", params.user_id);
    if (params?.search) {
      query = query.or(
        `application_number.ilike.%${params.search}%,application_type.ilike.%${params.search}%`
      );
    }

    const { data, error } = await query;

    if (!error && data) {
      const items: ApplicationItem[] = data.map((a: any) => {
        const riskLevel = mapRiskLevel(a.risk_score);
        return {
          id: a.id,
          application_number: a.application_number,
          customer_name: a.users ? `${a.users.first_name} ${a.users.last_name}` : "Unknown",
          customer_email: a.users?.email,
          customer_id: a.user_id,
          application_type: a.application_type,
          requested_amount: Number(a.requested_amount),
          sanctioned_amount: a.sanctioned_amount ? Number(a.sanctioned_amount) : undefined,
          status: a.status,
          priority: mapPriority(riskLevel),
          risk_score: a.risk_score ?? undefined,
          risk_level: riskLevel,
          dti_ratio: a.dti_ratio ? Number(a.dti_ratio) : undefined,
          assigned_employee_id: a.assigned_officer_id ?? undefined,
          assigned_employee_name: a.assigned
            ? `${a.assigned.first_name} ${a.assigned.last_name}`
            : undefined,
          remarks: a.remarks ?? undefined,
          created_at: a.created_at,
          updated_at: a.updated_at,
        };
      });
      return { items, total: items.length };
    }

    // Fallback to backend API
    const searchQuery = new URLSearchParams();
    if (params?.search) searchQuery.append("search", params.search);
    if (params?.status) searchQuery.append("status", params.status);
    if (params?.application_type) searchQuery.append("application_type", params.application_type);
    if (params?.page) searchQuery.append("page", params.page.toString());

    const res = await fetchApi<{ items: ApplicationItem[]; total: number }>(
      `/applications?${searchQuery.toString()}`
    );
    return res.success && res.data?.items ? res.data : { items: [], total: 0 };
  },

  async getApplicationById(id: string): Promise<ApplicationItem | null> {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        users!applications_user_id_fkey(first_name, last_name, email),
        assigned:users!applications_assigned_officer_id_fkey(first_name, last_name)
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      const a = data as any;
      const riskLevel = mapRiskLevel(a.risk_score);
      return {
        id: a.id,
        application_number: a.application_number,
        customer_name: a.users ? `${a.users.first_name} ${a.users.last_name}` : "Unknown",
        customer_email: a.users?.email,
        customer_id: a.user_id,
        application_type: a.application_type,
        requested_amount: Number(a.requested_amount),
        sanctioned_amount: a.sanctioned_amount ? Number(a.sanctioned_amount) : undefined,
        status: a.status,
        priority: mapPriority(riskLevel),
        risk_score: a.risk_score ?? undefined,
        risk_level: riskLevel,
        dti_ratio: a.dti_ratio ? Number(a.dti_ratio) : undefined,
        assigned_employee_id: a.assigned_officer_id ?? undefined,
        assigned_employee_name: a.assigned
          ? `${a.assigned.first_name} ${a.assigned.last_name}`
          : undefined,
        remarks: a.remarks ?? undefined,
        created_at: a.created_at,
        updated_at: a.updated_at,
      };
    }

    const res = await fetchApi<ApplicationItem>(`/applications/${id}`);
    return res.success && res.data ? res.data : null;
  },

  async createApplication(data: {
    customer_name: string;
    application_type: string;
    requested_amount: number;
    notes?: string;
  }): Promise<ApplicationItem | null> {
    const res = await fetchApi<ApplicationItem>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.success && res.data ? res.data : null;
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

  async getStatusHistory(id: string): Promise<{ id: string; status: string; remarks?: string; created_at: string; changed_by_name?: string }[]> {
    const { data, error } = await supabase
      .from("application_status_history")
      .select("*, users(first_name, last_name)")
      .eq("application_id", id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((h: any) => ({
        id: h.id,
        status: h.status,
        remarks: h.remarks,
        created_at: h.created_at,
        changed_by_name: h.users ? `${h.users.first_name} ${h.users.last_name}` : undefined,
      }));
    }

    const res = await fetchApi<any[]>(`/applications/${id}/history`);
    return res.success && res.data ? res.data : [];
  },

  async getMonthlyTrend(): Promise<{ month: string; submitted: number; approved: number; rejected: number }[]> {
    const { data } = await supabase
      .from("applications")
      .select("created_at, status")
      .gte("created_at", new Date(Date.now() - 180 * 86400000).toISOString())
      .order("created_at");

    if (data?.length) {
      const monthMap: Record<string, { submitted: number; approved: number; rejected: number }> = {};
      for (const row of data) {
        const m = new Date(row.created_at).toLocaleString("en-GB", { month: "short" });
        if (!monthMap[m]) monthMap[m] = { submitted: 0, approved: 0, rejected: 0 };
        monthMap[m].submitted += 1;
        if (row.status === "APPROVED" || row.status === "COMPLETED") monthMap[m].approved += 1;
        if (row.status === "REJECTED") monthMap[m].rejected += 1;
      }
      return Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));
    }
    return [];
  },
};

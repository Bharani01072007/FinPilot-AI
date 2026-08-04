import { fetchApi } from "../api-client";

export interface UserAccountItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_locked?: boolean;
  is_suspended?: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description: string;
}

export const userService = {
  async listUsers(params?: { search?: string; role?: string }): Promise<UserAccountItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.role) query.append("role", params.role);

    const res = await fetchApi<{ items: UserAccountItem[] }>(`/users?${query.toString()}`);
    if (res.success && res.data?.items) {
      return res.data.items;
    }

    // Mock fallback users list
    return [
      { id: "u-101", email: "aarav@finpilot.ai", first_name: "Aarav", last_name: "Mehta", role: "Customer", is_active: true, created_at: "2026-01-15" },
      { id: "u-102", email: "priya.verma@finpilot.ai", first_name: "Priya", last_name: "Verma", role: "Employee", is_active: true, created_at: "2025-11-20" },
      { id: "u-103", email: "daniel.cole@finpilot.ai", first_name: "Daniel", last_name: "Cole", role: "Manager", is_active: true, created_at: "2025-08-10" },
      { id: "u-104", email: "isha.rao@enterprise.com", first_name: "Isha", last_name: "Rao", role: "Customer", is_active: true, created_at: "2026-02-04" },
      { id: "u-105", email: "rohan.gupta@northwind.com", first_name: "Rohan", last_name: "Gupta", role: "Customer", is_active: false, created_at: "2026-03-01" },
    ];
  },

  async listRoles(): Promise<RoleItem[]> {
    const res = await fetchApi<RoleItem[]>("/roles");
    if (res.success && res.data) {
      return res.data;
    }
    return [
      { id: "r-customer", name: "Customer", description: "Standard portal access for personal & business applicants" },
      { id: "r-employee", name: "Employee", description: "Underwriting, document verification, & case review access" },
      { id: "r-manager", name: "Manager", description: "Executive approvals, risk oversight, analytics & audit controls" },
      { id: "r-admin", name: "Admin", description: "Full tenant administration, user management, and security controls" },
    ];
  },

  async createUser(data: { email: string; first_name: string; last_name: string; role_name: string }): Promise<boolean> {
    const res = await fetchApi("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.success;
  },

  async assignRole(userId: string, roleName: string): Promise<boolean> {
    const res = await fetchApi(`/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify({ role_name: roleName }),
    });
    return res.success;
  },

  async toggleActiveStatus(userId: string, activate: boolean): Promise<boolean> {
    const endpoint = activate ? `/users/${userId}/activate` : `/users/${userId}/deactivate`;
    const res = await fetchApi(endpoint, { method: "PATCH" });
    return res.success;
  },

  async revokeAllSessions(userId: string): Promise<boolean> {
    const res = await fetchApi(`/users/${userId}/sessions`, { method: "DELETE" });
    return res.success;
  },
};

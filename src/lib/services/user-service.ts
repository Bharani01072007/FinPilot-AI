/**
 * FinPilot AI — User Service
 * All data fetched live from Supabase. No mock fallbacks.
 */

import { supabase } from "../supabase";
import { fetchApi } from "../api-client";

export interface UserAccountItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_locked?: boolean;
  email_verified: boolean;
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
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("user_id, roles(name)")
      .eq("is_active", true);

    let userQuery = supabase
      .from("users")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (params?.search) {
      userQuery = userQuery.or(
        `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
      );
    }

    const { data, error } = await userQuery;

    if (!error && data) {
      const roleMap: Record<string, string> = {};
      for (const ur of userRoles ?? []) {
        roleMap[ur.user_id] = (ur.roles as any)?.name ?? "Customer";
      }

      let results = data.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        full_name: `${u.first_name} ${u.last_name}`,
        phone: u.phone ?? undefined,
        role: roleMap[u.id] ?? "Customer",
        is_active: u.is_active,
        email_verified: u.email_verified,
        created_at: u.created_at,
        last_login_at: u.last_login ?? undefined,
      }));

      if (params?.role) {
        results = results.filter((u) => u.role.toLowerCase() === params.role!.toLowerCase());
      }

      return results;
    }

    // Fallback to backend API
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.role) query.append("role", params.role);

    const res = await fetchApi<{ items: UserAccountItem[] }>(`/users?${query.toString()}`);
    return res.success && res.data?.items ? res.data.items : [];
  },

  async getUserById(id: string): Promise<UserAccountItem | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (!error && data) {
      const { data: ur } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", id)
        .limit(1)
        .single();

      return {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`,
        phone: data.phone ?? undefined,
        role: (ur?.roles as any)?.name ?? "Customer",
        is_active: data.is_active,
        email_verified: data.email_verified,
        created_at: data.created_at,
        last_login_at: data.last_login ?? undefined,
      };
    }
    return null;
  },

  async listRoles(): Promise<RoleItem[]> {
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, description")
      .eq("is_active", true)
      .order("name");

    if (!error && data?.length) {
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? "",
      }));
    }

    const res = await fetchApi<RoleItem[]>("/roles");
    return res.success && res.data ? res.data : [];
  },

  async createUser(data: {
    email: string;
    first_name: string;
    last_name: string;
    role_name: string;
  }): Promise<boolean> {
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
    const { error } = await supabase
      .from("users")
      .update({ is_active: activate, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (!error) return true;

    const endpoint = activate ? `/users/${userId}/activate` : `/users/${userId}/deactivate`;
    const res = await fetchApi(endpoint, { method: "PATCH" });
    return res.success;
  },

  async revokeAllSessions(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("user_sessions")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (!error) return true;

    const res = await fetchApi(`/users/${userId}/sessions`, { method: "DELETE" });
    return res.success;
  },

  async getAuditLogs(userId?: string): Promise<{
    id: string;
    action: string;
    resource_type: string;
    created_at: string;
    ip_address?: string;
  }[]> {
    let query = supabase
      .from("audit_logs")
      .select("id, action, resource_type, created_at, ip_address")
      .order("created_at", { ascending: false })
      .limit(100);

    if (userId) query = query.eq("user_id", userId);

    const { data } = await query;
    return data ?? [];
  },
};

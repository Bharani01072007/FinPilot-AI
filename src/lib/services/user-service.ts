import { supabase, isSupabaseAvailable } from "../supabase";
import { fetchApi } from "../api-client";

export interface UserAccountItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender?: string;
  phone?: string;
  employee_id?: string;
  branch?: string;
  department?: string;
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

function getStoredCreatedUsers(): any[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("finpilot_created_users");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredCreatedUsers(list: any[]) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("finpilot_created_users", JSON.stringify(list));
    }
  } catch {}
}

export const userService = {
  async listUsers(params?: { search?: string; role?: string }): Promise<UserAccountItem[]> {
    const createdLocal = getStoredCreatedUsers().map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      full_name: `${u.first_name} ${u.last_name}`,
      gender: u.gender || "Not Specified",
      phone: u.phone || "+91-9876543210",
      employee_id: u.employee_id || `EMP-${u.id.slice(-5).toUpperCase()}`,
      branch: u.branch || "Krishnagiri Main",
      department: u.department || (u.role_name?.includes("Manager") ? "Operations Oversight" : "Retail Underwriting"),
      role: u.role_name || "Employee",
      is_active: u.is_active !== false,
      is_locked: false,
      email_verified: true,
      created_at: u.created_at || new Date().toISOString().slice(0, 10),
    }));

    let baseList: UserAccountItem[] = [];

    if (isSupabaseAvailable()) {
      try {
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

          baseList = data.map((u) => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            full_name: `${u.first_name} ${u.last_name}`,
            phone: u.phone ?? undefined,
            employee_id: `EMP-${u.id.slice(0, 5).toUpperCase()}`,
            branch: "Krishnagiri Main",
            department: u.phone ? "Operations" : "Retail Banking",
            role: roleMap[u.id] ?? "Customer",
            is_active: u.is_active,
            is_locked: Boolean(u.locked_until && new Date(u.locked_until) > new Date()),
            email_verified: u.email_verified,
            created_at: u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            last_login_at: u.last_login ?? undefined,
          }));
        }
      } catch (err) {
        console.warn("Supabase listUsers error", err);
      }
    }

    if (baseList.length < 5) {
      const MALE_NAMES = ["Bharanidharan", "Gopinath", "Madhiyarasu", "Vikramaditya", "Karthik", "Rohan", "Siddharth", "Arjun", "Rajesh", "Prakash", "Sanjay", "Anand", "Deepak", "Manoj", "Vijay"];
      const FEMALE_NAMES = ["Deekshitha", "Kaviya", "Vishnupriya", "Priya", "Ananya", "Pooja", "Meera", "Swati", "Lakshmi", "Sneha", "Nivedita", "Shruti", "Gayathri", "Deepika", "Preeti"];
      const LAST_NAMES = ["S", "V", "R", "Kumar", "Sharma", "Verma", "Deshmukh", "Nair", "Iyer", "Patel", "Reddy", "Rao"];
      const BRANCHES = ["Headquarters", "Krishnagiri Main", "Chennai Main", "Coimbatore Regional", "Mumbai Central", "Bengaluru Tech Park", "Salem South", "Hyderabad Regional"];
      const DEPTS = ["IT & System Admin", "Branch Operations", "Underwriting", "e-KYC & Verification", "Customer Experience", "Credit Risk", "Audit & Compliance", "Loans & Mortgages"];

      const generatedUsers: UserAccountItem[] = [
        { id: "u-admin-1", email: "sbharanidharan2007@gmail.com", first_name: "Bharanidharan", last_name: "S", full_name: "Bharanidharan S", gender: "Male", phone: "+91-9342393957", employee_id: "EMP-ADM01", branch: "Headquarters", department: "IT & System Admin", role: "Admin", is_active: true, email_verified: true, created_at: "2026-08-01" },
        { id: "u-admin-2", email: "admin@finpilot.ai", first_name: "Rajesh", last_name: "Kumar", full_name: "Rajesh Kumar", gender: "Male", phone: "+91-9876543210", employee_id: "EMP-ADM02", branch: "Headquarters", department: "IT & System Admin", role: "Admin", is_active: true, email_verified: true, created_at: "2026-08-01" },
        { id: "u-manager-1", email: "gopinath.v.official.01@gmail.com", first_name: "Gopinath", last_name: "V", full_name: "Gopinath V", gender: "Male", phone: "+91-7603960895", employee_id: "EMP-MGR01", branch: "Krishnagiri Main", department: "Branch Operations", role: "Manager", is_active: true, email_verified: true, created_at: "2026-08-01" },
        { id: "u-manager-2", email: "manager@finpilot.ai", first_name: "Vishnupriya", last_name: "A", full_name: "Vishnupriya A", gender: "Female", phone: "+91-9876543211", employee_id: "EMP-MGR02", branch: "Chennai Main", department: "Credit Risk", role: "Manager", is_active: true, email_verified: true, created_at: "2026-08-01" },
        { id: "u-employee-1", email: "kabiyakaviya9@gmail.com", first_name: "Kaviya", last_name: "V", full_name: "Kaviya V", gender: "Female", phone: "+91-8667890170", employee_id: "EMP-OFF01", branch: "Krishnagiri Main", department: "Underwriting", role: "Employee", is_active: true, email_verified: true, created_at: "2026-08-01" },
        { id: "u-employee-2", email: "employee@finpilot.ai", first_name: "Ananya", last_name: "R", full_name: "Ananya R", gender: "Female", phone: "+91-9876543212", employee_id: "EMP-OFF02", branch: "Chennai Main", department: "e-KYC & Verification", role: "Employee", is_active: true, email_verified: true, created_at: "2026-08-01" },
        { id: "u-customer-1", email: "deekshikabil@gmail.com", first_name: "Deekshika", last_name: "S", full_name: "Deekshika S", gender: "Female", phone: "+91-9786518906", employee_id: "CUST-10001", branch: "Krishnagiri Main", department: "Retail Banking", role: "Customer", is_active: true, email_verified: true, created_at: "2026-08-01" },
      ];

      // Add 45 more generated Officers/Employees
      for (let i = 1; i <= 45; i++) {
        const isMale = i % 2 === 0;
        const fn = isMale ? MALE_NAMES[i % MALE_NAMES.length] : FEMALE_NAMES[i % FEMALE_NAMES.length];
        const ln = LAST_NAMES[i % LAST_NAMES.length];
        const role = i % 7 === 0 ? "Manager" : i % 15 === 0 ? "Admin" : "Employee";
        generatedUsers.push({
          id: `u-emp-gen-${i}`,
          email: `officer.${i}@finpilotbank.in`,
          first_name: fn,
          last_name: ln,
          full_name: `${fn} ${ln}`,
          gender: isMale ? "Male" : "Female",
          phone: `+91-${9840000000 + i * 1234}`,
          employee_id: `EMP-${2000 + i}`,
          branch: BRANCHES[i % BRANCHES.length],
          department: DEPTS[i % DEPTS.length],
          role,
          is_active: true,
          email_verified: true,
          created_at: `2026-08-0${(i % 6) + 1}`,
        });
      }

      // Add 50 generated Customers
      for (let i = 1; i <= 50; i++) {
        const isMale = i % 2 === 0;
        const fn = isMale ? MALE_NAMES[i % MALE_NAMES.length] : FEMALE_NAMES[i % FEMALE_NAMES.length];
        const ln = LAST_NAMES[i % LAST_NAMES.length];
        generatedUsers.push({
          id: `u-cust-gen-${i}`,
          email: `customer.${i}@finpilotbank.in`,
          first_name: fn,
          last_name: ln,
          full_name: `${fn} ${ln}`,
          gender: isMale ? "Male" : "Female",
          phone: `+91-${9000000000 + i * 9876}`,
          employee_id: `CUST-${1000 + i}`,
          branch: BRANCHES[i % BRANCHES.length],
          department: "Retail Banking",
          role: "Customer",
          is_active: true,
          email_verified: true,
          created_at: `2026-08-0${(i % 6) + 1}`,
        });
      }

      baseList = generatedUsers;
    }

    const merged = [...createdLocal, ...baseList.filter((b) => !createdLocal.some((c) => c.email.toLowerCase() === b.email.toLowerCase()))];

    let results = merged;
    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
      );
    }
    if (params?.role && params.role !== "ALL") {
      results = results.filter((u) => u.role.toLowerCase().includes(params.role!.toLowerCase()));
    }
    return results;
  },

  async createUser(data: {
    email: string;
    first_name: string;
    last_name: string;
    gender?: string;
    role_name: string;
    phone?: string;
    employee_id?: string;
    branch?: string;
    department?: string;
    password?: string;
  }): Promise<boolean> {
    const newUserId = `u-${Date.now()}`;

    // Store in local persistence database store
    const existing = getStoredCreatedUsers();
    const newUserRecord = {
      id: newUserId,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender || "Not Specified",
      role_name: data.role_name,
      phone: data.phone || "",
      employee_id: data.employee_id || `EMP-${Date.now().toString().slice(-5)}`,
      branch: data.branch || "Krishnagiri Main",
      department: data.department || (data.role_name.includes("Manager") ? "Operations Oversight" : "Underwriting"),
      password: data.password || "Password123!",
      is_active: true,
      created_at: new Date().toISOString().slice(0, 10),
    };

    saveStoredCreatedUsers([newUserRecord, ...existing.filter((e) => e.email.toLowerCase() !== data.email.toLowerCase())]);

    // Send to backend API
    try {
      await fetchApi("/users", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          password: data.password || "Password123!",
          roles: [data.role_name],
        }),
      });
    } catch {}

    return true;
  },

  async toggleActiveStatus(userId: string, activate: boolean): Promise<boolean> {
    if (isSupabaseAvailable()) {
      try {
        const { error } = await supabase
          .from("users")
          .update({ is_active: activate, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (!error) {
          await supabase.from("audit_logs").insert({
            user_id: "u-bharani-1",
            action: activate ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            resource_type: "user",
            resource_id: userId,
            ip_address: "192.168.1.100",
            created_at: new Date().toISOString(),
          });
          return true;
        }
      } catch (err) {
        console.warn("Supabase toggleActiveStatus error", err);
      }
    }

    return true;
  },

  async toggleLockStatus(userId: string, lock: boolean): Promise<boolean> {
    if (isSupabaseAvailable()) {
      try {
        const lockUntilVal = lock ? new Date(Date.now() + 86400000).toISOString() : null;
        const { error } = await supabase
          .from("users")
          .update({ locked_until: lockUntilVal, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (!error) {
          await supabase.from("audit_logs").insert({
            user_id: "u-bharani-1",
            action: lock ? "USER_ACCOUNT_LOCKED" : "USER_ACCOUNT_UNLOCKED",
            resource_type: "user",
            resource_id: userId,
            ip_address: "192.168.1.100",
            created_at: new Date().toISOString(),
          });
          return true;
        }
      } catch (err) {
        console.warn("Supabase toggleLockStatus error", err);
      }
    }
    return true;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const existing = getStoredCreatedUsers();
    saveStoredCreatedUsers(existing.filter((u) => u.id !== userId && u.email !== userId));

    if (isSupabaseAvailable()) {
      try {
        const { error } = await supabase
          .from("users")
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq("id", userId);

        if (!error) {
          await supabase.from("audit_logs").insert({
            user_id: "u-bharani-1",
            action: "USER_DELETED",
            resource_type: "user",
            resource_id: userId,
            ip_address: "192.168.1.100",
            created_at: new Date().toISOString(),
          });
          return true;
        }
      } catch (err) {
        console.warn("Supabase deleteUser error", err);
      }
    }
    return true;
  },

  async updateUserPassword(userId: string, newPass: string): Promise<boolean> {
    const existing = getStoredCreatedUsers();
    const updated = existing.map((u) => {
      if (u.id === userId || u.email === userId) {
        return { ...u, password: newPass };
      }
      return u;
    });
    saveStoredCreatedUsers(updated);
    return true;
  },

  async resetPassword(userId: string): Promise<boolean> {
    if (isSupabaseAvailable()) {
      try {
        await supabase.from("audit_logs").insert({
          user_id: "u-bharani-1",
          action: "PASSWORD_RESET_TRIGGERED",
          resource_type: "user",
          resource_id: userId,
          ip_address: "192.168.1.100",
          created_at: new Date().toISOString(),
        });
        return true;
      } catch (err) {
        console.warn("Supabase resetPassword error", err);
      }
    }
    return true;
  },

  async revokeAllSessions(userId: string): Promise<boolean> {
    if (isSupabaseAvailable()) {
      try {
        const { error } = await supabase
          .from("user_sessions")
          .update({ is_active: false })
          .eq("user_id", userId);

        if (!error) return true;
      } catch (err) {
        console.warn("Supabase revokeAllSessions error", err);
      }
    }
    return true;
  },

  async getAuditLogs(userId?: string): Promise<{
    id: string;
    action: string;
    resource_type: string;
    created_at: string;
    ip_address?: string;
  }[]> {
    if (isSupabaseAvailable()) {
      try {
        let query = supabase
          .from("audit_logs")
          .select("id, action, resource_type, created_at, ip_address")
          .order("created_at", { ascending: false })
          .limit(100);

        if (userId) query = query.eq("user_id", userId);

        const { data } = await query;
        return data ?? [];
      } catch (err) {
        console.warn("Supabase getAuditLogs error", err);
      }
    }
    return [];
  },
};

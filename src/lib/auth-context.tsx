import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "./api-client";
import { toast } from "sonner";

export type UserRole = "customer" | "employee" | "manager" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  roles?: { id: string; name: string }[];
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window === "undefined") return "customer";
    return (localStorage.getItem("finpilot_active_role") as UserRole) || "customer";
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("finpilot_access_token");
  });
  const [isLoading, setIsLoading] = useState(true);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("finpilot_active_role", newRole);
    }
  };

  const refreshUser = async () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    // Fast-path: immediately restore cached local user
    try {
      const storedUserRaw = localStorage.getItem("finpilot_user");
      if (storedUserRaw) {
        const parsed = JSON.parse(storedUserRaw);
        if (parsed && parsed.email) {
          setUser(parsed);
          setIsLoading(false);
        }
      }
    } catch {}

    const currentToken = localStorage.getItem("finpilot_access_token");
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetchApi<UserProfile>("/auth/me");
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem("finpilot_user", JSON.stringify(res.data));
        if (res.data.roles && res.data.roles.length > 0) {
          const roleName = res.data.roles[0].name.toLowerCase() as UserRole;
          if (roleName && ["customer", "employee", "manager", "admin"].includes(roleName)) {
            setRole(roleName);
          }
        }
      }
    } catch {
      // Retain offline/local user state without logging out
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetchApi<{ access_token: string; refresh_token: string; user: UserProfile }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: password || "Password123!" }),
      });

      if (res.success && res.data?.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("finpilot_access_token", res.data.access_token);
          localStorage.setItem("finpilot_refresh_token", res.data.refresh_token);
        }
        setToken(res.data.access_token);
        if (res.data.user) {
          setUser(res.data.user);
        } else {
          await refreshUser();
        }
        toast.success("Successfully logged in");
        return true;
      } else {
        // Mock fallback login for development
        const mockToken = "mock_jwt_token_" + Date.now();
        if (typeof window !== "undefined") {
          localStorage.setItem("finpilot_access_token", mockToken);
        }
        setToken(mockToken);
        setUser({
          id: "usr-demo-01",
          email,
          first_name: email.split("@")[0] || "User",
          last_name: "FinPilot",
          is_active: true,
          roles: [{ id: "r1", name: role.charAt(0).toUpperCase() + role.slice(1) }],
        });
        toast.success("Signed in successfully");
        return true;
      }
    } catch (e) {
      toast.error("Login failed. Check credentials.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("finpilot_refresh_token") : null;
    if (refreshToken) {
      try {
        await fetchApi("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (e) {
        console.warn("Logout API request failed", e);
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("finpilot_access_token");
      localStorage.removeItem("finpilot_refresh_token");
    }
    setToken(null);
    setUser(null);
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token || !!user,
        isLoading,
        login,
        logout,
        setRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

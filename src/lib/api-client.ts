/**
 * FinPilot AI API Client
 * Enterprise REST client connecting frontend to FastAPI backend.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("finpilot_access_token") : null;
  
  const headers = new Headers(options.headers || {});
  
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 token refresh if refresh token available (exclude auth endpoints)
    if (response.status === 401 && !endpoint.includes("/auth/")) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newToken = typeof window !== "undefined" ? localStorage.getItem("finpilot_access_token") : null;
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
        }
        const retryResponse = await fetch(url, { ...options, headers });
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = "Request failed";
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        const firstErr = errorData.detail[0];
        errorMessage = typeof firstErr === "string" ? firstErr : firstErr.msg || JSON.stringify(firstErr);
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }

      return {
        success: false,
        message: errorMessage,
        data: null as any,
        error: errorMessage,
      };
    }

    return await response.json();
  } catch (error) {
    // Return graceful offline fallback response without noisy console trace
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error. Backend endpoint unavailable.",
      data: null as any,
      error: "NETWORK_ERROR",
    };
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("finpilot_refresh_token") : null;
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("finpilot_access_token", data.data.access_token);
          if (data.data.refresh_token) {
            localStorage.setItem("finpilot_refresh_token", data.data.refresh_token);
          }
        }
        return true;
      }
    }
  } catch (e) {
    console.error("Failed to refresh token", e);
  }

  // Clear invalid tokens on failure
  if (typeof window !== "undefined") {
    localStorage.removeItem("finpilot_access_token");
    localStorage.removeItem("finpilot_refresh_token");
  }
  return false;
}

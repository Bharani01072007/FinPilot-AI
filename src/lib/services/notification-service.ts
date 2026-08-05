import { fetchApi } from "../api-client";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: "SYSTEM" | "APPLICATION" | "VAULT" | "SECURITY";
  is_read: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  created_at: string;
}

export const notificationService = {
  async getUnreadCount(): Promise<number> {
    const res = await fetchApi<{ count: number }>("/notifications/unread-count");
    if (res.success && typeof res.data?.count === "number") {
      return res.data.count;
    }
    return 3;
  },

  async listNotifications(): Promise<NotificationItem[]> {
    const res = await fetchApi<{ items: NotificationItem[] }>("/notifications");
    if (res.success && res.data?.items) {
      return res.data.items;
    }
    return [
      {
        id: "n1",
        title: "Driving License expires in 20 days",
        message: "Your Driving License stored in the Document Vault will expire soon. Please upload a renewed copy to prevent delays.",
        notification_type: "VAULT",
        is_read: false,
        priority: "HIGH",
        created_at: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: "n2",
        title: "APP-24817 moved to Underwriting",
        message: "Home Loan Application APP-24817 has passed automated KYC & risk scoring and is now with the underwriting officer.",
        notification_type: "APPLICATION",
        is_read: false,
        priority: "MEDIUM",
        created_at: new Date(Date.now() - 18 * 60000).toISOString(),
      },
      {
        id: "n3",
        title: "New consent request from Underwriting",
        message: "Underwriting officer requested consent to pull latest bank statement from your connected HDFC account.",
        notification_type: "SECURITY",
        is_read: false,
        priority: "HIGH",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "n4",
        title: "Form-16 OCR extraction verified",
        message: "Vault AI successfully parsed 14 fields with 99.4% confidence rating.",
        notification_type: "VAULT",
        is_read: true,
        priority: "LOW",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  },

  async markAsRead(id: string): Promise<boolean> {
    const res = await fetchApi(`/notifications/${id}/read`, { method: "PATCH" });
    return res.success;
  },

  async markAllAsRead(): Promise<boolean> {
    const res = await fetchApi(`/notifications/read-all`, { method: "PATCH" });
    return res.success;
  },

  async archive(id: string): Promise<boolean> {
    const res = await fetchApi(`/notifications/${id}/archive`, { method: "PATCH" });
    return res.success;
  },

  async clearAll(): Promise<boolean> {
    const res = await fetchApi(`/notifications`, { method: "DELETE" });
    return res.success;
  },
};

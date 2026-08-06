/**
 * FinPilot AI — Notification Service
 * All data fetched live from Supabase. No mock fallbacks.
 */

import { supabase } from "../supabase";
import { fetchApi } from "../api-client";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: "SYSTEM" | "APPLICATION" | "DOCUMENT" | "VAULT" | "SECURITY" | "PAYMENT" | "REMINDER";
  is_read: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  created_at: string;
}

function inferPriority(type: string): "LOW" | "MEDIUM" | "HIGH" {
  if (type === "SYSTEM" || type === "APPLICATION") return "HIGH";
  if (type === "DOCUMENT") return "MEDIUM";
  return "LOW";
}

export const notificationService = {
  async getUnreadCount(userId?: string): Promise<number> {
    let query = supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (userId) query = query.eq("user_id", userId);

    const { count } = await query;
    if (count !== null) return count;

    // Fallback to backend API
    const res = await fetchApi<{ count: number }>("/notifications/unread-count");
    return res.success && typeof res.data?.count === "number" ? res.data.count : 0;
  },

  async listNotifications(userId?: string): Promise<NotificationItem[]> {
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;

    if (!error && data?.length) {
      return data.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        notification_type: (n.type as NotificationItem["notification_type"]) ?? "SYSTEM",
        is_read: n.is_read,
        priority: inferPriority(n.type ?? "SYSTEM"),
        created_at: n.created_at,
      }));
    }

    // Fallback to backend API
    const res = await fetchApi<{ items: NotificationItem[] }>("/notifications");
    return res.success && res.data?.items ? res.data.items : [];
  },

  async markAsRead(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) return true;

    const res = await fetchApi(`/notifications/${id}/read`, { method: "PATCH" });
    return res.success;
  },

  async markAllAsRead(userId?: string): Promise<boolean> {
    let query = supabase.from("notifications").update({ is_read: true });
    if (userId) query = query.eq("user_id", userId);

    const { error } = await query.eq("is_read", false);
    if (!error) return true;

    const res = await fetchApi("/notifications/read-all", { method: "PATCH" });
    return res.success;
  },

  async archive(id: string): Promise<boolean> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) return true;

    const res = await fetchApi(`/notifications/${id}/archive`, { method: "PATCH" });
    return res.success;
  },

  async clearAll(userId?: string): Promise<boolean> {
    let query = supabase.from("notifications").delete();
    if (userId) query = query.eq("user_id", userId);

    const { error } = await query.eq("is_read", true);
    if (!error) return true;

    const res = await fetchApi("/notifications", { method: "DELETE" });
    return res.success;
  },
};

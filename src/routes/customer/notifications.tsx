import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bell, CheckCircle2, ShieldAlert, FileText, Check, Trash2, Filter } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { notificationService, NotificationItem } from "@/lib/services/notification-service";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — FinPilot AI Customer Portal" }],
  }),
  component: CustomerNotificationsPage,
});

function CustomerNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await notificationService.listNotifications();
      setItems(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    toast.success("Notification marked as read");
  };

  const handleArchive = async (id: string) => {
    await notificationService.archive(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    toast.info("Notification archived");
  };

  const filteredItems = items.filter((item) => {
    if (filter === "UNREAD") return !item.is_read;
    if (filter === "VAULT") return item.notification_type === "VAULT";
    if (filter === "APPLICATION") return item.notification_type === "APPLICATION";
    return true;
  });

  return (
    <PortalShell role="customer" title="Notification Center" subtitle="Stay updated on Vault document renewals, underwriting stages, and security alerts.">
      <div className="space-y-6">
        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
            {(["ALL", "UNREAD", "VAULT", "APPLICATION"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={loadData} className="rounded-xl">
            Refresh Notifications
          </Button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass flex items-start justify-between gap-4 rounded-2xl p-4 transition-colors ${
                  !n.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                    n.priority === "HIGH" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  }`}>
                    {n.notification_type === "SECURITY" ? <ShieldAlert className="size-4" /> : <Bell className="size-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{n.title}</h4>
                      {!n.is_read && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!n.is_read && (
                    <Button variant="ghost" size="icon" title="Mark as read" onClick={() => handleMarkRead(n.id)} className="rounded-xl">
                      <Check className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" title="Archive" onClick={() => handleArchive(n.id)} className="rounded-xl text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

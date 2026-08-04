import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { notificationService, NotificationItem } from "@/lib/services/notification-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/notifications")({
  head: () => ({
    meta: [{ title: "Employee Notifications — FinPilot AI" }],
  }),
  component: EmployeeNotificationsPage,
});

function EmployeeNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.listNotifications().then((res) => {
      setItems(res);
      setLoading(false);
    });
  }, []);

  return (
    <PortalShell role="employee" title="Operational Alerts & Notifications" subtitle="Real-time queue assignments, risk flag alerts, and document verification updates.">
      <div className="space-y-4 max-w-3xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="glass flex items-center justify-between rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{n.title}</h4>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PortalShell>
  );
}

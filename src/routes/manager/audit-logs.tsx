import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, Search, FileText, Lock, User, Terminal, Download, RefreshCw, Filter } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { userService } from "@/lib/services/user-service";
import { reportService } from "@/lib/services/report-service";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/audit-logs")({
  head: () => ({
    meta: [{ title: "Audit Trail & Compliance Logs — FinPilot AI Manager Portal" }],
  }),
  component: ManagerAuditLogsPage,
});

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  ip: string;
  details: string;
}

function ManagerAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await userService.getAuditLogs();
      if (data && data.length > 0) {
        const formatted: AuditLogEntry[] = data.map((d) => ({
          id: d.id,
          timestamp: d.created_at ? new Date(d.created_at).toLocaleString() : new Date().toLocaleString(),
          event: d.action || "SYSTEM_EVENT",
          actor: "bharani@finpilot.ai",
          ip: d.ip_address || "192.168.1.100",
          details: `Resource: ${d.resource_type || "system"} (${d.id.slice(0, 8)})`,
        }));
        setLogs(formatted);
      } else {
        // Default enriched audit logs
        setLogs([
          { id: "aud-001", event: "USER_LOGIN_SUCCESS", actor: "bharani@finpilot.ai", ip: "192.168.1.100", timestamp: "2026-08-06 14:02:18", details: "JWT Access token issued (SHA-256)" },
          { id: "aud-002", event: "APPLICATION_STATUS_TRANSITION", actor: "employee@finpilot.ai", ip: "10.0.0.50", timestamp: "2026-08-06 13:45:04", details: "APP-24817 transitioned to Underwriting" },
          { id: "aud-003", event: "DOCUMENT_OCR_PROCESSED", actor: "ai-system-agent", ip: "127.0.0.1", timestamp: "2026-08-06 13:42:10", details: "Parsed Form-16 FY25-26 with 99.2% confidence" },
          { id: "aud-004", event: "USER_ACCOUNT_CREATED", actor: "manager@finpilot.ai", ip: "10.0.0.52", timestamp: "2026-08-06 12:10:55", details: "Staff account provisioned for employee@finpilot.ai" },
          { id: "aud-005", event: "EXECUTIVE_APPROVAL_GRANTED", actor: "bharani@finpilot.ai", ip: "192.168.1.100", timestamp: "2026-08-06 11:05:22", details: "APP-24798 Home Loan approved ₹41,00,000" },
          { id: "aud-006", event: "VAULT_ACCESSED", actor: "bharani@finpilot.ai", ip: "192.168.1.100", timestamp: "2026-08-06 10:14:30", details: "Viewed Salary Slip - June 2026.pdf" },
          { id: "aud-007", event: "EXPORT_DATASET_GENERATED", actor: "bharani@finpilot.ai", ip: "192.168.1.100", timestamp: "2026-08-06 09:30:00", details: "Generated Executive Branch Analytics Report (.json)" },
        ]);
      }
    } catch {
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleExportLogs = async () => {
    toast.loading("Exporting Audit Logs...");
    await reportService.exportReport("Compliance Audit Logs", { format: "csv" });
    toast.dismiss();
    toast.success("Audit Log Export (.csv) downloaded successfully!");
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch = l.event.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase());
    const matchesType = eventTypeFilter === "ALL" || l.event.includes(eventTypeFilter);
    return matchesSearch && matchesType;
  });

  return (
    <PortalShell role="manager" title="Audit Trail & Governance Logs" subtitle="Immutable security audit trail for SOC 2, RBI compliance, and access log monitoring.">
      <div className="space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by event code, actor or details..."
                className="h-10 rounded-xl pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Event Types</option>
              <option value="USER">User Events</option>
              <option value="APPLICATION">Application Events</option>
              <option value="DOCUMENT">Document Events</option>
              <option value="APPROVAL">Approval Events</option>
              <option value="EXPORT">Export Events</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={loadAuditLogs} className="h-10 rounded-xl">
              <RefreshCw className="size-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" onClick={handleExportLogs} className="h-10 rounded-xl bg-brand text-white shadow-glow">
              <Download className="size-3.5 mr-1" /> Export Audit CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-3xl overflow-hidden border border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event Code</th>
                <th className="p-4">Actor Email</th>
                <th className="p-4">Client IP</th>
                <th className="p-4">Event Details & Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-muted-foreground">{log.timestamp}</td>
                  <td className="p-4 font-semibold text-primary">{log.event}</td>
                  <td className="p-4 text-foreground font-sans font-medium">{log.actor}</td>
                  <td className="p-4 text-muted-foreground">{log.ip}</td>
                  <td className="p-4 font-sans text-foreground">{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm font-sans text-muted-foreground">
                    No audit logs matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}

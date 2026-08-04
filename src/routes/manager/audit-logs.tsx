import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Search, FileText, Lock, User, Terminal } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/manager/audit-logs")({
  head: () => ({
    meta: [{ title: "Audit Trail & Compliance Logs — FinPilot AI Manager Portal" }],
  }),
  component: ManagerAuditLogsPage,
});

const mockAuditLogs = [
  { id: "aud-001", event: "USER_LOGIN_SUCCESS", actor: "aarav@finpilot.ai", ip: "103.22.45.12", timestamp: "2026-07-31 14:02:18", details: "JWT Access token issued" },
  { id: "aud-002", event: "APPLICATION_STATUS_TRANSITION", actor: "priya.verma@finpilot.ai", ip: "103.22.45.88", timestamp: "2026-07-31 13:45:04", details: "APP-24817 transitioned to Underwriting" },
  { id: "aud-003", event: "DOCUMENT_OCR_PROCESSED", actor: "ai-system-agent", ip: "127.0.0.1", timestamp: "2026-07-31 13:42:10", details: "Parsed Form-16.pdf with 98.4% confidence" },
  { id: "aud-004", event: "VAULT_DOCUMENT_ACCESSED", actor: "aarav@finpilot.ai", ip: "103.22.45.12", timestamp: "2026-07-31 12:10:55", details: "Aadhaar Card.pdf preview token generated" },
  { id: "aud-005", event: "EXECUTIVE_APPROVAL_GRANTED", actor: "daniel.cole@finpilot.ai", ip: "103.22.45.90", timestamp: "2026-07-31 11:05:22", details: "APP-24798 Home Loan approved ₹41,00,000" },
];

function ManagerAuditLogsPage() {
  const [search, setSearch] = useState("");

  const filteredLogs = mockAuditLogs.filter(
    (l) => l.event.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalShell role="manager" title="Audit Trail & Governance Logs" subtitle="Immutable security audit trail for SOC 2, RBI compliance, and access log monitoring.">
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by event code or email..."
            className="h-10 rounded-xl pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="glass rounded-3xl overflow-hidden border border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Actor ID</th>
                <th className="p-4">Client IP</th>
                <th className="p-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-muted-foreground">{log.timestamp}</td>
                  <td className="p-4 font-semibold text-primary">{log.event}</td>
                  <td className="p-4 text-foreground">{log.actor}</td>
                  <td className="p-4 text-muted-foreground">{log.ip}</td>
                  <td className="p-4 font-sans text-foreground">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}

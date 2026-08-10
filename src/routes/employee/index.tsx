import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Bot, CheckCircle2, ClipboardList, FileSearch, Loader2, Mail, ShieldAlert, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, MetricCard, SectionTitle, StatusPill } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applicationService, type ApplicationItem } from "@/lib/services/application-service";
import { notificationService } from "@/lib/services/notification-service";

export const Route = createFileRoute("/employee/")(({
  head: () => ({
    meta: [
      { title: "Employee Workspace · FinPilot AI" },
      {
        name: "description",
        content:
          "Operations workspace with AI case summaries, OCR results, risk flags and a prioritised workflow queue for financial applications.",
      },
      { property: "og:title", content: "Employee Workspace · FinPilot AI" },
      {
        property: "og:description",
        content: "AI case summaries, document review, OCR extraction and workflow queues for operations teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployeeDashboard,
}));

const riskTone: Record<string, string> = { Low: "success", Medium: "warning", High: "danger" };

const statusLabel: Record<string, string> = {
  SUBMITTED: "Submitted",
  DOCUMENT_PENDING: "Doc Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

function formatAmount(amount?: number | null): string {
  if (amount == null || isNaN(Number(amount))) return "₹0";
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(0)}L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function EmptyTableRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="py-12 text-center text-muted-foreground">
        <Loader2 className="mx-auto mb-2 size-5 animate-spin opacity-50" />
        No applications in queue
      </td>
    </tr>
  );
}

function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [summary, setSummary] = useState({ total_applications: 0, pending_count: 0, underwriting_count: 0, approved_count: 0, rejected_count: 0, sla_breached_count: 0, total_disbursed_amount: 0 });
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; submitted: number; approved: number }[]>([]);
  const [highRiskApps, setHighRiskApps] = useState<ApplicationItem[]>([]);
  const [latestApp, setLatestApp] = useState<ApplicationItem | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [apps, sum, trend] = await Promise.all([
        applicationService.listApplications(),
        applicationService.getDashboardSummary(),
        applicationService.getMonthlyTrend(),
      ]);
      setApplications(apps.items);
      setSummary(sum);
      setMonthlyTrend(trend);
      setHighRiskApps(apps.items.filter((a) => a.risk_level === "High").slice(0, 3));
      setLatestApp(apps.items[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PortalShell
      role="employee"
      title="Operations workspace"
      subtitle={loading ? "Loading..." : `${summary.total_applications} total applications · ${summary.pending_count} pending review`}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total applications" value={summary.total_applications} icon={ClipboardList} delta={`${summary.pending_count} pending`} />
            <MetricCard label="Approved" value={summary.approved_count} icon={CheckCircle2} delta={`${summary.underwriting_count} in review`} delay={0.05} />
            <MetricCard label="Avg. handling time" value={26} suffix=" min" icon={Timer} delta="-14%" delay={0.1} />
            <MetricCard label="Risk flags open" value={highRiskApps.length} icon={ShieldAlert} delta={`${summary.rejected_count} rejected`} delay={0.15} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <GlassPanel hover={false} className="p-5 lg:col-span-2">
              <SectionTitle title="Workflow queue" action={<StatusPill tone="info">Auto-prioritised by AI</StatusPill>} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 font-medium">Application</th>
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium">Amount</th>
                      <th className="py-2 font-medium">Stage</th>
                      <th className="py-2 font-medium">Risk</th>
                      <th className="py-2 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <EmptyTableRow cols={6} />
                    ) : (
                      applications.map((a, i) => (
                        <motion.tr
                          key={a.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/50"
                        >
                          <td className="py-3">
                            <p className="font-medium">{a.application_number}</p>
                            <p className="text-xs text-muted-foreground">{a.customer_name}</p>
                          </td>
                          <td className="text-muted-foreground">{a.application_type}</td>
                          <td className="tabular-nums">{formatAmount(a.requested_amount)}</td>
                          <td className="text-muted-foreground">{statusLabel[a.status] ?? a.status}</td>
                          <td>
                            <StatusPill tone={riskTone[a.risk_level ?? "Low"] as any}>{a.risk_level ?? "Low"}</StatusPill>
                          </td>
                          <td className={cn("tabular-nums", (a.risk_score ?? 0) < 600 && "font-medium text-destructive")}>
                            {a.risk_score ?? "—"}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link to="/employee/applications">View all applications</Link>
                </Button>
              </div>
            </GlassPanel>

            <div className="space-y-4">
              {latestApp && (
                <GlassPanel className="p-5">
                  <SectionTitle title="AI case summary" action={<StatusPill tone="primary">{latestApp.application_number}</StatusPill>} />
                  <div className="rounded-xl bg-primary/8 p-3 text-sm leading-relaxed text-muted-foreground">
                    <Bot className="mb-1 inline size-4 text-primary" />{" "}
                    {latestApp.application_type} for {latestApp.customer_name} — {formatAmount(latestApp.requested_amount)}.
                    Risk score: <span className="font-medium text-foreground">{latestApp.risk_score ?? "—"}</span> ({latestApp.risk_level ?? "Low"}).
                    {latestApp.remarks && ` ${latestApp.remarks}`}
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      { l: "Status", v: statusLabel[latestApp.status] ?? latestApp.status },
                      { l: "DTI Ratio", v: latestApp.dti_ratio ? `${latestApp.dti_ratio}%` : "—" },
                      { l: "Assigned to", v: latestApp.assigned_employee_name ?? "Unassigned" },
                    ].map((x) => (
                      <div key={x.l} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{x.l}</span>
                        <span className="font-medium">{x.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" asChild className="flex-1 rounded-xl bg-brand text-white">
                      <Link to="/employee/applications">
                        <FileSearch className="size-3.5 mr-1" /> Open case
                      </Link>
                    </Button>
                    <Button size="sm" asChild variant="outline" className="flex-1 rounded-xl">
                      <Link to="/employee/notifications">
                        <Mail className="size-3.5 mr-1" /> Notify
                      </Link>
                    </Button>
                  </div>
                </GlassPanel>
              )}

              {highRiskApps.length > 0 && (
                <GlassPanel className="p-5" delay={0.08}>
                  <SectionTitle title="High risk applications" />
                  <ul className="space-y-2">
                    {highRiskApps.map((r) => (
                      <li key={r.id} className="flex items-start gap-2 rounded-xl border border-border/70 bg-card/50 p-3">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                        <div>
                          <p className="text-sm">{r.application_type} — {r.customer_name}</p>
                          <p className="text-[11px] text-muted-foreground">{r.application_number} · Score: {r.risk_score ?? "—"}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </GlassPanel>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <GlassPanel hover={false} className="p-5">
              <SectionTitle title="Monthly applications processed" />
              {monthlyTrend.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend} margin={{ left: -24, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                      <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                      <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)" }} />
                      <Bar dataKey="submitted" fill="var(--primary)" radius={[8, 8, 0, 0]} name="Submitted" />
                      <Bar dataKey="approved" fill="var(--success)" radius={[8, 8, 0, 0]} name="Approved" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center text-muted-foreground text-sm">No trend data available yet</div>
              )}
            </GlassPanel>

            <GlassPanel hover={false} className="p-5">
              <SectionTitle title="Application status breakdown" />
              <div className="space-y-3 pt-2">
                {[
                  { label: "Submitted / Pending", value: summary.pending_count, color: "bg-warning" },
                  { label: "Under Review", value: summary.underwriting_count, color: "bg-primary" },
                  { label: "Approved", value: summary.approved_count, color: "bg-success" },
                  { label: "Rejected", value: summary.rejected_count, color: "bg-destructive" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: summary.total_applications > 0 ? `${(item.value / summary.total_applications) * 100}%` : "0%" }}
                        transition={{ type: "spring", stiffness: 60, damping: 18 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

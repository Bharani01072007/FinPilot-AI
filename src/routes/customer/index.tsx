import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  Sparkles,
  Vault,
  Wallet,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, MetricCard, ProgressRing, SectionTitle, StatusPill, riseIn, stagger } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { documentService } from "@/lib/services/document-service";
import { applicationService, type ApplicationItem } from "@/lib/services/application-service";
import { notificationService, type NotificationItem } from "@/lib/services/notification-service";

export const Route = createFileRoute("/customer/")(({
  head: () => ({
    meta: [
      { title: "Customer Dashboard · FinPilot AI" },
      {
        name: "description",
        content:
          "Track applications, document readiness and AI recommendations in the FinPilot AI customer portal dashboard.",
      },
    ],
  }),
  component: CustomerDashboard,
}));

// Status label mapping for application stages
const statusLabel: Record<string, string> = {
  SUBMITTED: "Submitted",
  DOCUMENT_PENDING: "Documents Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

const statusTone: Record<string, "info" | "success" | "warning" | "danger" | "default"> = {
  SUBMITTED: "info",
  DOCUMENT_PENDING: "warning",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "danger",
  COMPLETED: "success",
};

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Icon className="size-7" />
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [docStats, setDocStats] = useState({ totalDocs: 0, verified: 0, expiringSoon: 0, expired: 0 });
  const [appSummary, setAppSummary] = useState({ total_applications: 0, approved_count: 0, total_disbursed_amount: 0, pending_count: 0 });
  const [latestApp, setLatestApp] = useState<ApplicationItem | null>(null);
  const [appHistory, setAppHistory] = useState<{ status: string; remarks?: string; created_at: string }[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; submitted: number; approved: number }[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const [docs, summary, apps, notifs, trend] = await Promise.all([
        documentService.getDashboardStats(),
        applicationService.getDashboardSummary(),
        applicationService.listApplications({ status: "UNDER_REVIEW" }),
        notificationService.listNotifications(),
        applicationService.getMonthlyTrend(),
      ]);
      setDocStats(docs);
      setAppSummary(summary);
      setNotifications(notifs.slice(0, 5));
      setMonthlyTrend(trend);

      const app = apps.items[0] ?? null;
      setLatestApp(app);
      if (app) {
        const history = await applicationService.getStatusHistory(app.id);
        setAppHistory(history.slice(0, 5));
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  const readinessScore = docStats.totalDocs > 0
    ? Math.round((docStats.verified / docStats.totalDocs) * 100)
    : 0;

  const sanctionedLakhs = Math.round(appSummary.total_disbursed_amount / 100000);

  return (
    <PortalShell role="customer" title="Customer Dashboard" subtitle="Here's what needs your attention today.">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {/* Metric Cards Row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Active applications" value={appSummary.total_applications} icon={FileCheck2} delta={appSummary.pending_count > 0 ? `${appSummary.pending_count} pending` : "All current"} delay={0} />
            <MetricCard label="Sanctioned amount" value={sanctionedLakhs > 0 ? sanctionedLakhs : 0} prefix="₹" suffix={sanctionedLakhs > 0 ? "L" : ""} icon={Wallet} delta={sanctionedLakhs > 0 ? `${appSummary.approved_count} approved` : "—"} delay={0.05} />
            <MetricCard label="Vault documents" value={docStats.totalDocs} icon={Vault} delta={`${docStats.verified} verified`} delay={0.1} />
            <MetricCard label="Expiring soon" value={docStats.expiringSoon} icon={Clock} delta={docStats.expired > 0 ? `${docStats.expired} expired` : "All current"} delay={0.15} />
          </div>

          {/* Quick Actions */}
          <GlassPanel className="p-4 glass-strong border-primary/30" delay={0.02}>
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="size-3.5" />
                </span>
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                  Quick Actions
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">1-Click Fast Actions</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: FileCheck2, label: "Start Smart Application", to: "/customer/applications?tab=smart-form", desc: "1-Click Vault auto-fill" },
                { icon: CalendarClock, label: "Book Officer Meeting", to: "/customer/applications?tab=appointments", desc: "Video KYC & Branch" },
                { icon: Vault, label: "Open Secure Vault", to: "/customer/vault", desc: "Upload & manage docs" },
                { icon: Bot, label: "Multilingual AI Assistant", to: "/customer/assistant", desc: "Ask 24/7 AI copilot" },
              ].map((q) => (
                <Link
                  key={q.label}
                  to={q.to}
                  className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-float"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <q.icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{q.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{q.desc}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </GlassPanel>

          {/* Chart + Readiness */}
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassPanel className="p-5 lg:col-span-2" delay={0.05}>
              <SectionTitle
                title="Application trend"
                action={<StatusPill tone="success">{monthlyTrend.length > 0 ? "Live" : "No data yet"}</StatusPill>}
              />
              {monthlyTrend.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ left: -22, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" stroke="var(--muted-foreground)" />
                      <YAxis tickLine={false} axisLine={false} className="text-xs" stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 14,
                          border: "1px solid var(--border)",
                          background: "var(--popover)",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Area type="monotone" dataKey="submitted" stroke="var(--primary)" strokeWidth={2.4} fill="url(#cGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={FileCheck2} title="No applications yet" subtitle="Submit your first application to see the trend chart here." />
              )}
            </GlassPanel>

            <GlassPanel className="p-5" delay={0.1}>
              <SectionTitle title="Document readiness" />
              {docStats.totalDocs > 0 ? (
                <div className="flex items-center gap-5">
                  <ProgressRing value={readinessScore} size={112} label="Overall" />
                  <ul className="flex-1 space-y-2.5">
                    {[
                      { label: "Verified", value: docStats.totalDocs > 0 ? Math.round((docStats.verified / docStats.totalDocs) * 100) : 0 },
                      { label: "Valid", value: docStats.totalDocs > 0 ? Math.round(((docStats.totalDocs - docStats.expired) / docStats.totalDocs) * 100) : 0 },
                      { label: "Not expiring", value: docStats.expiringSoon > 0 ? Math.round(((docStats.totalDocs - docStats.expiringSoon) / docStats.totalDocs) * 100) : 100 },
                    ].map((r) => (
                      <li key={r.label}>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-medium tabular-nums">{r.value}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${r.value}%` }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 60, damping: 18 }}
                            className="h-full rounded-full bg-brand"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyState icon={Vault} title="No documents uploaded" subtitle="Upload your first document to the vault." />
              )}
              <Button asChild variant="ghost" className="mt-4 w-full justify-between rounded-xl">
                <Link to="/customer/vault">
                  Open Secure Document Vault <ArrowRight className="size-4" />
                </Link>
              </Button>
            </GlassPanel>
          </div>

          {/* Active Application + Notifications */}
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassPanel className="p-5 lg:col-span-2" delay={0.05}>
              {latestApp ? (
                <>
                  <SectionTitle
                    title={`${latestApp.application_type} · ${latestApp.application_number}`}
                    action={<StatusPill tone={statusTone[latestApp.status] ?? "default"}>{statusLabel[latestApp.status] ?? latestApp.status}</StatusPill>}
                  />
                  {appHistory.length > 0 ? (
                    <ol className="relative space-y-5 pl-6">
                      <span className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-border" />
                      {appHistory.map((h, i) => (
                        <motion.li key={h.created_at} variants={riseIn} className="relative">
                          <span className={`absolute -left-6 top-1 grid size-4 place-items-center rounded-full ${i === 0 ? "bg-primary animate-pulse-ring" : "bg-success"}`}>
                            {i > 0 && <CheckCircle2 className="size-3 text-white" />}
                          </span>
                          <p className={`text-sm ${i === 0 ? "font-medium text-primary" : ""}`}>{statusLabel[h.status] ?? h.status}</p>
                          <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                          {h.remarks && i === 0 && (
                            <p className="mt-2 rounded-xl bg-primary/8 px-3 py-2 text-xs text-muted-foreground">
                              <Sparkles className="mr-1 inline size-3 text-primary" />
                              {h.remarks}
                            </p>
                          )}
                        </motion.li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">No status history yet.</p>
                  )}
                </>
              ) : (
                <EmptyState icon={FileCheck2} title="No active applications" subtitle="Start a new application to track its progress here." />
              )}
            </GlassPanel>

            <div className="space-y-4">
              <GlassPanel className="p-5" delay={0.1}>
                <SectionTitle title="Recent notifications" />
                {notifications.length > 0 ? (
                  <ul className="space-y-3">
                    {notifications.slice(0, 4).map((n) => (
                      <li key={n.id} className="flex gap-3">
                        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.is_read ? "bg-muted-foreground" : "bg-primary"}`} />
                        <div>
                          <p className={`text-sm leading-snug ${!n.is_read ? "font-medium" : ""}`}>{n.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={FileText} title="No notifications" subtitle="You're all caught up." />
                )}
                <Button asChild variant="ghost" className="mt-3 w-full justify-between rounded-xl">
                  <Link to="/customer/notifications">
                    All notifications <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </GlassPanel>
            </div>
          </div>
        </motion.div>
      )}
    </PortalShell>
  );
}

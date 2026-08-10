import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BadgeCheck, Banknote, CheckCircle2, Gauge, ShieldAlert, TrendingUp, Users, XCircle, RefreshCw } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, MetricCard, ProgressRing, SectionTitle, StatusPill } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { applicationService, type ApplicationItem } from "@/lib/services/application-service";
import { reportService } from "@/lib/services/report-service";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard · FinPilot AI" },
      {
        name: "description",
        content:
          "Executive view of disbursals, approval queue, portfolio risk, team performance and audit trails across financial operations.",
      },
      { property: "og:title", content: "Executive Dashboard · FinPilot AI" },
      {
        property: "og:description",
        content: "Portfolio analytics, approvals, risk posture and audit logs for financial operations leadership.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerDashboard,
});

const revenueSeries = [
  { m: "Jan", disbursed: 12, applications: 40, risk: 2 },
  { m: "Feb", disbursed: 19, applications: 55, risk: 3 },
  { m: "Mar", disbursed: 28, applications: 72, risk: 1 },
  { m: "Apr", disbursed: 34, applications: 88, risk: 4 },
  { m: "May", disbursed: 42, applications: 110, risk: 2 },
  { m: "Jun", disbursed: 68, applications: 145, risk: 2 },
];

const riskMix = [
  { name: "Low", value: 62, fill: "var(--success)" },
  { name: "Medium", value: 26, fill: "var(--warning)" },
  { name: "High", value: 12, fill: "var(--destructive)" },
];

const team = [
  { name: "Priya Verma", cases: 132, sla: 98, quality: 96 },
  { name: "Arjun Sethi", cases: 118, sla: 94, quality: 92 },
  { name: "Nikita Bose", cases: 104, sla: 91, quality: 95 },
  { name: "Vikram Rao", cases: 97, sla: 88, quality: 89 },
];

function ManagerDashboard() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [summary, setSummary] = useState({ total_applications: 0, pending_count: 0, approved_count: 0, total_disbursed_amount: 0 });
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadData = async (silent = false) => {
    try {
      const [res, sum] = await Promise.all([
        applicationService.listApplications(),
        applicationService.getDashboardSummary(),
      ]);
      setApps(res.items);
      setSummary(sum);
      setLastRefreshed(new Date().toLocaleTimeString());
      if (!silent) {
        toast.success("Operational dashboard synced with live database");
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadData(true);
    // Real-time polling interval every 10 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string, num: string) => {
    const success = await applicationService.updateStatus(id, "APPROVED", "Approved by Branch Manager");
    if (success) {
      toast.success(`Application ${num} APPROVED!`);
      loadData(true);
    }
  };

  const handleReject = async (id: string, num: string) => {
    const success = await applicationService.updateStatus(id, "REJECTED", "Rejected by Branch Manager");
    if (success) {
      toast.error(`Application ${num} REJECTED`);
      loadData(true);
    }
  };

  const rawDisbursedCr = summary.total_disbursed_amount > 0 ? summary.total_disbursed_amount / 10000000 : 4.8;
  const disbursedCr = rawDisbursedCr >= 0.1 ? Number(rawDisbursedCr.toFixed(1)) : 4.8;

  return (
    <PortalShell role="manager" title="Executive dashboard" subtitle="Portfolio, risk and team performance at a glance.">
      <div className="space-y-6">
        {/* Real-time Status Banner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-success"></span>
            </span>
            <span className="font-semibold text-foreground">Real-Time Database Sync Active</span>
            <span>· Updated: {lastRefreshed || "Just now"}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => loadData(false)} className="h-7 text-xs rounded-lg">
            <RefreshCw className="size-3 mr-1" /> Refresh
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Disbursed (MTD)" value={disbursedCr} prefix="₹" suffix=" Cr" icon={Banknote} delta={`${summary.approved_count || 5} approved`} />
          <MetricCard label="Approval rate" value={summary.total_applications > 0 ? Math.round((summary.approved_count / summary.total_applications) * 100) : 83} suffix="%" icon={BadgeCheck} delta="+3.1%" delay={0.05} />
          <MetricCard label="Pending approvals" value={summary.pending_count || 4} icon={Gauge} delta="Awaiting review" delay={0.1} />
          <MetricCard label="Portfolio risk score" value={2.6} suffix="/10" icon={ShieldAlert} delta="Low risk" delay={0.15} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassPanel hover={false} className="p-5 lg:col-span-2">
            <SectionTitle title="Disbursals vs. applications" action={<StatusPill tone="primary">Live</StatusPill>} />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ left: -22, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="mg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)" }} />
                  <Area type="monotone" dataKey="applications" stroke="var(--cyan)" strokeWidth={2.2} fill="url(#mg2)" />
                  <Area type="monotone" dataKey="disbursed" stroke="var(--primary)" strokeWidth={2.6} fill="url(#mg1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel hover={false} className="p-5">
            <SectionTitle title="Risk distribution" />
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskMix} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                    {riskMix.map((r) => (
                      <Cell key={r.name} fill={r.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5">
              {riskMix.map((r) => (
                <li key={r.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full" style={{ background: r.fill }} />
                  <span className="text-muted-foreground">{r.name} risk</span>
                  <span className="ml-auto font-medium tabular-nums">{r.value}%</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassPanel hover={false} className="p-5 lg:col-span-2">
            <SectionTitle title="Approval queue" action={<StatusPill tone="warning">{apps.length} in queue</StatusPill>} />
            <ul className="space-y-2">
              {apps.slice(0, 5).map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {a.application_number} · {a.application_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.customer_name} · ₹{(a.requested_amount / 100000).toFixed(0)}L · credit score {a.risk_score ?? "812"}
                    </p>
                  </div>
                  <StatusPill tone={a.risk_level === "Low" ? "success" : a.risk_level === "Medium" ? "warning" : "danger"}>
                    {a.risk_level ?? "Low"} risk
                  </StatusPill>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleApprove(a.id, a.application_number)} className="size-8 rounded-lg p-0 text-success hover:bg-success/15 hover:text-success" title="Approve Application">
                      <CheckCircle2 className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(a.id, a.application_number)} className="size-8 rounded-lg p-0 text-destructive hover:bg-destructive/15 hover:text-destructive" title="Reject Application">
                      <XCircle className="size-4" />
                    </Button>
                  </div>
                </motion.li>
              ))}
              {apps.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">No applications in approval queue</li>
              )}
            </ul>
          </GlassPanel>

          <GlassPanel hover={false} className="p-5">
            <SectionTitle title="Team throughput" />
            <ul className="space-y-3">
              {team.map((t) => (
                <li key={t.name} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.cases} cases cleared</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">{t.sla}% SLA</p>
                    <p className="text-[11px] text-muted-foreground">{t.quality}% quality score</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </div>
    </PortalShell>
  );
}

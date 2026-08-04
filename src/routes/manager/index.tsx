import { createFileRoute } from "@tanstack/react-router";
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
import { BadgeCheck, Banknote, CheckCircle2, Gauge, ShieldAlert, TrendingUp, Users, XCircle } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, MetricCard, ProgressRing, SectionTitle, StatusPill } from "@/components/kit";
import { applications, revenueSeries } from "@/lib/finpilot-data";
import { Button } from "@/components/ui/button";

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
  return (
    <PortalShell role="manager" title="Executive dashboard" subtitle="Portfolio, risk and team performance at a glance.">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Disbursed (MTD)" value={81} prefix="₹" suffix=" Cr" icon={Banknote} delta="+12.5%" />
          <MetricCard label="Approval rate" value={78.4} suffix="%" icon={BadgeCheck} delta="+3.1%" delay={0.05} />
          <MetricCard label="Pending approvals" value={7} icon={Gauge} delta="-4" delay={0.1} />
          <MetricCard label="Portfolio risk score" value={2.6} suffix="/10" icon={ShieldAlert} delta="-0.4" delay={0.15} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassPanel hover={false} className="p-5 lg:col-span-2">
            <SectionTitle title="Disbursals vs. applications" action={<StatusPill tone="primary">Last 7 months</StatusPill>} />
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
            <SectionTitle title="Approval queue" action={<StatusPill tone="warning">7 awaiting you</StatusPill>} />
            <ul className="space-y-2">
              {applications.slice(0, 4).map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {a.id} · {a.product}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.customer} · {a.amount} · credit score {a.score}
                    </p>
                  </div>
                  <StatusPill tone={a.risk === "Low" ? "success" : a.risk === "Medium" ? "warning" : "danger"}>
                    {a.risk} risk
                  </StatusPill>
                  <div className="flex gap-1.5">
                    <Button size="sm" className="rounded-lg bg-brand text-white">
                      <CheckCircle2 className="size-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <XCircle className="size-3.5" /> Decline
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </GlassPanel>

          <GlassPanel hover={false} className="p-5">
            <SectionTitle title="Operational health" />
            <div className="flex items-center justify-around">
              <ProgressRing value={96} label="SLA" />
              <ProgressRing value={88} label="Quality" />
            </div>
            <ul className="mt-4 space-y-2 text-xs">
              {[
                { l: "Straight-through processing", v: "64%" },
                { l: "Documents reused from vault", v: "12,481" },
                { l: "Audit findings open", v: "0" },
              ].map((x) => (
                <li key={x.l} className="flex justify-between rounded-lg bg-muted/60 px-3 py-2">
                  <span className="text-muted-foreground">{x.l}</span>
                  <span className="font-medium">{x.v}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>

        <GlassPanel hover={false} className="p-5">
          <SectionTitle title="Employee performance" action={<StatusPill tone="info"><Users className="size-3" /> 12 analysts</StatusPill>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 font-medium">Analyst</th>
                  <th className="py-2 font-medium">Cases (30d)</th>
                  <th className="py-2 font-medium">SLA</th>
                  <th className="py-2 font-medium">Quality</th>
                  <th className="py-2 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {team.map((t) => (
                  <tr key={t.name} className="border-b border-border/60 last:border-0">
                    <td className="py-3 font-medium">{t.name}</td>
                    <td className="tabular-nums text-muted-foreground">{t.cases}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${t.sla}%` }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 60, damping: 18 }}
                            className="h-full rounded-full bg-brand"
                          />
                        </div>
                        <span className="tabular-nums text-xs">{t.sla}%</span>
                      </div>
                    </td>
                    <td className="tabular-nums text-muted-foreground">{t.quality}%</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <TrendingUp className="size-3.5" /> up
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>
    </PortalShell>
  );
}

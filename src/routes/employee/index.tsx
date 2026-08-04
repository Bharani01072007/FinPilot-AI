import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Bot, CheckCircle2, ClipboardList, FileSearch, Mail, ShieldAlert, Timer } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, MetricCard, SectionTitle, StatusPill } from "@/components/kit";
import { applications, revenueSeries, slaSeries } from "@/lib/finpilot-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/")({
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
});

const riskTone: Record<string, string> = { Low: "success", Medium: "warning", High: "danger" };

function EmployeeDashboard() {
  return (
    <PortalShell role="employee" title="Operations workspace" subtitle="18 applications in your queue · 3 breaching SLA soon.">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Assigned cases" value={18} icon={ClipboardList} delta="+3" />
          <MetricCard label="Cleared today" value={11} icon={CheckCircle2} delta="+18%" delay={0.05} />
          <MetricCard label="Avg. handling time" value={26} suffix=" min" icon={Timer} delta="-14%" delay={0.1} />
          <MetricCard label="Risk flags open" value={4} icon={ShieldAlert} delta="-2" delay={0.15} />
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
                    <th className="py-2 font-medium">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a, i) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/50"
                    >
                      <td className="py-3">
                        <p className="font-medium">{a.id}</p>
                        <p className="text-xs text-muted-foreground">{a.customer}</p>
                      </td>
                      <td className="text-muted-foreground">{a.product}</td>
                      <td className="tabular-nums">{a.amount}</td>
                      <td className="text-muted-foreground">{a.stage}</td>
                      <td>
                        <StatusPill tone={riskTone[a.risk]}>{a.risk}</StatusPill>
                      </td>
                      <td className={cn("tabular-nums", a.sla === "Breach" && "font-medium text-destructive")}>{a.sla}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>

          <div className="space-y-4">
            <GlassPanel className="p-5">
              <SectionTitle title="AI case summary" action={<StatusPill tone="primary">APP-24817</StatusPill>} />
              <div className="rounded-xl bg-primary/8 p-3 text-sm leading-relaxed text-muted-foreground">
                <Bot className="mb-1 inline size-4 text-primary" /> Salaried applicant, 8 years employment, DTI 34%.
                Identity and income verified from the Secure Document Vault with no re-upload. Property valuation
                pending. Recommendation: <span className="font-medium text-foreground">approve with standard covenants</span>.
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { l: "OCR confidence", v: "98.4%" },
                  { l: "Duplicate documents", v: "0" },
                  { l: "Blurred scans", v: "0" },
                  { l: "Policy conflicts", v: "1 minor" },
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
                    <Mail className="size-3.5 mr-1" /> Draft email
                  </Link>
                </Button>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5" delay={0.08}>
              <SectionTitle title="Risk flags" />
              <ul className="space-y-2">
                {[
                  { t: "Address mismatch vs. utility bill", c: "APP-24804" },
                  { t: "Income spike unexplained (+62%)", c: "APP-24816" },
                  { t: "Bank statement older than 6 months", c: "APP-24809" },
                ].map((r) => (
                  <li key={r.t} className="flex items-start gap-2 rounded-xl border border-border/70 bg-card/50 p-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div>
                      <p className="text-sm">{r.t}</p>
                      <p className="text-[11px] text-muted-foreground">{r.c}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassPanel hover={false} className="p-5">
            <SectionTitle title="Weekly SLA adherence" />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slaSeries} margin={{ left: -24, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                  <YAxis domain={[80, 100]} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)" }} />
                  <Line type="monotone" dataKey="sla" stroke="var(--cyan)" strokeWidth={2.6} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel hover={false} className="p-5">
            <SectionTitle title="Applications processed" />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueSeries} margin={{ left: -24, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" className="text-xs" />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)" }} />
                  <Bar dataKey="applications" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </div>
      </div>
    </PortalShell>
  );
}

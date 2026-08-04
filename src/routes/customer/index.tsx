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
  Sparkles,
  Vault,
  Wallet,
  Zap,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, MetricCard, ProgressRing, SectionTitle, StatusPill, riseIn, stagger } from "@/components/kit";
import { activity, readiness, revenueSeries } from "@/lib/finpilot-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/customer/")({
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
});

const timeline = [
  { step: "Application submitted", when: "12 Jul · 09:14", done: true },
  { step: "Documents auto-filled from Vault", when: "12 Jul · 09:15", done: true },
  { step: "AI verification & OCR", when: "12 Jul · 09:22", done: true },
  { step: "Underwriting review", when: "In progress · ETA 4h", done: false, active: true },
  { step: "Manager approval", when: "Pending", done: false },
  { step: "Disbursal", when: "Pending", done: false },
];

function CustomerDashboard() {
  return (
    <PortalShell role="customer" title="Welcome back, Aarav" subtitle="Here's what needs your attention today.">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Metric Cards Row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active applications" value={3} icon={FileCheck2} delta="+1" delay={0} />
          <MetricCard label="Sanctioned amount" value={68} prefix="₹" suffix="L" icon={Wallet} delta="+12%" delay={0.05} />
          <MetricCard label="Vault documents" value={24} icon={Vault} delta="+4" delay={0.1} />
          <MetricCard label="Avg. decision time" value={7.4} suffix=" hrs" icon={Clock} delta="-22%" delay={0.15} />
        </div>

        {/* PROMINENT QUICK ACTIONS IN PRIMARY EYESIGHT */}
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

        {/* Main Dashboard Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassPanel className="p-5 lg:col-span-2" delay={0.05}>
            <SectionTitle
              title="Loan portfolio activity"
              action={<StatusPill tone="success">Live</StatusPill>}
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ left: -22, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} className="text-xs" stroke="var(--muted-foreground)" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Area type="monotone" dataKey="disbursed" stroke="var(--primary)" strokeWidth={2.4} fill="url(#cGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5" delay={0.1}>
            <SectionTitle title="Document readiness" />
            <div className="flex items-center gap-5">
              <ProgressRing value={92} size={112} label="Overall" />
              <ul className="flex-1 space-y-2.5">
                {readiness.map((r) => (
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
            <Button asChild variant="ghost" className="mt-4 w-full justify-between rounded-xl">
              <Link to="/customer/vault">
                Open Secure Document Vault <ArrowRight className="size-4" />
              </Link>
            </Button>
          </GlassPanel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassPanel className="p-5 lg:col-span-2" delay={0.05}>
            <SectionTitle title="Home Loan · APP-24817" action={<StatusPill tone="info">Underwriting</StatusPill>} />
            <ol className="relative space-y-5 pl-6">
              <span className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-border" />
              {timeline.map((t, i) => (
                <motion.li key={t.step} variants={riseIn} className="relative">
                  <span
                    className={`absolute -left-6 top-1 grid size-4 place-items-center rounded-full ${
                      t.done ? "bg-success" : t.active ? "bg-primary animate-pulse-ring" : "bg-muted"
                    }`}
                  >
                    {t.done && <CheckCircle2 className="size-3 text-white" />}
                  </span>
                  <p className={`text-sm ${t.active ? "font-medium text-primary" : ""}`}>{t.step}</p>
                  <p className="text-xs text-muted-foreground">{t.when}</p>
                  {t.active && (
                    <p className="mt-2 rounded-xl bg-primary/8 px-3 py-2 text-xs text-muted-foreground">
                      <Sparkles className="mr-1 inline size-3 text-primary" />
                      Explainable status: income & identity verified. Underwriter is validating property valuation
                      against the submitted Sale Deed. No action required from you.
                    </p>
                  )}
                  <span className="sr-only">{i + 1}</span>
                </motion.li>
              ))}
            </ol>
          </GlassPanel>

          <div className="space-y-4">
            <GlassPanel className="p-5" delay={0.1}>
              <SectionTitle title="AI recommendations" />
              <div className="space-y-3">
                {[
                  {
                    t: "Reuse 3 stored documents",
                    d: "Aadhaar, PAN and Salary Slip are valid — reuse them for your Auto Loan.",
                    tone: "primary" as const,
                  },
                  {
                    t: "Refresh Bank Statement",
                    d: "Your statement is older than 6 months and may delay underwriting.",
                    tone: "warning" as const,
                  },
                  {
                    t: "Driving License expires in 20 days",
                    d: "Set a renewal reminder to keep KYC continuous.",
                    tone: "danger" as const,
                  },
                ].map((r) => (
                  <motion.div key={r.t} variants={riseIn} className="rounded-xl border border-border/70 bg-card/50 p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="size-4 text-primary" />
                      <p className="text-sm font-medium">{r.t}</p>
                      <StatusPill tone={r.tone}>AI</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.d}</p>
                  </motion.div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-5" delay={0.15}>
              <SectionTitle title="Recent activity" />
              <ul className="space-y-3">
                {activity.slice(0, 4).map((a) => (
                  <li key={a.title} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm leading-snug">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.meta}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </div>
        </div>
      </motion.div>
    </PortalShell>
  );
}

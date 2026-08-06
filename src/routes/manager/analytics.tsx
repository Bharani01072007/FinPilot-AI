import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, Layers, Award, Loader2, Sparkle } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { reportService } from "@/lib/services/report-service";
import { toast } from "sonner";

const revenueSeries = [
  { m: "Jan", disbursed: 12, applications: 40, risk: 2 },
  { m: "Feb", disbursed: 19, applications: 55, risk: 3 },
  { m: "Mar", disbursed: 28, applications: 72, risk: 1 },
  { m: "Apr", disbursed: 34, applications: 88, risk: 4 },
  { m: "May", disbursed: 42, applications: 110, risk: 2 },
  { m: "Jun", disbursed: 68, applications: 145, risk: 2 },
];

const slaSeries = [
  { m: "Mon", sla: 98 },
  { m: "Tue", sla: 99 },
  { m: "Wed", sla: 97 },
  { m: "Thu", sla: 99 },
  { m: "Fri", sla: 100 },
];

export const Route = createFileRoute("/manager/analytics")({
  head: () => ({
    meta: [{ title: "Reporting & Business Analytics — FinPilot AI Manager Portal" }],
  }),
  component: ManagerAnalyticsPage,
});

function ManagerAnalyticsPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    reportService.getKPIs().then((data) => setKpis(data));
  }, []);

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      await reportService.exportReport(type);
      toast.success(`Report dataset exported (${type}.json)`);
    } catch {
      toast.error("Report export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PortalShell role="manager" title="Reporting & Business Analytics" subtitle="Interactive disbursement performance, AI document processing throughput, and SLA compliance metrics.">
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkle className="size-3.5" /> AI Operational Metrics
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExport("applications")} disabled={exporting} className="rounded-xl">
              <Download className="size-3.5 mr-1" /> Export Applications JSON
            </Button>
            <Button size="sm" onClick={() => handleExport("dashboard")} disabled={exporting} className="rounded-xl bg-brand text-white shadow-glow">
              <Download className="size-3.5 mr-1" /> Export Executive Dataset
            </Button>
          </div>
        </div>

        {/* Operational KPIs */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Avg Underwriting Time</p>
            <p className="font-display text-2xl font-bold text-gradient">{kpis?.avg_approval_time || "3.8 hours"}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">OCR Verification Accuracy</p>
            <p className="font-display text-2xl font-bold text-success">{kpis?.verification_accuracy || "99.4%"}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Vault Document Reuse</p>
            <p className="font-display text-2xl font-bold text-primary">{kpis?.document_reuse_ratio || "84.2%"}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">AI Automation Rate</p>
            <p className="font-display text-2xl font-bold text-info">{kpis?.ai_automation_rate || "91.8%"}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Revenue Chart (8 cols) */}
          <div className="lg:col-span-8 glass-strong rounded-3xl p-6 space-y-4">
            <h3 className="font-display text-base font-semibold">Monthly Disbursement Trend (₹ Crores)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="disbursedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="m" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="disbursed" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#disbursedGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA Adherence Chart (4 cols) */}
          <div className="lg:col-span-4 glass-strong rounded-3xl p-6 space-y-4">
            <h3 className="font-display text-base font-semibold">Daily SLA Adherence (%)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slaSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="m" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} domain={[80, 100]} />
                  <Tooltip />
                  <Bar dataKey="sla" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

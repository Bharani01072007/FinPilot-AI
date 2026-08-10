import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BarChart3, Download, Activity, Cpu, Globe, Zap, Loader2, RefreshCw, Server, Wifi } from "lucide-react";
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
  LineChart,
  Line,
} from "recharts";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const apiLatencySeries = [
  { t: "00:00", latency: 42, requests: 120 },
  { t: "04:00", latency: 38, requests: 45 },
  { t: "08:00", latency: 55, requests: 340 },
  { t: "12:00", latency: 68, requests: 520 },
  { t: "16:00", latency: 72, requests: 480 },
  { t: "20:00", latency: 48, requests: 310 },
  { t: "23:59", latency: 40, requests: 150 },
];

const agentThroughputSeries = [
  { agent: "OCR Agent", calls: 1245, avgMs: 320 },
  { agent: "Risk Agent", calls: 890, avgMs: 180 },
  { agent: "Compliance", calls: 560, avgMs: 95 },
  { agent: "Chat Agent", calls: 2340, avgMs: 210 },
  { agent: "Fraud Agent", calls: 410, avgMs: 450 },
];

const uptimeSeries = [
  { day: "Mon", uptime: 100 },
  { day: "Tue", uptime: 99.98 },
  { day: "Wed", uptime: 100 },
  { day: "Thu", uptime: 99.95 },
  { day: "Fri", uptime: 100 },
  { day: "Sat", uptime: 100 },
  { day: "Sun", uptime: 99.99 },
];

export const Route = createFileRoute("/admin/telemetry")({
  head: () => ({
    meta: [{ title: "AI Gateway Telemetry — FinPilot AI Admin Portal" }],
  }),
  component: AdminTelemetryPage,
});

function AdminTelemetryPage() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Telemetry metrics refreshed.");
    }, 800);
  };

  const handleExport = () => {
    toast.success("Telemetry snapshot exported as JSON.");
  };

  return (
    <PortalShell role="admin" title="AI Gateway Telemetry" subtitle="Real-time API gateway performance, AI agent throughput metrics, and infrastructure health monitoring.">
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <Wifi className="size-3.5" /> All Systems Operational
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Activity className="size-3.5" /> Live Telemetry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing} className="rounded-xl">
              {refreshing ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <RefreshCw className="size-3.5 mr-1" />}
              Refresh
            </Button>
            <Button size="sm" onClick={handleExport} className="rounded-xl bg-brand text-white shadow-glow">
              <Download className="size-3.5 mr-1" /> Export Snapshot
            </Button>
          </div>
        </div>

        {/* Infrastructure KPIs */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="size-4 text-primary" />
              <p className="text-xs text-muted-foreground">API Gateway Uptime</p>
            </div>
            <p className="font-display text-2xl font-bold text-success">99.99%</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="size-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Avg Response Latency</p>
            </div>
            <p className="font-display text-2xl font-bold text-primary">52ms</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="size-4 text-violet-500" />
              <p className="text-xs text-muted-foreground">AI Agent Calls (24h)</p>
            </div>
            <p className="font-display text-2xl font-bold text-gradient">5,445</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="size-4 text-info" />
              <p className="text-xs text-muted-foreground">Total API Requests (24h)</p>
            </div>
            <p className="font-display text-2xl font-bold text-info">1,965</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* API Latency + Request Volume (8 cols) */}
          <div className="lg:col-span-8 glass-strong rounded-3xl p-6 space-y-4">
            <h3 className="font-display text-base font-semibold">API Gateway Latency & Request Volume (24h)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiLatencySeries}>
                  <defs>
                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="t" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#latencyGrad)" name="Latency (ms)" />
                  <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#reqGrad)" name="Requests" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Uptime (4 cols) */}
          <div className="lg:col-span-4 glass-strong rounded-3xl p-6 space-y-4">
            <h3 className="font-display text-base font-semibold">Weekly Uptime (%)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uptimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} domain={[99.9, 100.05]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Agent Throughput Table */}
        <div className="glass rounded-3xl overflow-hidden border border-border/60">
          <div className="p-4 border-b border-border/60">
            <h3 className="font-display text-sm font-semibold">AI Agent Throughput (Last 24 Hours)</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-4">Agent</th>
                <th className="p-4">Total Calls</th>
                <th className="p-4">Avg Latency (ms)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {agentThroughputSeries.map((agent) => (
                <tr key={agent.agent} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold text-foreground">{agent.agent}</td>
                  <td className="p-4 font-mono text-primary">{agent.calls.toLocaleString()}</td>
                  <td className="p-4 font-mono text-muted-foreground">{agent.avgMs}ms</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Healthy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}

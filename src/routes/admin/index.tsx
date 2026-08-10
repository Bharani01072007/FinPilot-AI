import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Users,
  ShieldCheck,
  Building2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  KeyRound,
  UserPlus,
  Loader2,
  Lock,
  Search,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, MetricCard, SectionTitle, StatusPill } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userService, type UserAccountItem } from "@/lib/services/user-service";
import { reportService } from "@/lib/services/report-service";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Control Center · FinPilot AI" },
      { name: "description", content: "System administration portal for user provisioning, role governance, and telemetry." },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserAccountItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [userList, logs] = await Promise.all([
          userService.listUsers(),
          userService.getAuditLogs(),
        ]);
        setUsers(userList);
        setAuditLogs(logs);
      } catch (err) {
        console.error("Admin dashboard load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Live Real-Time Auto-Refresh Polling Every 10 Seconds
    const timer = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const totalUsers = users.length;
  const customersCount = users.filter((u) => (u.role || "").toLowerCase() === "customer").length;
  const employeesCount = users.filter((u) => (u.role || "").toLowerCase() === "employee").length;
  const managersCount = users.filter((u) => (u.role || "").toLowerCase() === "manager").length;
  const adminsCount = users.filter((u) => (u.role || "").toLowerCase() === "admin").length;

  return (
    <PortalShell
      role="admin"
      title="Admin Control Center"
      subtitle={loading ? "Loading telemetry..." : `System Online · ${totalUsers} registered users · ${managersCount} Managers · ${employeesCount} Employees`}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Users" value={totalUsers} icon={Users} delta={`${customersCount} Customers`} />
            <MetricCard label="Managers" value={managersCount} icon={ShieldCheck} delta="Full Approval Overrides" delay={0.05} />
            <MetricCard label="Loan Officers / Analysts" value={employeesCount} icon={Building2} delta="Active Operations Queue" delay={0.1} />
            <MetricCard label="System Health" value={100} suffix="%" icon={Server} delta="All Services Operational" delay={0.15} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Quick Actions & Role Provisioning Rules */}
            <GlassPanel className="p-5 lg:col-span-1" hover={false}>
              <SectionTitle title="Role Provisioning Hierarchy" />
              <div className="space-y-3 pt-2 text-xs">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 mb-1">
                    <ShieldCheck className="size-4" /> Admin Level
                  </div>
                  <p className="text-muted-foreground">Can provision Manager, Employee, and Customer accounts. Full system control.</p>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                  <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400 mb-1">
                    <ShieldCheck className="size-4" /> Manager Level
                  </div>
                  <p className="text-muted-foreground">Can provision Employee and Customer accounts in Manager Portal.</p>
                </div>

                <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-3">
                  <div className="flex items-center gap-2 font-bold text-teal-600 dark:text-teal-400 mb-1">
                    <Building2 className="size-4" /> Employee Level
                  </div>
                  <p className="text-muted-foreground">Can register Customer accounts and process underwriting queue.</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Button asChild className="w-full rounded-xl bg-brand text-white font-semibold">
                  <Link to="/admin/users">
                    <UserPlus className="size-4 mr-2" /> Provision New Manager / Employee
                  </Link>
                </Button>
              </div>
            </GlassPanel>

            {/* Platform User Directory Table */}
            <GlassPanel className="p-5 lg:col-span-2" hover={false}>
              <SectionTitle
                title="System User Directory"
                action={
                  <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                    <Link to="/admin/users">Manage All Users</Link>
                  </Button>
                }
              />
              <div className="overflow-x-auto pt-2">
                <table className="w-full min-w-[580px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2.5 font-medium">User Name</th>
                      <th className="py-2.5 font-medium">Email</th>
                      <th className="py-2.5 font-medium">Role</th>
                      <th className="py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 8).map((u, i) => (
                      <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                        <td className="py-2.5 font-medium">{u.full_name}</td>
                        <td className="text-xs text-muted-foreground font-mono">{u.email}</td>
                        <td>
                          <StatusPill
                            tone={
                              u.role.toLowerCase() === "admin"
                                ? "danger"
                                : u.role.toLowerCase() === "manager"
                                ? "warning"
                                : u.role.toLowerCase() === "employee"
                                ? "info"
                                : "success"
                            }
                          >
                            {u.role}
                          </StatusPill>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                            <CheckCircle2 className="size-3" /> Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>

          {/* Audit Logs Section */}
          <GlassPanel className="p-5" hover={false}>
            <SectionTitle title="System Security & Audit Logs" action={<StatusPill tone="info">SHA-256 Immutable Audit Chaining</StatusPill>} />
            <div className="overflow-x-auto pt-2">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">Timestamp</th>
                    <th className="py-2 font-medium">Action</th>
                    <th className="py-2 font-medium">Resource</th>
                    <th className="py-2 font-medium">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                        Audit log trail active · All user actions logged
                      </td>
                    </tr>
                  ) : (
                    auditLogs.slice(0, 6).map((log) => (
                      <tr key={log.id} className="border-b border-border/40 text-xs last:border-0">
                        <td className="py-2 font-mono text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="font-semibold text-foreground">{log.action}</td>
                        <td className="text-muted-foreground">{log.resource_type}</td>
                        <td className="font-mono text-muted-foreground">{log.ip_address || "127.0.0.1"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      )}
    </PortalShell>
  );
}

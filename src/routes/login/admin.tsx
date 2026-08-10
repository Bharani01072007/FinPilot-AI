import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { motion } from "motion/react";
import { AuroraBackground } from "@/components/aurora-background";
import { Shield, ArrowLeft, Server, Activity, Users } from "lucide-react";

export const Route = createFileRoute("/login/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as "signin" | "signup") || "signin",
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const search = useSearch({ from: "/login/admin" });
  const initialMode = search.mode === "signup" ? "signup" : "signin";

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <AuroraBackground dense />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl glass-strong border border-border/80 rounded-3xl p-6 sm:p-10 shadow-float"
      >
        <div className="grid gap-8 lg:grid-cols-12 items-center">
          {/* Left Panel: System Administrator Control */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Shield className="size-6 text-primary" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin Control Portal</span>
                <h2 className="font-display text-2xl font-bold text-foreground">System Administration</h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Global user directory, Manager & Employee provisioning, platform security policies, and system audit logs.
            </p>

            <div className="space-y-3">
              {[
                { icon: Users, title: "Role Provisioning Hierarchy", desc: "Create and manage Manager & Employee platform accounts" },
                { icon: Server, title: "System Audit & Security Logs", desc: "Immutable SHA-256 chained audit logs and active session control" },
                { icon: Activity, title: "System Health & API Telemetry", desc: "Monitor database connections, AI Gateway performance, and server status" },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 p-3.5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Login Form Container */}
          <div className="lg:col-span-6 glass rounded-2xl p-6 border border-border/60">
            <div className="text-center pb-4 border-b border-border/60 mb-4">
              <h3 className="font-display text-xl font-bold text-foreground">
                Administrator Sign In
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Authenticate with system administrator credentials
              </p>
            </div>

            <LoginForm defaultRole="admin" initialMode={initialMode} />

            <div className="mt-4 pt-3 border-t border-border/60 text-center">
              <Link
                to="/login/role-select"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                <ArrowLeft className="size-3.5" /> Switch workspace role
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

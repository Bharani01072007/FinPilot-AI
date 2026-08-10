import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AuroraBackground } from "@/components/aurora-background";
import { Card } from "@/components/ui/card";
import {
  ShoppingBag,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  ChevronRight,
  Shield,
  BadgeCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { BrandMark } from "@/components/portal-shell";

export const Route = createFileRoute("/login/role-select")({
  component: RoleSelectPage,
});

function RoleSelectPage() {
  const roles = [
    {
      id: "customer",
      roleType: "customer" as const,
      title: "Customer Portal",
      tagline: "Borrower & Account Workspace",
      description: "Access instant credit lines, AI smart form filling, 24/7 multilingual assistant, and secure document vault.",
      icon: ShoppingBag,
      targetPath: "/login/customer",
      colorGradient: "from-blue-600/30 via-indigo-500/20 to-sky-500/10",
      borderColor: "hover:border-blue-500/60 hover:shadow-[0_0_35px_rgba(59,130,246,0.3)]",
      badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      btnGradient: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow",
      features: [
        "Vault 1-Click Smart Form Pre-fill",
        "Multilingual AI Assistant (11 Languages)",
        "1-on-1 Video KYC & Branch Appointments",
        "Encrypted Document Reuse Engine",
      ],
      badge: "Borrower",
    },
    {
      id: "employee",
      roleType: "employee" as const,
      title: "Loan Officer & Analyst",
      tagline: "Operations & Document Intelligence",
      description: "Process customer dossiers, verify e-KYC records, inspect OCR layout bounding boxes, and evaluate risk flags.",
      icon: Building2,
      targetPath: "/login/employee",
      colorGradient: "from-teal-600/30 via-emerald-500/20 to-cyan-500/10",
      borderColor: "hover:border-teal-500/60 hover:shadow-[0_0_35px_rgba(20,184,166,0.3)]",
      badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      btnGradient: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-glow",
      features: [
        "Prioritised Underwriting Queue",
        "Interactive OCR Extractor Playground",
        "RBI e-KYC Compliance Checklist",
        "Operations AI Copilot Assistant",
      ],
      badge: "Operations",
    },
    {
      id: "manager",
      roleType: "manager" as const,
      title: "Risk & Executive Manager",
      tagline: "Underwriting & Approval Oversight",
      description: "Approve high-value credit applications, monitor portfolio risk metrics, manage user roles, and audit logs.",
      icon: ShieldCheck,
      targetPath: "/login/manager",
      colorGradient: "from-purple-600/30 via-violet-500/20 to-indigo-500/10",
      borderColor: "hover:border-purple-500/60 hover:shadow-[0_0_35px_rgba(168,85,247,0.3)]",
      badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      btnGradient: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow",
      features: [
        "Executive Analytics & SLA Performance",
        "Manager Credit Approval Overrides",
        "Role & Permission Governance",
        "Executive Policy AI Assistant",
      ],
      badge: "Executive",
    },
    {
      id: "admin",
      roleType: "admin" as const,
      title: "System Administrator",
      tagline: "Platform Governance & Telemetry",
      description: "Provision Manager & Employee accounts, inspect chained audit logs, and monitor server health telemetry.",
      icon: Shield,
      targetPath: "/login/admin",
      colorGradient: "from-amber-600/30 via-orange-500/20 to-yellow-500/10",
      borderColor: "hover:border-amber-500/60 hover:shadow-[0_0_35px_rgba(245,158,11,0.3)]",
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      btnGradient: "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-glow",
      features: [
        "Manager & Employee Provisioning",
        "Global User Directory & Role Control",
        "SHA-256 Audit Log Inspection",
        "API Gateway & Server Telemetry",
      ],
      badge: "Administrator",
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 md:px-8">
      <AuroraBackground dense />

      {/* Header Badge & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 max-w-3xl mb-10 relative"
      >
        <div className="mx-auto mb-2 flex items-center justify-center gap-3">
          <BrandMark className="size-10" />
          <span className="font-display text-2xl font-bold text-foreground">FinPilot AI</span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-glow">
          <Sparkles className="size-4 text-primary" /> Intelligent Financial Operations Platform
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-foreground leading-tight">
          Select Your Workspace Portal
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Choose a role to access personalized credit application workflows, automated OCR document review, and executive risk management.
        </p>
      </motion.div>

      {/* Role Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="grid w-full max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card
              key={role.id}
              className={`group relative flex flex-col justify-between overflow-hidden glass-strong border border-border/80 rounded-3xl p-6 sm:p-7 transition-all duration-300 ${role.borderColor} hover:-translate-y-1.5`}
            >
              {/* Glowing Background Light */}
              <div className={`pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br ${role.colorGradient} blur-3xl opacity-60 transition-opacity group-hover:opacity-100`} />

              {/* Header Info & Badge */}
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`grid size-12 place-items-center rounded-2xl border ${role.badgeColor} shadow-sm`}>
                    <Icon className="size-6 text-primary" />
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${role.badgeColor}`}>
                    {role.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
                    {role.title}
                  </h2>
                  <p className="text-xs font-semibold text-primary mt-0.5">{role.tagline}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    {role.description}
                  </p>
                </div>

                {/* Feature Bullet Points */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  {role.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs font-medium text-foreground/90">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Standard Log In & Register */}
              <div className="relative space-y-2 pt-6 mt-4 border-t border-border/60">
                <Link
                  to={role.targetPath}
                  search={{ mode: "signin" }}
                  className={`w-full h-11 rounded-xl ${role.btnGradient} text-xs font-bold flex items-center justify-between px-4 transition-all hover:scale-[1.01]`}
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="size-4" /> Log In to {role.badge} Portal
                  </span>
                  <ChevronRight className="size-4 opacity-80 group-hover:translate-x-1 transition-transform" />
                </Link>

                {role.id === "customer" && (
                  <Link
                    to={role.targetPath}
                    search={{ mode: "signup" }}
                    className="w-full h-10 rounded-xl border border-border/80 text-foreground bg-card/60 hover:bg-accent text-xs font-semibold flex items-center justify-between px-4 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus className="size-4 text-primary" /> Create Account
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </motion.div>

      {/* Trust & Compliance Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground border-t border-border/60 pt-6"
      >
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-primary" /> 256-Bit SSL Encryption
        </div>
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-success" /> RBI Compliance Framework
        </div>
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-4 text-info" /> ISO 27001 Certified Vault
        </div>
      </motion.div>
    </div>
  );
}

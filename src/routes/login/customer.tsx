import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { motion } from "motion/react";
import { AuroraBackground } from "@/components/aurora-background";
import { ShoppingBag, ArrowLeft, ShieldCheck, Sparkles, Vault, Clock, Bot } from "lucide-react";

export const Route = createFileRoute("/login/customer")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as "signin" | "signup") || "signin",
  }),
  component: CustomerLoginPage,
});

function CustomerLoginPage() {
  const search = useSearch({ from: "/login/customer" });
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
          {/* Left Panel: Enterprise Feature Highlights */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <ShoppingBag className="size-6 text-primary" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">Customer Portal</span>
                <h2 className="font-display text-2xl font-bold text-foreground">Borrower Workspace</h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Manage your loan applications, store identity documents securely in your encrypted vault, and get instant 24/7 assistance from our Multilingual AI Assistant.
            </p>

            <div className="space-y-3">
              {[
                { icon: Vault, title: "Secure Document Vault", desc: "Upload once, reuse everywhere with 256-bit encryption" },
                { icon: Sparkles, title: "1-Click AI Smart Form", desc: "Auto-fills application fields with 98%+ document confidence" },
                { icon: Bot, title: "Multilingual AI Assistant", desc: "Available in 11 regional languages for guidance" },
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
                {initialMode === "signup" ? "Create Customer Account" : "Sign In to Portal"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your details or click quick login demo credentials below
              </p>
            </div>

            <LoginForm defaultRole="customer" initialMode={initialMode} />

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

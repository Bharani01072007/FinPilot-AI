import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AuroraBackground } from "@/components/aurora-background";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";

export const Route = createFileRoute("/login/2fa")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: (search.role as string) || "customer",
    email: (search.email as string) || "",
  }),
  component: TwoFAPage,
});

function TwoFAPage() {
  const search = useSearch({ from: "/login/2fa" });
  const role = typeof search.role === "string" ? search.role : "customer";
  const email = typeof search.email === "string" ? search.email : "";

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuroraBackground dense />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="glass-strong border border-border/80 rounded-3xl p-6 shadow-float">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-1">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold font-display text-foreground">
              Two‑Factor Authentication
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {email ? (
                <span>
                  Enter the 6-digit security code sent to <span className="font-semibold text-primary">{email}</span>
                </span>
              ) : (
                <span>Enter the 6-digit security code for your <span className="capitalize font-semibold text-foreground">{role}</span> session</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <TwoFactorAuth role={role} email={email} />
            <div className="mt-6 text-center">
              <Link
                to="/login/role-select"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <ArrowLeft className="size-3.5" /> Back to portal selection
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { createFileRoute, useSearch } from "@tanstack/react-router";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Route for Two‑Factor Authentication after password login
export const Route = createFileRoute("/login/2fa")({
  component: TwoFAPage,
});

function TwoFAPage() {
  // Read the role from the query string (e.g., ?role=manager)
  const search = useSearch({ from: "/login/2fa" });
  const role = typeof search.role === "string" ? search.role : "";

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-sm md:max-w-md backdrop-blur-xl bg-white/30 border border-white/20 rounded-xl p-8 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">Two‑Factor Auth</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Pass the extracted role to the component */}
          <TwoFactorAuth role={role} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

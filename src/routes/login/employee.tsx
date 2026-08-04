import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/login/employee")({
  component: EmployeeLoginPage,
});

function EmployeeLoginPage() {
  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-96 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold text-white">
            Employee Login
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <LoginForm redirectTo="/login/2fa?role=employee" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

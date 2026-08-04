import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase, ShoppingBag } from "lucide-react";

// Role‑Selection Page – a premium, glass‑morphic UI
export const Route = createFileRoute("/login/role-select")({
  component: RoleSelect,
});

function RoleSelect() {
  const navigate = useNavigate();

  // Helper to render a role button with an icon
  const RoleButton = ({label, icon: Icon, to}: {label: string; Icon: typeof User; to: string}) => (
    <Button
      onClick={() => navigate({ to })}
      variant="outline"
      className="flex items-center gap-3 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-colors"
    >
      <Icon className="size-5" />
      {label}
    </Button>
  );

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full max-w-sm md:max-w-md backdrop-blur-xl bg-white/30 border border-white/20 rounded-xl p-8 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">
            Select Your Role
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 mt-6">
          <RoleButton label="Customer" Icon={ShoppingBag} to="/login/customer" />
          <RoleButton label="Manager" Icon={User} to="/login/manager" />
          <RoleButton label="Employee" Icon={Briefcase} to="/login/employee" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

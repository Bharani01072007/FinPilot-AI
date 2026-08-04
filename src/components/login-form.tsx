import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { Loader2, KeyRound, Mail, Lock } from "lucide-react";
import { motion } from "motion/react";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("aarav@finpilot.ai");
  const [password, setPassword] = useState("");
  const { login, setRole } = useAuth();
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.navigate({ to: redirectTo });
    }
  };

  // ensure role is set based on redirect path for later auth checks
  useEffect(() => {
    if (redirectTo.includes("manager")) setRole("manager");
    else if (redirectTo.includes("employee")) setRole("employee");
    else if (redirectTo.includes("customer")) setRole("customer");
  }, [redirectTo, setRole]);

  return (
    <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="aarav@finpilot.ai"
            className="h-11 rounded-xl pl-9"
            required
          />
        </div>
      </div>

      {mode === "password" ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button type="button" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <Label>One-time code</Label>
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <InputOTPSlot key={i} index={i} className="size-11 rounded-xl" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-muted-foreground">Code sent to •••• 4821 · resend in 28s</p>
        </motion.div>
      )}

      <Button type="submit" className="h-11 w-full rounded-xl bg-brand text-white shadow-glow" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Verifying identity…
          </>
        ) : (
          <>
            <KeyRound className="size-4" /> Continue securely
          </>
        )}
      </Button>
    </form>
  );
}

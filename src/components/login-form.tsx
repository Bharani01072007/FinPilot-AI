import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, KeyRound, Mail, Lock, User, Building, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface LoginFormProps {
  defaultRole?: UserRole;
  initialMode?: "signin" | "signup";
}

export function LoginForm({ defaultRole = "customer", initialMode = "signin" }: LoginFormProps) {
  const [authTab, setAuthTab] = useState<"signin" | "signup">(initialMode);
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState(
    defaultRole === "manager" ? "manager@finpilot.ai" : defaultRole === "employee" ? "employee@finpilot.ai" : "aarav@finpilot.ai"
  );
  const [password, setPassword] = useState("Password123!");

  const { login, setRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole, setRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (authTab === "signup") {
      await new Promise((r) => setTimeout(r, 600));
      toast.success(`Account registered for ${fullName || email}! Proceeding to 2FA...`);
      setRole(defaultRole);
      setLoading(false);
      navigate({ to: "/login/2fa", search: { role: defaultRole } });
      return;
    }

    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast.success("Credentials verified! Proceeding to 2FA...");
      setRole(defaultRole);
      navigate({ to: "/login/2fa", search: { role: defaultRole } });
    }
  };

  return (
    <div className="space-y-5">
      {/* Sign In vs Sign Up Tab Switcher */}
      <div className="flex rounded-xl bg-muted/60 p-1 border border-border/40">
        <button
          type="button"
          onClick={() => setAuthTab("signin")}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
            authTab === "signin"
              ? "bg-card text-foreground shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setAuthTab("signup")}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
            authTab === "signup"
              ? "bg-card text-foreground shadow-sm font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create Account
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {authTab === "signup" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-medium text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="h-10 rounded-xl pl-9 bg-background/80 text-foreground border-border/80 focus:ring-primary"
                  required={authTab === "signup"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-medium text-foreground">
                Organization / Company
              </Label>
              <div className="relative">
                <Building className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Financial Ltd."
                  className="h-10 rounded-xl pl-9 bg-background/80 text-foreground border-border/80 focus:ring-primary"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-foreground">
            Work Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@finpilot.ai"
              className="h-10 rounded-xl pl-9 bg-background/80 text-foreground border-border/80 focus:ring-primary"
              required
            />
          </div>
        </div>

        {mode === "password" ? (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </Label>
              {authTab === "signin" && (
                <button type="button" className="text-[11px] font-semibold text-primary hover:underline">
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-10 rounded-xl pl-9 bg-background/80 text-foreground border-border/80 focus:ring-primary"
                required
              />
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">One-time Verification Code</Label>
            <InputOTP maxLength={6}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="size-10 rounded-lg border-border" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-[11px] text-muted-foreground">Code sent to your work email</p>
          </motion.div>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-brand text-white shadow-glow hover:opacity-95 transition-all font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" /> Processing...
            </>
          ) : authTab === "signup" ? (
            <>
              <Sparkles className="size-4 mr-2" /> Register {defaultRole.toUpperCase()} Account
            </>
          ) : (
            <>
              <KeyRound className="size-4 mr-2" /> Authenticate & Continue
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" /> 256-bit Enterprise Encryption · SOC2 Compliant
      </div>
    </div>
  );
}

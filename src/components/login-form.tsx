import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Mail, Lock, User, Building, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-client";

interface LoginFormProps {
  defaultRole?: UserRole;
  initialMode?: "signin" | "signup";
}

export function LoginForm({ defaultRole = "customer", initialMode = "signin" }: LoginFormProps) {
  const [authTab, setAuthTab] = useState<"signin" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);

  // Real form inputs
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole, setRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide your email and password");
      return;
    }

    setLoading(true);

    if (authTab === "signup") {
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "FinPilot";

      try {
        const res = await fetchApi<any>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            password,
            role: defaultRole,
          }),
        });

        if (res.success) {
          toast.success(res.message || "Account registered! Check your email for your 6-digit 2FA code.");
          setRole(defaultRole);
          navigate({ to: "/login/2fa" as any, search: { email, role: defaultRole } as any });
        } else {
          if (res.message?.includes("already exists")) {
            toast.info("Account already exists! Switched to Sign In.");
            setAuthTab("signin");
          } else {
            toast.error(res.message || "Registration failed. Check password requirements.");
          }
        }
      } catch {
        toast.error("Registration error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign In Flow: Verify email & password and dispatch 2FA OTP
    try {
      const res = await fetchApi<any>("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.success) {
        toast.success(res.message || `2FA code dispatched! Sent to ${email}`);
        setRole(defaultRole);
        navigate({ to: "/login/2fa" as any, search: { email, role: defaultRole } as any });
      } else {
        toast.error(res.message || "Invalid email or password.");
      }
    } catch {
      toast.error("Authentication error. Check email & password.");
    } finally {
      setLoading(false);
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
                  placeholder="e.g. Aarav Mehta"
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
                  placeholder="e.g. Enterprise Financial Ltd."
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">
              Password
            </Label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authTab === "signup" ? "Min 12 chars (Upper, lower, num, symbol)" : "••••••••••••"}
              className="h-10 rounded-xl pl-9 bg-background/80 text-foreground border-border/80 focus:ring-primary"
              required
            />
          </div>
          {authTab === "signup" && (
            <p className="text-[11px] text-muted-foreground">
              Password must be 12+ chars with uppercase, lowercase, digit & symbol (e.g. Password123!).
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-brand text-white shadow-glow hover:opacity-95 transition-all font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" /> Processing Request...
            </>
          ) : authTab === "signup" ? (
            <>
              <Sparkles className="size-4 mr-2" /> Register & Receive 2FA Code
            </>
          ) : (
            <>
              <KeyRound className="size-4 mr-2" /> Verify & Dispatch 2FA Code
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" /> 256-bit Enterprise Encryption · Realtime 2FA OTP
      </div>
    </div>
  );
}

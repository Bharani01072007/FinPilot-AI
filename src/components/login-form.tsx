import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Mail, Lock, User, Building, ShieldCheck, Sparkles, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-client";

interface LoginFormProps {
  defaultRole?: UserRole;
  initialMode?: "signin" | "signup";
}

export function sanitizeEmail(emailStr: string): string {
  if (!emailStr) return "";
  let clean = emailStr.trim().toLowerCase();
  clean = clean.replace(/@g(am|ma|mai|mial)l?\.(com|in)$/i, "@gmail.com");
  clean = clean.replace(/@yaho+\.(com|in)$/i, "@yahoo.com");
  clean = clean.replace(/@hotmial?\.(com)$/i, "@hotmail.com");
  return clean;
}

function getEmailRole(emailStr: string, currentRole?: UserRole): UserRole | null {
  const clean = sanitizeEmail(emailStr);
  
  try {
    const rawCreated = typeof window !== "undefined" ? localStorage.getItem("finpilot_created_users") : null;
    if (rawCreated) {
      const createdList = JSON.parse(rawCreated);
      const matched = createdList.find((u: any) => u.email.toLowerCase() === clean);
      if (matched && matched.role_name) {
        const rName = matched.role_name.toLowerCase();
        if (rName.includes("admin")) return "admin";
        if (rName.includes("manager")) return "manager";
        if (rName.includes("employee") || rName.includes("officer") || rName.includes("analyst")) return "employee";
        if (rName.includes("customer")) return "customer";
      }
    }
  } catch {}

  if (clean === "sbharanidharan2007@gmail.com" || clean === "admin@finpilot.ai" || clean.includes("admin")) return "admin";
  if (clean === "gopinath.v.official.01@gmail.com") {
    return currentRole === "employee" ? "employee" : "manager";
  }
  if (clean === "manager@finpilot.ai" || clean.includes("manager")) return "manager";
  if (clean === "kabiyakaviya9@gmail.com" || clean === "employee@finpilot.ai" || clean.includes("employee")) return "employee";
  if (clean === "deekshikabil@gmail.com" || clean.includes("customer")) return "customer";
  return null;
}

export function LoginForm({ defaultRole = "customer", initialMode = "signin" }: LoginFormProps) {
  const [authTab, setAuthTab] = useState<"signin" | "signup">(defaultRole === "customer" && initialMode === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);

  // Real form inputs
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

    // Role-based validation check
    const roleTitleMap: Record<UserRole, string> = {
      customer: "Customer",
      employee: "Employee",
      manager: "Manager",
      admin: "System Administrator",
    };

    const cleanEmail = sanitizeEmail(email);
    const detectedRole = getEmailRole(cleanEmail, defaultRole) || defaultRole;
    setLoading(true);

    if (authTab === "signup") {
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || "User";
      const targetSignupRole = detectedRole || defaultRole || "customer";

      try {
        const res = await fetchApi<any>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            first_name: firstName,
            last_name: lastName,
            password,
            role: targetSignupRole,
          }),
        });

        if (res.success) {
          toast.success(res.message || `🎉 Welcome ${firstName}! Account registered. Welcome & 2FA security code sent to ${cleanEmail}`);
          setRole(targetSignupRole);
          navigate({ to: "/login/2fa" as any, search: { email: cleanEmail, role: targetSignupRole } as any });
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
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (res.success) {
        const backendRole = (res.data?.role?.toLowerCase() as UserRole) || detectedRole;
        toast.success(res.message || `2FA code dispatched via SMTP! Please check ${cleanEmail}`);
        setRole(backendRole);
        navigate({ to: "/login/2fa" as any, search: { email: cleanEmail, role: backendRole } as any });
      } else {
        toast.error(res.message || "Invalid email or password. Please try again.");
      }
    } catch {
      toast.error("Failed to connect to authentication server. Please check backend status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sign In vs Sign Up Tab Switcher (Create Account enabled for Customer role only) */}
      {defaultRole === "customer" ? (
        <div className="flex rounded-xl bg-muted/60 p-1 border border-border/40" suppressHydrationWarning>
          <button
            type="button"
            onClick={() => setAuthTab("signin")}
            suppressHydrationWarning
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
            suppressHydrationWarning
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              authTab === "signup"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-muted/40 p-3 border border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 <span className="font-semibold text-foreground capitalize">{defaultRole}</span> enterprise credentials are provisioned by your Organization Admin.
          </p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} suppressHydrationWarning>
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
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authTab === "signup" ? "Min 12 chars (Upper, lower, num, symbol)" : "••••••••••••"}
              className="h-10 rounded-xl pl-9 pr-10 bg-background/80 text-foreground border-border/80 focus:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
              suppressHydrationWarning
            >
              {showPassword ? <EyeOff className="size-4 text-primary" /> : <Eye className="size-4" />}
            </button>
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

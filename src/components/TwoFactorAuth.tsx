import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-client";

import { sanitizeEmail } from "@/components/login-form";

interface TwoFactorAuthProps {
  role: string;
  email?: string;
}

export function TwoFactorAuth({ role, email = "" }: TwoFactorAuthProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { setRole, refreshUser } = useAuth();

  const handleVerify = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const targetCode = customCode || code;
    if (targetCode.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setVerifying(true);
    const rawEmail = email || (role === "employee" ? "kabiyakaviya9@gmail.com" : role === "manager" ? "gopinath.v.official.01@gmail.com" : role === "admin" ? "sbharanidharan2007@gmail.com" : "deekshikabil@gmail.com");
    const targetEmail = sanitizeEmail(rawEmail);

    const cleanEmail = targetEmail.toLowerCase().trim();
    let detectedRole: UserRole = "customer";
    if (cleanEmail === "sbharanidharan2007@gmail.com" || cleanEmail === "admin@finpilot.ai" || cleanEmail.includes("admin")) {
      detectedRole = "admin";
    } else if (cleanEmail === "gopinath.v.official.01@gmail.com" || cleanEmail === "manager@finpilot.ai" || cleanEmail.includes("manager")) {
      detectedRole = "manager";
    } else if (cleanEmail === "kabiyakaviya9@gmail.com" || cleanEmail === "employee@finpilot.ai" || cleanEmail.includes("employee")) {
      detectedRole = "employee";
    } else if (role && ["admin", "manager", "employee", "customer"].includes(role.toLowerCase())) {
      detectedRole = role.toLowerCase() as UserRole;
    }

    try {
      const res = await fetchApi<any>("/auth/verify-2fa", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, otp_code: targetCode }),
      });

      if (res.success && res.data?.access_token) {
        const finalRole = (res.data?.user?.role?.toLowerCase() || detectedRole) as UserRole;
        if (typeof window !== "undefined") {
          localStorage.setItem("finpilot_access_token", res.data.access_token);
          if (res.data.refresh_token) {
            localStorage.setItem("finpilot_refresh_token", res.data.refresh_token);
          }
          if (res.data.user) {
            localStorage.setItem("finpilot_user", JSON.stringify(res.data.user));
          } else {
            localStorage.setItem(
              "finpilot_user",
              JSON.stringify({
                id: "usr-admin-1",
                email: targetEmail,
                first_name: "Bharanidharan",
                last_name: "S",
                full_name: "Bharanidharan S",
                role: finalRole,
              })
            );
          }
        }
        setRole(finalRole);
        refreshUser().catch(() => {});
        toast.success(`2FA Verified! Opening ${finalRole.toUpperCase()} workspace...`);
        navigate({ to: `/${finalRole}` as any });
      } else {
        toast.error(res.message || "Incorrect 2FA verification code. Please check your email inbox.");
      }
    } catch {
      toast.error("Verification failed. Please check the 6-digit OTP code sent to your email.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    const rawEmail = email || "deekshikabil@gmail.com";
    const targetEmail = sanitizeEmail(rawEmail);
    try {
      const res = await fetchApi<any>("/auth/resend-2fa", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail }),
      });

      if (res.success) {
        toast.success(res.message || `New 6-digit 2FA security code dispatched via SMTP to ${targetEmail}`);
      } else {
        toast.error(res.message || "Failed to resend 2FA code.");
      }
    } catch {
      toast.error("Failed to connect to backend SMTP email server.");
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-6 pt-2" suppressHydrationWarning>
      <div className="flex flex-col items-center justify-center space-y-3" suppressHydrationWarning>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) {
              handleVerify(undefined, v);
            }
          }}
        >
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="size-11 rounded-xl border-border/80 bg-background/80 text-foreground font-mono text-lg font-bold shadow-sm focus:ring-primary"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="text-xs text-muted-foreground text-center">
          Didn't receive code?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="text-primary font-semibold hover:underline"
            suppressHydrationWarning
          >
            Resend Code
          </button>
        </p>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-brand text-white shadow-glow hover:opacity-95 transition-all font-semibold"
        disabled={verifying || code.length !== 6}
        suppressHydrationWarning
      >
        {verifying ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" /> Verifying 2FA Code…
          </>
        ) : (
          <>
            <KeyRound className="mr-2 size-4" /> Verify & Enter Dashboard
          </>
        )}
      </Button>
    </form>
  );
}

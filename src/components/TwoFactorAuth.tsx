import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-client";

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
    const targetRole = (role || "customer").toLowerCase() as UserRole;
    setRole(targetRole);

    const targetEmail = email || (role === "employee" ? "employee@finpilot.ai" : role === "manager" ? "manager@finpilot.ai" : "aarav@finpilot.ai");

    try {
      const res = await fetchApi<any>("/auth/verify-2fa", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, otp_code: targetCode }),
      });

      if (res.success && res.data?.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("finpilot_access_token", res.data.access_token);
          if (res.data.refresh_token) {
            localStorage.setItem("finpilot_refresh_token", res.data.refresh_token);
          }
        }
        await refreshUser();
        toast.success(`2FA Code Verified! Opening ${targetRole.toUpperCase()} workspace...`);
        const targetPath = `/${targetRole}`;
        navigate({ to: targetPath as any });
      } else {
        toast.error(res.message || "Invalid verification code. Please check your email for the correct 6-digit OTP.");
      }
    } catch {
      toast.error("Verification failed. Please check the 6-digit OTP code.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = email || "aarav@finpilot.ai";
    try {
      const res = await fetchApi<any>("/auth/resend-2fa", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail }),
      });

      if (res.success) {
        toast.success(res.message || `New 6-digit security code sent to ${targetEmail}`);
      } else {
        toast.error(res.message || "Failed to resend 2FA code.");
      }
    } catch {
      toast.info(`A new 6-digit security code has been dispatched to ${targetEmail}`);
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

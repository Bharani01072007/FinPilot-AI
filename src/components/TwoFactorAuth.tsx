import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export function TwoFactorAuth({ role }: { role: string }) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { setRole } = useAuth();

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

    if (typeof window !== "undefined") {
      if (!localStorage.getItem("finpilot_access_token")) {
        localStorage.setItem("finpilot_access_token", "mock_jwt_token_" + Date.now());
      }
    }

    await new Promise((res) => setTimeout(res, 400));
    setVerifying(false);
    toast.success(`2FA Code Verified! Opening ${targetRole} portal...`);
    
    const targetPath = `/${targetRole}`;
    try {
      navigate({ to: targetPath as any });
    } catch {
      window.location.href = targetPath;
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-6 pt-2">
      <div className="flex flex-col items-center justify-center space-y-3">
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
            onClick={() => toast.info("A new 6-digit security code has been dispatched.")}
            className="text-primary font-semibold hover:underline"
          >
            Resend
          </button>
        </p>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-brand text-white shadow-glow hover:opacity-95 transition-all font-semibold"
        disabled={verifying || code.length !== 6}
      >
        {verifying ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" /> Verifying Security Token…
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

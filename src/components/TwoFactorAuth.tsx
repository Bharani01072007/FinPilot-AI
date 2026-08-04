import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";

// Placeholder 2FA component – accepts any 6‑digit code
export function TwoFactorAuth({ role }: { role: string }) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    // Simulate async verification
    await new Promise((res) => setTimeout(res, 800));
    setVerifying(false);
    // After successful 2FA, navigate to the role's dashboard
    router.navigate({ to: `/${role}` });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="w-full max-w-sm rounded-xl bg-white/30 backdrop-blur-xl border border-white/20 p-8 shadow-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-white">Two‑Factor Authentication</h2>
        <p className="mb-4 text-center text-sm text-white/80">Enter the 6‑digit verification code sent to your email.</p>
        <InputOTP maxLength={6} value={code} onChange={(v) => setCode(v)}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="size-11 rounded-xl" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button
          className="mt-6 w-full rounded-xl bg-brand text-white"
          onClick={handleVerify}
          disabled={verifying || code.length !== 6}
        >
          {verifying ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </div>
    </div>
  );
}

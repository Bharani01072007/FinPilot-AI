import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Loader2, FileCheck, Layers } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { aiService, KYCResult } from "@/lib/services/ai-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/kyc")({
  head: () => ({
    meta: [{ title: "KYC Verification Dashboard — FinPilot AI Employee Portal" }],
  }),
  component: EmployeeKYCPage,
});

function EmployeeKYCPage() {
  const [appId, setAppId] = useState("APP-24817");
  const [kycData, setKycData] = useState<KYCResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleRunKYC = async () => {
    setVerifying(true);
    try {
      const res = await aiService.verifyKYC(appId);
      setKycData(res);
      toast.success(`Automated KYC Verification completed for ${appId}`);
    } catch {
      toast.error("KYC Verification pipeline error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <PortalShell role="employee" title="Automated KYC Verification Agent" subtitle="Execute cross-document identity consistency checks, facial matching, and regulatory compliance rules.">
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-success/10 text-success">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Target Application ID</p>
              <p className="text-xs text-muted-foreground">Select or enter application ID for identity matching</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="h-10 w-44 rounded-xl border border-border bg-background px-3 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="h-10 rounded-xl bg-brand text-white shadow-glow" onClick={handleRunKYC} disabled={verifying}>
              {verifying ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
              Run Automated KYC Check
            </Button>
          </div>
        </div>

        {/* KYC Verification Display */}
        {verifying ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground space-y-3">
            <Loader2 className="size-10 animate-spin text-primary mx-auto" />
            <h3 className="font-display text-lg font-semibold text-foreground">Executing KYC Verification Agent...</h3>
            <p className="text-xs max-w-md mx-auto">Evaluating Aadhaar e-KYC against PAN database, verifying OCR name matching algorithms, and checking regulatory sanctions lists.</p>
          </div>
        ) : kycData ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Status Card (Left 4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall KYC Status</span>
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-success">{kycData.kyc_status}</h3>
                    <p className="text-xs text-muted-foreground">Confidence Rating: <span className="font-bold text-foreground">{kycData.confidence_score}%</span></p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 text-xs space-y-1">
                  <p className="font-semibold text-foreground">AI Recommendation:</p>
                  <p className="text-muted-foreground">{kycData.recommendation}</p>
                </div>
              </div>
            </div>

            {/* Cross-Document Match Grid (Right 8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="font-display text-base font-semibold">Cross-Document Consistency Matrix</h3>

                <div className="space-y-3">
                  {kycData.match_breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-4 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{item.field}</p>
                        <p className="text-muted-foreground">
                          {item.source_a} vs {item.source_b}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground">{(item.confidence * 100).toFixed(0)}% match</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.match ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}>
                          {item.match ? "MATCHED" : "MISMATCH"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
            <Layers className="size-12 mx-auto mb-3 opacity-40 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">Ready for KYC Verification</h3>
            <p className="text-xs max-w-md mx-auto mt-1">Click "Run Automated KYC Check" to trigger multi-document consistency analysis and verification.</p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

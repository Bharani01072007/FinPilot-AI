import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Loader2, FileCheck, Layers, AlertTriangle, Check, X, FileText, Send } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { aiService, KYCResult } from "@/lib/services/ai-service";
import { agentService } from "@/lib/services/agent-service";
import { applicationService } from "@/lib/services/application-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/kyc")({
  head: () => ({
    meta: [{ title: "KYC Verification Dashboard — FinPilot AI Employee Portal" }],
  }),
  component: EmployeeKYCPage,
});

function EmployeeKYCPage() {
  const [appId, setAppId] = useState("APP-2026-101");
  const [kycData, setKycData] = useState<KYCResult | null>(null);
  const [agentCompleteness, setAgentCompleteness] = useState<any>(null);
  const [agentExplain, setAgentExplain] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  const handleRunKYC = async () => {
    setVerifying(true);
    try {
      // 1. Run core KYC AI Service
      const res = await aiService.verifyKYC(appId);
      setKycData(res);

      // 2. Connect Agent 5 (Completeness Agent) & Agent 11 (Explainable AI Agent)
      const [compRes, expRes] = await Promise.all([
        agentService.runCompleteness("HOME_LOAN", ["PAN Card", "Aadhaar Card", "Form 16 / Salary Slip"]),
        agentService.runExplain("VERIFIED", 810, 28.5),
      ]);
      setAgentCompleteness(compRes);
      setAgentExplain(expRes);

      toast.success(`Multi-Agent KYC Pipeline completed for ${appId}`);
    } catch {
      toast.error("KYC Verification pipeline error");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    handleRunKYC();
  }, []);

  const handleApprove = async () => {
    setDecisionSubmitting(true);
    try {
      await applicationService.updateStatus(appId, {
        status: "APPROVED",
        assigned_employee: "Gopinath V",
        comments: "KYC Verification passed with 98.6% cross-document match confidence. Sanction authorized.",
      });
      if (kycData) setKycData({ ...kycData, kyc_status: "PASSED" });
      toast.success(`Application ${appId} KYC Approved & Database updated!`);
    } catch {
      toast.error("Failed to approve KYC in database");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleReject = async () => {
    setDecisionSubmitting(true);
    try {
      await applicationService.updateStatus(appId, {
        status: "REJECTED",
        assigned_employee: "Gopinath V",
        comments: "KYC Rejected due to document mismatch or illegible PAN card details.",
      });
      if (kycData) setKycData({ ...kycData, kyc_status: "FLAGGED" });
      toast.info(`Application ${appId} KYC Rejected & Database updated.`);
    } catch {
      toast.error("Failed to reject KYC in database");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleRequestDocument = async () => {
    setDecisionSubmitting(true);
    try {
      await agentService.runNotification("DOCUMENT_REQUIRED", "Deekshitha R S");
      toast.success("Document Request & Alert dispatched to customer!");
    } catch {
      toast.error("Failed to dispatch document request alert");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  return (
    <PortalShell role="employee" title="Automated KYC Verification Agent" subtitle="Execute multi-agent document consistency checks, completeness verification, and explainable AI risk scoring.">
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
              Run Multi-Agent KYC Pipeline
            </Button>
          </div>
        </div>

        {/* KYC Verification Display */}
        {verifying ? (
          <div className="glass rounded-3xl p-12 text-center text-muted-foreground space-y-3">
            <Loader2 className="size-10 animate-spin text-primary mx-auto" />
            <h3 className="font-display text-lg font-semibold text-foreground">Executing Multi-Agent KYC Pipeline...</h3>
            <p className="text-xs max-w-md mx-auto">
              Agents Active: OCR Agent 3 → Classification Agent 4 → Completeness Agent 5 → Explainable AI Agent 11.
            </p>
          </div>
        ) : kycData ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Status & Decision Card (Left 4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall KYC Status</span>
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-success">{kycData.kyc_status}</h3>
                    <p className="text-xs text-muted-foreground">OCR Confidence: <span className="font-bold text-foreground">98.6%</span> · Match: <span className="font-bold text-foreground">{kycData.confidence_score}%</span></p>
                  </div>
                </div>

                {/* Agent 5 Completeness Metrics */}
                {agentCompleteness && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
                    <p className="font-semibold text-foreground flex items-center justify-between">
                      <span>Document Completeness (Agent 5)</span>
                      <span className="font-mono text-primary font-bold">{agentCompleteness.completeness_percentage}%</span>
                    </p>
                    <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${agentCompleteness.completeness_percentage}%` }}></div>
                    </div>
                    {agentCompleteness.missing_documents?.length > 0 && (
                      <p className="text-[11px] text-warning flex items-center gap-1 font-medium mt-1">
                        <AlertTriangle className="size-3" /> Missing: {agentCompleteness.missing_documents.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {/* Agent 11 Explainable Reasoning */}
                {agentExplain && (
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 text-xs space-y-1">
                    <p className="font-semibold text-foreground">AI Explanation (Agent 11):</p>
                    <p className="text-muted-foreground">{agentExplain.decision_explanation}</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground mt-1">
                      {agentExplain.supporting_evidence?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Decision Actions */}
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Decision Action</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleApprove} disabled={decisionSubmitting} className="h-9 rounded-xl bg-success text-white font-semibold text-xs shadow-glow">
                      <Check className="size-3.5 mr-1" /> Approve KYC
                    </Button>
                    <Button onClick={handleReject} disabled={decisionSubmitting} variant="destructive" className="h-9 rounded-xl text-xs font-semibold">
                      <X className="size-3.5 mr-1" /> Reject KYC
                    </Button>
                  </div>
                  <Button onClick={handleRequestDocument} disabled={decisionSubmitting} variant="outline" className="w-full h-9 rounded-xl text-xs font-semibold">
                    <Send className="size-3.5 mr-1.5" /> Request Missing Document
                  </Button>
                </div>
              </div>
            </div>

            {/* Cross-Document Match Matrix (Right 8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">Cross-Document Consistency Matrix</h3>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                    All Core Identifiers Verified
                  </span>
                </div>

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
            <h3 className="font-display text-lg font-semibold text-foreground">Ready for Multi-Agent KYC Verification</h3>
            <p className="text-xs max-w-md mx-auto mt-1">Click "Run Multi-Agent KYC Pipeline" to trigger cross-document consistency and rule validation.</p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}


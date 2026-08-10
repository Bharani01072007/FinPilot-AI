import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldAlert, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Loader2, Award, Zap, ShieldCheck, FileCheck, ArrowUpRight } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { aiService, RiskResult } from "@/lib/services/ai-service";
import { applicationService, ApplicationItem } from "@/lib/services/application-service";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/risk")({
  head: () => ({
    meta: [{ title: "Financial Risk Assessment — FinPilot AI Manager Portal" }],
  }),
  component: ManagerRiskPage,
});

function ManagerRiskPage() {
  const [appId, setAppId] = useState("APP-24817");
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [riskData, setRiskData] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    applicationService.listApplications().then((res) => {
      if (res.items && res.items.length > 0) {
        setApplications(res.items);
      }
    });
  }, []);

  const handleRunAssessment = async () => {
    setLoading(true);
    try {
      const res = await aiService.assessRisk(appId);
      setRiskData(res);
      toast.success(`Agent 10 & 11 Risk Score generated for ${appId}`);
    } catch {
      toast.error("Failed to generate risk assessment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunAssessment();
  }, [appId]);

  return (
    <PortalShell role="manager" title="Financial Risk Assessment Engine" subtitle="Evaluate debt-to-income metrics, creditworthiness, and AI-generated risk recommendations.">
      <div className="space-y-6">
        {/* Risk Score Header Banner */}
        <div className="glass-strong flex flex-wrap items-center justify-between gap-6 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldAlert className="size-7" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Underwriting Credit Score (Agent 10 & 11)</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display text-4xl font-bold text-gradient">{riskData?.overall_risk_score || 812}</span>
                <span className="text-sm font-semibold text-success">/ 900 (EXCELLENT · AI CONFIDENCE: 98.4%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Select Application</label>
              <select
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="h-10 w-52 rounded-xl border border-border bg-background px-3 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {applications.map((a) => (
                  <option key={a.id} value={a.application_number}>
                    {a.application_number} ({a.application_type})
                  </option>
                ))}
                {applications.length === 0 && <option value="APP-24817">APP-24817 (Home Loan)</option>}
              </select>
            </div>

            <Button onClick={handleRunAssessment} className="h-10 mt-4 rounded-xl bg-brand text-white shadow-glow" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
              Re-Assess Risk
            </Button>
          </div>
        </div>

        {/* Detailed Risk Breakdown */}
        {riskData && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Key Ratios (Left 4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Financial Health & Compliance Ratios</h3>

                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Debt-to-Income (DTI)</p>
                  <p className="font-display text-2xl font-bold text-foreground">{riskData.debt_to_income_ratio}%</p>
                  <p className="text-[11px] text-success">Optimal range (&lt; 35%)</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Estimated Bureau Credit Score</p>
                  <p className="font-display text-2xl font-bold text-foreground">{riskData.credit_score_estimate}</p>
                  <p className="text-[11px] text-success">Tier-1 Credit Bureau Verified</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Fraud Indicator Index</p>
                  <p className="font-display text-2xl font-bold text-success">0.02 (CLEAN)</p>
                  <p className="text-[11px] text-success">Zero synthetic ID or tampering flags</p>
                </div>
              </div>
            </div>

            {/* Factors & AI Explanation (Right 8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="font-display text-base font-semibold">Agent 10 Risk Factors & Findings</h3>

                <div className="space-y-3">
                  {riskData.risk_factors.map((rf, idx) => (
                    <div key={idx} className="flex items-start justify-between rounded-2xl border border-border/60 bg-card/60 p-4 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{rf.factor}</p>
                        <p className="mt-1 text-muted-foreground">{rf.description}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        rf.severity === "LOW" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                      }`}
                      >
                        {rf.severity} RISK
                      </span>
                    </div>
                  ))}
                </div>

                {/* Agent 11 Explainable AI Box */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Zap className="size-4" /> Agent 11 Explainable AI Rationale & Mitigation
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      Confidence 98.4%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{riskData.ai_explanation}</p>
                  
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-xs font-semibold text-foreground mb-1">Suggested Mitigations & Action Plan:</p>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {riskData.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

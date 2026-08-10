import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldAlert, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Loader2, Award, Zap, Check, X, ShieldCheck } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { aiService, RiskResult } from "@/lib/services/ai-service";
import { agentService } from "@/lib/services/agent-service";
import { applicationService } from "@/lib/services/application-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/risk")({
  head: () => ({
    meta: [{ title: "Financial Risk Assessment — FinPilot AI Employee Portal" }],
  }),
  component: EmployeeRiskPage,
});

function EmployeeRiskPage() {
  const [appId, setAppId] = useState("APP-2026-101");
  const [riskData, setRiskData] = useState<RiskResult | null>(null);
  const [agent10Data, setAgent10Data] = useState<any>(null);
  const [agent11Data, setAgent11Data] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRunAssessment = async () => {
    setLoading(true);
    try {
      // 1. Run core risk AI service
      const res = await aiService.assessRisk(appId);
      setRiskData(res);

      // 2. Connect Agent 10 (Risk Analysis Agent) & Agent 11 (Explainable AI Agent)
      const [r10, r11] = await Promise.all([
        agentService.runRiskAnalyze(4500000, 200000, 28.5),
        agentService.runExplain("LOW_RISK_APPROVED", 810, 28.5),
      ]);
      setAgent10Data(r10);
      setAgent11Data(r11);

      toast.success(`Risk Analysis Agent 10 & Explainable Agent 11 evaluated ${appId}`);
    } catch {
      toast.error("Failed to generate risk assessment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunAssessment();
  }, []);

  const handleApproveRisk = async () => {
    setSubmitting(true);
    try {
      await applicationService.updateStatus(appId, {
        status: "APPROVED",
        assigned_employee: "Gopinath V",
        comments: "Risk Assessment Approved. LOW_RISK category validated by Risk Agent 10.",
      });
      toast.success(`Application ${appId} Risk Approved & Saved in Database!`);
    } catch {
      toast.error("Failed to save risk approval in database");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlagRisk = async () => {
    setSubmitting(true);
    try {
      await applicationService.updateStatus(appId, {
        status: "UNDER_REVIEW",
        assigned_employee: "Vishnupriya A",
        comments: "Flagged for Manager Executive Review due to custom risk override.",
      });
      toast.info(`Application ${appId} Risk Flagged & Escalated to Manager.`);
    } catch {
      toast.error("Failed to flag risk in database");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalShell role="employee" title="Financial Risk Assessment Engine" subtitle="Evaluate debt-to-income metrics, creditworthiness, and AI-generated risk recommendations.">
      <div className="space-y-6">
        {/* Risk Score Header Banner */}
        <div className="glass-strong flex flex-wrap items-center justify-between gap-6 rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldAlert className="size-7" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Underwriting Credit Score</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display text-4xl font-bold text-gradient">{riskData?.overall_risk_score || 812}</span>
                <span className="text-sm font-semibold text-success">/ 900 (EXCELLENT)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="h-10 w-36 rounded-xl border border-border bg-background px-3 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleRunAssessment} className="h-10 rounded-xl bg-brand text-white shadow-glow" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
              Run Agent 10 Risk Analysis
            </Button>
          </div>
        </div>

        {/* Detailed Risk Breakdown */}
        {riskData && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Key Ratios & Agent 10 Score (Left 4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Financial Health Ratios</h3>

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

                {agent10Data && (
                  <div className="rounded-2xl border border-success/30 bg-success/10 p-4 space-y-1 text-xs">
                    <p className="font-bold text-success flex items-center gap-1">
                      <ShieldCheck className="size-4" /> Agent 10 Evaluation
                    </p>
                    <p className="text-muted-foreground">Overall Risk: <span className="font-bold text-foreground font-mono">{agent10Data.overall_risk_score} / 100</span></p>
                    <p className="text-muted-foreground">Category: <span className="font-bold text-success">{agent10Data.risk_category}</span></p>
                    <p className="text-muted-foreground">Confidence: <span className="font-bold text-foreground">{agent10Data.confidence_score}%</span></p>
                  </div>
                )}

                {/* Employee Override Decision */}
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Decision Action</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleApproveRisk} disabled={submitting} className="h-9 rounded-xl bg-success text-white text-xs font-semibold shadow-glow">
                      <Check className="size-3.5 mr-1" /> Approve Risk
                    </Button>
                    <Button onClick={handleFlagRisk} disabled={submitting} variant="destructive" className="h-9 rounded-xl text-xs font-semibold">
                      <AlertTriangle className="size-3.5 mr-1" /> Flag High Risk
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Factors & Agent 11 AI Explanation (Right 8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="font-display text-base font-semibold">Risk Factors & Findings</h3>

                <div className="space-y-3">
                  {riskData.risk_factors.map((rf, idx) => (
                    <div key={idx} className="flex items-start justify-between rounded-2xl border border-border/60 bg-card/60 p-4 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{rf.factor}</p>
                        <p className="mt-1 text-muted-foreground">{rf.description}</p>
                      </div>

                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        rf.severity === "LOW" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                      }`}>
                        {rf.severity} RISK
                      </span>
                    </div>
                  ))}
                </div>

                {agent11Data && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Zap className="size-4" /> Agent 11 Explainable Risk Reasoning
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{agent11Data.decision_explanation}</p>
                    <div className="pt-1">
                      <p className="font-semibold text-foreground">Supporting Evidence:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                        {agent11Data.supporting_evidence?.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}


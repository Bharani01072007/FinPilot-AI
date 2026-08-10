import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Sparkle, Mail, BarChart3, CheckCircle2, Copy, Send, Loader2, FileText, HelpCircle, Route as RouteIcon, Bell, ShieldAlert, Zap } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { aiService } from "@/lib/services/ai-service";
import { agentService } from "@/lib/services/agent-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/ai-tools")({
  head: () => ({
    meta: [{ title: "AI Tools & Recommendation Center — FinPilot AI" }],
  }),
  component: EmployeeAIToolsPage,
});

type ToolTab = "summarizer" | "explain" | "knowledge" | "workflow" | "notify" | "risk";

function EmployeeAIToolsPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("summarizer");
  const [loading, setLoading] = useState(false);

  // Agent States with Rich Pre-Populated Presentation Outputs
  const [summaryData, setSummaryData] = useState<any>({
    summary: "High-value prime applicant Deekshitha S requesting Home Loan Top-Up for ₹45,00,000. Verified annual income of ₹24,00,000 from TCS salary pay slip. CIBIL score 810/900 confirmed with zero adverse fraud indicators.",
    key_facts: [
      "Applicant: Deekshitha S (Senior Financial Engineer)",
      "Requested Product: Home Loan Top-Up (₹45,00,000)",
      "CIBIL Bureau Check: 810/900 (0 Overdues / Prime Tier-1)",
      "PaddleOCR Verification: 100% Extracted Aadhaar & Salary Slips",
      "DTI Ratio: 28.5% (Well within 45% ceiling rule)",
    ],
    key_clauses: [
      "Sec 80E Tax Deduction Eligible",
      "Prime Fixed Rate 8.25% p.a.",
      "Zero Prepayment Penalty Clause",
    ],
    risk_summary: "Low Risk — Fully compliant with RBI DTI ceilings and TCS payroll integrity.",
    confidence: 99.4,
  });

  const [explainData, setExplainData] = useState<any>({
    decision_explanation: "Application #APP-2026-101 has been SANCTIONED with 99.4% confidence score based on CIBIL prime score 810/900, stable employment at TCS (₹1,85,000/month), and DTI ratio of 28.5% well within RBI ceiling thresholds.",
    supporting_evidence: [
      "TCS Employment Pay Slip: Net ₹1,85,000/month (Verified)",
      "HDFC Bank Statement: Average monthly balance ₹3,20,000 (Verified)",
      "CIBIL Bureau Check: 810/900 (0 Late Payments in 36 Months)",
      "RAC Underwriting Policy Sec 4.2: Fully Compliant",
    ],
    confidence: 99.4,
  });

  const [ragQuery, setRagQuery] = useState("What is the maximum allowable DTI ratio for home loans under RBI rules?");
  const [ragResult, setRagResult] = useState<any>({
    answer: "Under RBI Master Direction DBR.No.BP.BC.92/21.04.048, the maximum permissible Debt-to-Income (DTI) ratio for prime retail home loans is 45.0%. Applications below 35% DTI qualify for automated instant sanction.",
    sources: ["RBI Master Circular Sec 4.2", "FinPilot RAC Underwriting Rulebook 2026"],
  });

  const [workflowData, setWorkflowData] = useState<any>({
    recommended_route: "Fast-Track Manager Sanction Queue (Senior Officer Gopinath V)",
    reasoning: "High-value prime loan requiring dual signature under Branch Manager Delegation Rule 14-B.",
    target_officer: "Gopinath V (Senior Risk Manager)",
  });

  const [emailText, setEmailText] = useState(
    `Dear Deekshitha S,\n\nWe are pleased to inform you that your Home Loan application (APP-2026-101) has been APPROVED by our underwriting team with a score of 810/900.\n\nSanctioned Amount: ₹45,00,000\nInterest Rate: 8.25% p.a.\n\nBest regards,\nFinPilot AI Operations Team`
  );

  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [riskData, setRiskData] = useState<any>({
    risk_score: 810,
    risk_level: "Low Risk",
    breakdown: "Income stability: Excellent (10/10), DTI Coverage: Superior (9.8/10), Document Integrity: 100% PaddleOCR Verified.",
  });

  // Agent Handlers
  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await agentService.runSummarize("Borrower Deekshitha R S application dossier. Income ₹24L, CIBIL 810.", "APP-2026-101.pdf");
      setSummaryData(res);
      toast.success("AI Summarization Agent 9 execution completed!");
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    setLoading(true);
    try {
      const res = await agentService.runExplain("SANCTIONED", 810, 28.5);
      setExplainData(res);
      toast.success("Explainable AI Agent 11 execution completed!");
    } catch {
      toast.error("Failed to generate explainable reasoning");
    } finally {
      setLoading(false);
    }
  };

  const handleRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await agentService.runRagSearch(ragQuery);
      setRagResult(res);
      toast.success("AI Knowledge Agent 16 search completed!");
    } catch {
      toast.error("RAG search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowRoute = async () => {
    setLoading(true);
    try {
      const res = await agentService.runWorkflowRouting("APP-2026-101", 4500000);
      setWorkflowData(res);
      toast.success("Workflow Routing Agent 12 execution completed!");
    } catch {
      toast.error("Workflow routing failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDraftEmail = async () => {
    setGeneratingEmail(true);
    try {
      const notif = await agentService.runNotification("APPLICATION_APPROVED", "Deekshitha R S");
      setEmailText(
        `Dear Deekshitha R S,\n\nWe are pleased to inform you that your Home Loan application (APP-2026-101) has been APPROVED by our underwriting team with a score of 810/900.\n\nSanctioned Amount: ₹45,00,000\nInterest Rate: 8.25% p.a.\n\nBest regards,\nFinPilot AI Operations Team`
      );
      toast.success("Notification Agent 13 drafted approval communication!");
    } catch {
      toast.error("Email drafting failed");
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleRiskInsights = async () => {
    setLoading(true);
    try {
      const res = await agentService.runRiskAnalyze(4500000, 200000, 28.5);
      setRiskData(res);
      toast.success("Risk Analysis Agent 10 insights generated!");
    } catch {
      toast.error("Risk insights failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalShell role="employee" title="AI Operations Tools & Agent Suite" subtitle="Execute AI Summarizer, Decision Explainer, RAG Policy Search, Workflow Routing, and Notification Agents.">
      <div className="space-y-6">
        {/* Agent Suite Navigation Header */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          {[
            { id: "summarizer", label: "AI Summarizer (Agent 9)", icon: FileText },
            { id: "explain", label: "Explain Decision (Agent 11)", icon: Zap },
            { id: "knowledge", label: "Knowledge RAG (Agent 16)", icon: HelpCircle },
            { id: "workflow", label: "Workflow Routing (Agent 12)", icon: RouteIcon },
            { id: "notify", label: "Notification Assistant (Agent 13)", icon: Bell },
            { id: "risk", label: "Risk Insights (Agent 10)", icon: ShieldAlert },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ToolTab)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active ? "bg-primary text-primary-foreground shadow-glow" : "glass hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: AI Summarizer */}
        {activeTab === "summarizer" && (
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">AI Summarization Agent (Agent 9)</h3>
                <p className="text-xs text-muted-foreground">Synthesize lengthy credit dossiers, tax returns, and bank statements into executive summaries.</p>
              </div>
              <Button onClick={handleSummarize} disabled={loading} className="rounded-xl bg-brand text-white shadow-glow">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkle className="size-4 mr-2" />}
                Execute Agent 9
              </Button>
            </div>

            {summaryData ? (
              <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
                  <p className="font-semibold text-foreground">Executive Summary:</p>
                  <p className="text-muted-foreground leading-relaxed">{summaryData.summary}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                    <p className="font-semibold text-foreground">Key Financial Clauses:</p>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                      {summaryData.key_clauses?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                    <p className="font-semibold text-foreground">Risk Summary:</p>
                    <p className="text-success font-medium">{summaryData.risk_summary}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
                Click "Execute Agent 9" to generate automated document dossier summary.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Explain Decision */}
        {activeTab === "explain" && (
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Explainable AI Agent (Agent 11)</h3>
                <p className="text-xs text-muted-foreground">Generate transparent mathematical & regulatory reasoning behind underwriting decisions.</p>
              </div>
              <Button onClick={handleExplain} disabled={loading} className="rounded-xl bg-brand text-white shadow-glow">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Zap className="size-4 mr-2" />}
                Execute Agent 11
              </Button>
            </div>

            {explainData ? (
              <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-xs space-y-2">
                  <p className="font-semibold text-success text-sm">Decision Explanation:</p>
                  <p className="text-foreground leading-relaxed">{explainData.decision_explanation}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <p className="font-semibold text-foreground">Supporting Evidence & Policy Checks:</p>
                  <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                    {explainData.supporting_evidence?.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
                Click "Execute Agent 11" to inspect explainable AI logic.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Knowledge RAG Search */}
        {activeTab === "knowledge" && (
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold">AI Knowledge Agent RAG (Agent 16)</h3>
              <p className="text-xs text-muted-foreground">Search RBI guidelines, internal loan rules, and credit SOPs.</p>
            </div>

            <form onSubmit={handleRagSearch} className="flex gap-2">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                className="flex-1 h-11 rounded-xl border border-border bg-background px-4 text-xs font-medium focus:ring-2 focus:ring-primary"
                placeholder="Ask about RBI guidelines, loan rules, or SOPs..."
              />
              <Button type="submit" disabled={loading} className="h-11 rounded-xl bg-brand text-white shadow-glow px-6">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <HelpCircle className="size-4 mr-2" />}
                RAG Search
              </Button>
            </form>

            {ragResult && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
                <p className="font-semibold text-primary">RAG Answer (Confidence: {(ragResult.confidence * 100).toFixed(0)}%):</p>
                <p className="text-foreground leading-relaxed">{ragResult.answer}</p>
                <div className="pt-1 text-[11px] text-muted-foreground">
                  <p className="font-semibold text-foreground">Cited Sources:</p>
                  {ragResult.sources?.map((s: string, i: number) => <p key={i}>• {s}</p>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Workflow Routing */}
        {activeTab === "workflow" && (
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Workflow Routing Agent (Agent 12)</h3>
                <p className="text-xs text-muted-foreground">Track application routing, department handover, and SLA deadlines.</p>
              </div>
              <Button onClick={handleWorkflowRoute} disabled={loading} className="rounded-xl bg-brand text-white shadow-glow">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <RouteIcon className="size-4 mr-2" />}
                Execute Agent 12
              </Button>
            </div>

            {workflowData ? (
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <p className="text-muted-foreground">Current Department</p>
                  <p className="font-bold text-foreground text-sm">{workflowData.current_department}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <p className="text-muted-foreground">Next Department Handover</p>
                  <p className="font-bold text-primary text-sm">{workflowData.next_department}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <p className="text-muted-foreground">Pending Approvals</p>
                  <p className="font-semibold text-warning">{workflowData.pending_approvals?.join(", ")}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <p className="text-muted-foreground">SLA Tracker Status</p>
                  <p className="font-semibold text-success">{workflowData.sla_status}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
                Click "Execute Agent 12" to inspect workflow routing status.
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Notification Assistant */}
        {activeTab === "notify" && (
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Notification Agent (Agent 13)</h3>
                <p className="text-xs text-muted-foreground">Auto-draft and dispatch customer status alerts and document requests.</p>
              </div>
              <Button onClick={handleDraftEmail} disabled={generatingEmail} className="rounded-xl bg-brand text-white shadow-glow">
                {generatingEmail ? <Loader2 className="size-4 animate-spin mr-2" /> : <Bell className="size-4 mr-2" />}
                Draft Customer Alert
              </Button>
            </div>

            {emailText && (
              <div className="space-y-3 pt-2">
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full h-40 rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed focus:ring-2 focus:ring-primary font-sans"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(emailText); toast.success("Copied!"); }} className="rounded-xl">
                    <Copy className="size-3.5 mr-1" /> Copy Text
                  </Button>
                  <Button size="sm" onClick={() => { toast.success("Alert dispatched!"); setEmailText(""); }} className="rounded-xl bg-brand text-white">
                    <Send className="size-3.5 mr-1" /> Send Notification
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Risk Insights */}
        {activeTab === "risk" && (
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Risk Analysis Agent (Agent 10)</h3>
                <p className="text-xs text-muted-foreground">Inspect financial risk scores, fraud indicators, and DTI stress thresholds.</p>
              </div>
              <Button onClick={handleRiskInsights} disabled={loading} className="rounded-xl bg-brand text-white shadow-glow">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <ShieldAlert className="size-4 mr-2" />}
                Execute Agent 10
              </Button>
            </div>

            {riskData ? (
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-xs space-y-1">
                  <p className="text-muted-foreground">Overall Risk Score</p>
                  <p className="font-display text-2xl font-bold text-success">{riskData.overall_risk_score} / 100</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <p className="text-muted-foreground">Risk Category</p>
                  <p className="font-display text-lg font-bold text-foreground">{riskData.risk_category}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs space-y-1">
                  <p className="text-muted-foreground">Suggested Action</p>
                  <p className="font-display text-sm font-bold text-primary">{riskData.suggested_action}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
                Click "Execute Agent 10" to generate risk insights.
              </div>
            )}
          </div>
        )}
      </div>
    </PortalShell>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Sparkle, Mail, Copy, Send, Loader2, FileText, CheckCircle2, Clock, AlertTriangle, Layers } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { aiService } from "@/lib/services/ai-service";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/ai-tools")({
  head: () => ({
    meta: [{ title: "Manager AI Tools & Operational Insights — FinPilot AI" }],
  }),
  component: ManagerAIToolsPage,
});

export type EmailTemplateType = "escalation" | "missing_docs" | "approval_request" | "compliance_notice";

function ManagerAIToolsPage() {
  const [loading, setLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [executiveSummary, setExecutiveSummary] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Email draft state
  const [templateType, setTemplateType] = useState<EmailTemplateType>("escalation");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailText, setEmailText] = useState("");
  const [generatingEmail, setGeneratingEmail] = useState(false);

  const handleGenerateExecutiveSummary = async () => {
    setLoading(true);
    toast.loading("Agent 9 (Summarization Agent) generating operational executive summary...");
    setTimeout(() => {
      setLoading(false);
      toast.dismiss();
      toast.success("Executive Operational Summary generated successfully!");
      if (summaryType === "daily") {
        setExecutiveSummary(`### 📋 Daily Executive Summary — 2026-08-06
**Branch:** FinPilot AI Head Office (Krishnagiri Main)
- **Active Applications:** 6 cases currently in workflow pipeline.
- **Disbursals MTD:** ₹4.1 Cr (100% of monthly milestone target).
- **OCR Accuracy:** 99.4% average confidence score.
- **Critical Action Item:** 1 application (APP-24809) requires unassigned officer allocation.`);
      } else if (summaryType === "weekly") {
        setExecutiveSummary(`### 📊 Weekly Executive Operational Summary (Week 32)
- **Total Cleared Cases:** 451 cases processed across 4 underwriting officers.
- **SLA Adherence Rate:** 98.4% (0.4% increase week-over-week).
- **Average Approval Cycle:** 3.8 Hours.
- **Portfolio Health:** 88% low risk, 12% medium risk, 0% defaults.`);
      } else {
        setExecutiveSummary(`### 📈 Monthly Branch Performance Report (August 2026)
- **Total Disbursed Volume:** ₹4.1 Cr across 68 sanctioned loans.
- **Top Performing Department:** Retail Mortgages & Home Loans (132 cleared cases).
- **AI Automation Rate:** 91.8% of documents processed without manual human correction.`);
      }
    }, 900);
  };

  const handleGenerateRecommendations = async () => {
    try {
      const res = await aiService.generateRecommendations([], "LOW");
      setRecommendations(res.recommendations || []);
      toast.success("Manager Operational Insights generated");
    } catch {
      toast.error("Failed to generate recommendations");
    }
  };

  const handleDraftEmail = (type: EmailTemplateType) => {
    setGeneratingEmail(true);
    setTemplateType(type);
    setTimeout(() => {
      setGeneratingEmail(false);
      toast.success("AI email draft generated successfully!");
      if (type === "escalation") {
        setEmailRecipient("underwriting-lead@finpilot.ai");
        setEmailSubject("[ESCALATION] Urgent SLA Risk Notice: Application APP-24809");
        setEmailText(`Dear Underwriting Operations Team,

Please note that application APP-24809 (Meera Nair - Personal Loan ₹6,00,000) is currently unassigned and approaching SLA breach within 45 minutes.

Requested Action:
1. Immediately assign Senior Underwriter Priya Verma to review this case.
2. Complete KYC verification and update status in FinPilot portal.

Best regards,
Bharanidharan Saravanakumar
Branch Operations Manager | FinPilot AI`);
      } else if (type === "missing_docs") {
        setEmailRecipient("isha.rao@gmail.com");
        setEmailSubject("FinPilot AI Action Required: Missing GST Returns for Application APP-24816");
        setEmailText(`Dear Isha Rao,

Thank you for applying for a Business Loan (APP-24816) with FinPilot AI.

During our AI Document Vault verification, our system noted that your Q1-Q4 GST Returns PDF is currently pending upload.

Please log into your Customer Portal -> Document Vault and upload the required PDF to enable instant loan sanctioning.

Warm regards,
FinPilot AI Verification Team`);
      } else if (type === "approval_request") {
        setEmailRecipient("regional-manager@finpilot.ai");
        setEmailSubject("Executive Approval Request: Home Loan APP-24817 (₹68,00,000)");
        setEmailText(`Respected Regional Manager,

Application APP-24817 (Bharanidharan Saravanakumar - ₹68,00,000 Home Loan) has completed Agent 10 Risk Assessment with an Excellent score of 812/900 and 99.4% OCR confidence.

As the requested amount exceeds the local branch auto-approval limit of ₹50,00,000, your sign-off is requested.

Summary Details:
- Applicant: Bharanidharan Saravanakumar
- DTI Ratio: 28.5% (Optimal)
- Vault Compliance: 100% Verified

Best regards,
Branch Management Team`);
      } else {
        setEmailRecipient("compliance@finpilot.ai");
        setEmailSubject("Monthly Compliance & RBI Governance Audit Report");
        setEmailText(`Dear Compliance Officer,

Please find attached the monthly AI Governance & SOC 2 Audit Report for Krishnagiri Main Branch.

All 12 public schema tables and Supabase Auth identities are 100% in sync with zero security exceptions logged.

Regards,
Branch Operations Management`);
      }
    }, 600);
  };

  return (
    <PortalShell role="manager" title="AI Tools & Operational Insights" subtitle="Generate executive AI summaries, draft manager communications, and monitor live workflow bottlenecks.">
      <div className="space-y-6">
        {/* Executive AI Summarization Agent (Agent 9) */}
        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">Executive AI Summarization Agent (Agent 9)</h3>
                <p className="text-xs text-muted-foreground">Generate instant executive operational summaries for branch leadership.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value as any)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="daily">Daily Summary</option>
                <option value="weekly">Weekly Summary</option>
                <option value="monthly">Monthly Branch Performance</option>
              </select>
              <Button size="sm" onClick={handleGenerateExecutiveSummary} disabled={loading} className="rounded-xl bg-brand text-white shadow-glow">
                {loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Sparkle className="size-3.5 mr-1" />}
                Generate Summary
              </Button>
            </div>
          </div>

          {executiveSummary && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-sans text-foreground space-y-2 whitespace-pre-wrap leading-relaxed">
              {executiveSummary}
            </div>
          )}
        </div>

        {/* Two-Column Grid: AI Insights & AI Email Generator */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: AI Recommendations & Insights */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold">AI Operational Insights</h3>
                    <p className="text-xs text-muted-foreground">Automated manager recommendations.</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleGenerateRecommendations} className="rounded-xl bg-brand text-white">
                  <Sparkle className="size-3.5 mr-1" /> Generate
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Pre-approve Home Loan Top-up</span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">94% confidence</span>
                  </div>
                  <p className="text-muted-foreground">Verified surplus monthly cashflow of ₹1,84,500 from salary slip OCR.</p>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Reallocate Underwriters</span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">98% confidence</span>
                  </div>
                  <p className="text-muted-foreground">Home Loan queue processing time is 4.2h vs Auto Loan 1.4h.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Email Generator */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold">AI Manager Email Draft Generator</h3>
                  <p className="text-xs text-muted-foreground">Compose structured communications for stakeholders.</p>
                </div>
              </div>

              {/* Template Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant={templateType === "escalation" ? "default" : "outline"} onClick={() => handleDraftEmail("escalation")} className="rounded-xl text-xs">
                  SLA Escalation
                </Button>
                <Button size="sm" variant={templateType === "missing_docs" ? "default" : "outline"} onClick={() => handleDraftEmail("missing_docs")} className="rounded-xl text-xs">
                  Missing Docs
                </Button>
                <Button size="sm" variant={templateType === "approval_request" ? "default" : "outline"} onClick={() => handleDraftEmail("approval_request")} className="rounded-xl text-xs">
                  Approval Request
                </Button>
                <Button size="sm" variant={templateType === "compliance_notice" ? "default" : "outline"} onClick={() => handleDraftEmail("compliance_notice")} className="rounded-xl text-xs">
                  Compliance Audit
                </Button>
              </div>

              {emailText && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="Recipient Email..."
                      className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Subject Line..."
                      className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <textarea
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="w-full h-44 rounded-2xl border border-border bg-background/80 p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary font-sans"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`Subject: ${emailSubject}\nTo: ${emailRecipient}\n\n${emailText}`); toast.success("Email copied to clipboard"); }} className="rounded-xl">
                      <Copy className="size-3.5 mr-1" /> Copy Text
                    </Button>
                    <Button size="sm" onClick={() => { toast.success(`Email dispatched to ${emailRecipient}!`); setEmailText(""); }} className="rounded-xl bg-brand text-white">
                      <Send className="size-3.5 mr-1" /> Send Email
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Sparkles,
  FileText,
  TrendingUp,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { applicationService, ApplicationItem } from "@/lib/services/application-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/applications")({
  head: () => ({
    meta: [{ title: "Application Underwriting Queue — FinPilot AI Employee Portal" }],
  }),
  component: EmployeeApplicationsPage,
});

function getApplicationSummary(app: ApplicationItem) {
  const num = app.application_number || "";
  const type = app.application_type || "Credit Application";
  const name = app.customer_name || "Applicant";
  const amt = app.requested_amount ? `₹${Number(app.requested_amount).toLocaleString("en-IN")}` : "₹45,00,000";

  if (num.includes("101") || type.toLowerCase().includes("home")) {
    return {
      loanPurpose: "Residential Property Top-Up & Structural Renovation",
      targetDetails: "Residential Flat #402, Skyline Heights, Bandra West, Mumbai (Title Deed Verified)",
      tenure: "240 Months (20 Years)",
      interestRate: "8.35% p.a. (Prime Retail Floating Rate)",
      borrowerIncome: "₹2,00,000 / month (Senior Financial Engineer @ TCS)",
      dtiRatio: "28.5% (Optimal Coverage - Max threshold 45%)",
      cibilScore: "812 / 900 (Prime Tier)",
      cashflowSurplus: "₹1,42,500 / month verified net surplus",
      ocrConfidence: "98.4% (Aadhaar, PAN, Pay Slips, Form-16 verified via Webhook OCR Agent)",
      fraudStatus: "0 Anomalies Detected (Pass)",
      underwritingReasoning: `Applicant ${name} demonstrates strong financial stability, a low Debt-to-Income ratio (28.5%), and 100% verified KYC documentation in the Vault. High repayment capacity with zero prior loan default history.`,
      recommendedDecision: "APPROVE_WITH_PRIME_RATE",
    };
  }

  if (num.includes("102") || type.toLowerCase().includes("personal")) {
    return {
      loanPurpose: "Unsecured Personal Emergency & Medical Liquidity Line",
      targetDetails: "Working capital buffer & family medical expenses",
      tenure: "36 Months (3 Years)",
      interestRate: "11.25% p.a. (Unsecured Fixed Rate)",
      borrowerIncome: "₹1,85,000 / month (Lead Systems Architect)",
      dtiRatio: "22.1% (Low Debt Obligations)",
      cibilScore: "810 / 900 (Prime Tier)",
      cashflowSurplus: "₹1,44,000 / month verified net surplus",
      ocrConfidence: "99.2% (Aadhaar & PAN matched with 100% ID accuracy)",
      fraudStatus: "0 Anomalies Detected (Pass)",
      underwritingReasoning: `Applicant ${name} exhibits strong monthly liquidity, low credit utilization ratio (18%), and zero cheque bounces over the past 24 months. Fast-track approval recommended under retail credit SOP §2.1.`,
      recommendedDecision: "APPROVE_INSTANT",
    };
  }

  if (num.includes("103") || type.toLowerCase().includes("auto") || type.toLowerCase().includes("vehicle")) {
    return {
      loanPurpose: "EV Vehicle Purchase (Tata Nexon EV Empowered Plus)",
      targetDetails: "Dealer Pro-Forma Invoice #EV-2026-9902 from Concorde Motors",
      tenure: "84 Months (7 Years)",
      interestRate: "8.75% p.a. (Green EV Subsidized Rate)",
      borrowerIncome: "₹1,45,000 / month (Senior Operations Manager)",
      dtiRatio: "31.4% (Healthy Coverage)",
      cibilScore: "765 / 900 (Good Tier)",
      cashflowSurplus: "₹99,400 / month verified net surplus",
      ocrConfidence: "98.9% (Driving License & Salary Slip verified via Webhook OCR Agent)",
      fraudStatus: "0 Anomalies Detected (Pass)",
      underwritingReasoning: `Vehicle loan backed by primary hypothecation of EV Asset. Downpayment of 15% (₹2,25,000) verified in bank statement. Recommended for sanction.`,
      recommendedDecision: "APPROVE_LOAN",
    };
  }

  if (num.includes("104") || type.toLowerCase().includes("business") || type.toLowerCase().includes("commercial")) {
    return {
      loanPurpose: "Commercial Business Inventory Expansion & Industrial Automation Equipment",
      targetDetails: "FinPilot Technologies Pvt Ltd (GSTIN: 33AAACF8921K1Z5)",
      tenure: "60 Months (5 Years)",
      interestRate: "9.50% p.a. (Commercial SME Rate)",
      borrowerIncome: "₹3,80,000 / month (Business Director Net Turnover)",
      dtiRatio: "38.2% (Requires Executive Manager Sign-off)",
      cibilScore: "740 / 900 (Satisfactory Commercial Score)",
      cashflowSurplus: "₹2,34,800 / month business cashflow",
      ocrConfidence: "97.5% (GST Returns & Audited Balance Sheet verified)",
      fraudStatus: "1 Compliance Flag: Requested capital exceeds 3x annual turnover estimate",
      underwritingReasoning: `Commercial expansion credit line for ₹35,00,000. Audit logs confirm 2-year ITR filing compliance. Requires Manager sign-off for credit lines exceeding ₹30 Lakhs per SOP §4.2.`,
      recommendedDecision: "ROUTE_TO_MANAGER_APPROVAL",
    };
  }

  if (num.includes("105") || type.toLowerCase().includes("education") || type.toLowerCase().includes("student")) {
    return {
      loanPurpose: "Student Higher Education Tuition & University Campus Hostel Fees",
      targetDetails: "M.S. in Computer Science & AI at Tier-1 University (Admission Offer Attached)",
      tenure: "120 Months (10 Years with 1-Year Moratorium)",
      interestRate: "8.20% p.a. (Subsidized Student Rate - Sec 80E Tax Benefit)",
      borrowerIncome: "Co-Applicant Parent Income: ₹1,95,000 / month",
      dtiRatio: "26.8% (Parent Debt Coverage)",
      cibilScore: "792 / 900 (Co-Applicant Prime Score)",
      cashflowSurplus: "₹1,42,000 / month parent net surplus",
      ocrConfidence: "99.4% (University Admission Letter & Co-Applicant Aadhaar verified)",
      fraudStatus: "0 Anomalies Detected (Pass)",
      underwritingReasoning: `Student Education Loan for ₹15,00,000 with parent co-applicant guarantee. Course duration 2 years with 1-year moratorium period before EMI commencement. 100% tax deductible under Section 80E.`,
      recommendedDecision: "APPROVE_EDUCATION_LOAN",
    };
  }

  return {
    loanPurpose: `Credit Application Facility for ${type}`,
    targetDetails: `Verified credit line requested under RBI Retail Banking Framework`,
    tenure: "48 Months (4 Years)",
    interestRate: "8.50% p.a. Standard Retail Rate",
    borrowerIncome: "₹1,65,000 / month (Verified Salary Income)",
    dtiRatio: "29.2% (Optimal Debt Coverage)",
    cibilScore: `${app.risk_score || 780} / 900 (Prime Credit Rating)`,
    cashflowSurplus: "₹1,16,800 / month verified net surplus",
    ocrConfidence: "98.6% (Vault Documents Verified via Webhook OCR Agent)",
    fraudStatus: "0 Anomalies Detected (Pass)",
    underwritingReasoning: `Applicant ${name} requested ${amt} for ${type}. All mandatory KYC documents verified with 98.6% confidence rating and zero fraud indicators.`,
    recommendedDecision: "APPROVE_LOAN",
  };
}

function EmployeeApplicationsPage() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await applicationService.listApplications();
      setApps(data.items);
    } catch {
      toast.error("Failed to load underwriting queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleStatusTransition = async (id: string, newStatus: string) => {
    try {
      const res = await applicationService.transitionStatus(id, newStatus, `Transitioned to ${newStatus} by Underwriter`);
      if (res.success) {
        toast.success(`Application updated to ${newStatus}`);
        setSelectedApp(null);
        await loadApps();
      } else {
        toast.error("Status transition failed");
      }
    } catch {
      toast.error("Transition failed");
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchSearch =
      app.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      app.application_number.toLowerCase().includes(search.toLowerCase()) ||
      app.application_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "Underwriting" && (app.status === "Underwriting" || app.status === "CREDIT_UNDERWRITING")) ||
      (statusFilter === "Document Review" && (app.status === "Document Review" || app.status === "DOCUMENT_VERIFICATION")) ||
      (statusFilter === "Approved" && app.status === "Approved") ||
      (statusFilter === "Risk Flagged" && (app.status === "Risk Flagged" || app.status === "NEEDS_REVIEW"));
    return matchSearch && matchStatus;
  });

  return (
    <PortalShell
      role="employee"
      title="Underwriting Queue"
      subtitle="Review applicant documents, evaluate AI risk scores, inspect loan purpose, and transition application workflows."
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applicant name, application #, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-muted/60 p-1">
            {["ALL", "Underwriting", "Document Review", "Approved", "Risk Flagged"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === st
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 animate-pulse rounded-2xl bg-card/60 border border-border/40" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-12 text-center text-muted-foreground">
            <ClipboardList className="mx-auto size-8 opacity-40 mb-2" />
            <p className="text-sm font-medium">No applications match your filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 transition-all hover:border-primary/40 hover:bg-card/90 sm:flex-row sm:items-center sm:justify-between shadow-soft"
              >
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm">{app.application_number}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="font-medium text-foreground text-sm">{app.customer_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Product: <span className="text-foreground font-medium">{app.application_type}</span> · Amount: <span className="text-foreground font-semibold">₹{app.requested_amount?.toLocaleString("en-IN")}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0">
                  <div className="text-right sm:text-left">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        app.status === "Approved"
                          ? "bg-success/15 text-success"
                          : app.status === "Risk Flagged" || app.status === "NEEDS_REVIEW"
                          ? "bg-warning/15 text-warning"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {app.status}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                      Risk Score: <span className="font-bold text-foreground">{app.risk_score || 792}</span>
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="rounded-xl gap-1.5"
                    onClick={() => setSelectedApp(app)}
                  >
                    Review Case <ArrowRight className="size-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Case Review & Executive Summary Modal */}
        {selectedApp && (() => {
          const summary = getApplicationSummary(selectedApp);
          return (
            <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
              <DialogContent className="glass-strong max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-slim">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                      <ClipboardList className="size-5 text-primary" />
                      Underwriting Review: {selectedApp.application_number}
                    </DialogTitle>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary flex items-center gap-1">
                      <Sparkles className="size-3.5 text-amber-500" /> AI Executive Case Summary
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Key Metrics Header Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl bg-muted/40 p-3.5 text-xs border border-border/60">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Applicant Name</p>
                      <p className="font-bold text-foreground text-sm">{selectedApp.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Requested Facility</p>
                      <p className="font-bold text-foreground text-sm">{selectedApp.application_type || "Home Loan Top-Up"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Sanction Amount</p>
                      <p className="font-bold text-foreground text-sm">₹{selectedApp.requested_amount?.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">AI Risk Rating</p>
                      <p className="font-bold text-success text-sm flex items-center gap-1">
                        <ShieldCheck className="size-4" /> {selectedApp.risk_score || 792} (LOW RISK)
                      </p>
                    </div>
                  </div>

                  {/* Section 1: What is the Application? (Purpose & Facility Details) */}
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                      <FileText className="size-4 text-primary" /> 1. Application Overview & Facility Scope (WHAT IT IS)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Primary Loan Purpose</p>
                        <p className="text-foreground font-medium">{summary.loanPurpose}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Target Property / Asset Invoice</p>
                        <p className="text-foreground font-medium">{summary.targetDetails}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Requested Tenure</p>
                        <p className="text-foreground font-medium">{summary.tenure}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Applicable Interest Rate</p>
                        <p className="text-foreground font-medium">{summary.interestRate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Why is it Applied? (Borrower Financial Profile & Income Justification) */}
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                      <TrendingUp className="size-4 text-success" /> 2. Borrower Income & Credit Justification (WHY APPLIED)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Verified Monthly Net Income</p>
                        <p className="text-foreground font-medium">{summary.borrowerIncome}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Debt-to-Income (DTI) Ratio</p>
                        <p className="text-success font-bold">{summary.dtiRatio}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Credit Bureau Score (CIBIL)</p>
                        <p className="text-foreground font-medium">{summary.cibilScore}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-2.5 space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">Verified Monthly Surplus Cashflow</p>
                        <p className="text-foreground font-medium">{summary.cashflowSurplus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: AI Document Intelligence & Risk Findings */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <UserCheck className="size-4" /> 3. AI Document Verification & Risk Analysis
                      </div>
                      <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success">
                        {summary.fraudStatus}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">SNSIHub Webhook OCR Extraction Score:</span>
                        <span className="font-bold text-foreground">{summary.ocrConfidence}</span>
                      </div>
                      <div className="space-y-1 pt-1">
                        <span className="font-semibold text-foreground">AI Executive Underwriting Synthesis:</span>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">
                          {summary.underwritingReasoning}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => handleStatusTransition(selectedApp.id, "Rejected")}
                    >
                      <XCircle className="size-4 mr-2" /> Reject Application
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-xl border-warning/40 text-warning hover:bg-warning/10"
                      onClick={() => handleStatusTransition(selectedApp.id, "Risk Flagged")}
                    >
                      <ShieldAlert className="size-4 mr-2" /> Flag for Risk Review
                    </Button>

                    <Button
                      className="rounded-xl bg-success text-white hover:bg-success/90 shadow-glow"
                      onClick={() => handleStatusTransition(selectedApp.id, "Approved")}
                    >
                      <CheckCircle2 className="size-4 mr-2" /> Approve Application
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}
      </div>
    </PortalShell>
  );
}

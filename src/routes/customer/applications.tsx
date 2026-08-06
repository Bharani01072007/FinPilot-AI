import { createFileRoute, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Banknote,
  ChevronRight,
  Loader2,
  ShieldCheck,
  CalendarClock,
  Activity,
  Sparkles,
  UserCheck,
  Video,
  Building,
  Calendar,
  Check,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { applicationService, ApplicationItem } from "@/lib/services/application-service";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/applications")({
  head: () => ({
    meta: [{ title: "My Applications & Services — FinPilot AI Customer Portal" }],
  }),
  component: CustomerApplicationsPage,
});

type TabType = "all" | "smart-form" | "appointments" | "history";

function CustomerApplicationsPage() {
  const navigate = useNavigate();
  const searchLocation = useRouterState({ select: (s) => s.location.search });

  const activeTab: TabType = useMemo(() => {
    let rawSearch = "";
    if (typeof searchLocation === "string") {
      rawSearch = searchLocation;
    } else if (searchLocation && typeof searchLocation === "object") {
      rawSearch = (searchLocation as any).tab ? `?tab=${(searchLocation as any).tab}` : "";
    } else if (typeof window !== "undefined") {
      rawSearch = window.location.search;
    }
    const params = new URLSearchParams(rawSearch);
    const tabParam = params.get("tab") as TabType;
    if (tabParam && ["all", "smart-form", "appointments", "history"].includes(tabParam)) {
      return tabParam;
    }
    return "all";
  }, [searchLocation]);

  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Application Form State
  const [appName, setAppName] = useState("Home Loan");
  const [appAmount, setAppAmount] = useState("5000000");

  // Smart Form State
  const [sfProduct, setSfProduct] = useState("Housing Credit (Home Loan)");
  const [sfMonthlyIncome, setSfMonthlyIncome] = useState("₹2,00,000 / month (Form-16 verified)");
  const [sfPan, setSfPan] = useState("ABCDE1234F (Aadhaar Linked)");
  const [sfEmpName, setSfEmpName] = useState("Northwind Systems Pvt Ltd");
  const [sfSubmitted, setSfSubmitted] = useState(false);

  // Appointments State
  const [aptType, setAptType] = useState<"video" | "branch">("video");
  const [aptDate, setAptDate] = useState("2026-08-07");
  const [aptTime, setAptTime] = useState("11:00 AM");
  const [aptOfficer, setAptOfficer] = useState("Senior Underwriting Officer (Rajesh Sharma)");
  const [bookedApts, setBookedApts] = useState([
    {
      id: "apt-01",
      type: "Video KYC Verification",
      officer: "Rajesh Sharma (Senior Officer)",
      date: "06 Aug 2026",
      time: "10:30 AM",
      status: "CONFIRMED",
    },
    {
      id: "apt-02",
      type: "Branch Loan Agreement Sign-off",
      officer: "Priya Verma (Ops Specialist)",
      date: "12 Aug 2026",
      time: "02:00 PM",
      status: "SCHEDULED",
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await applicationService.listApplications({ search });
      setApps(data.items);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newApp = await applicationService.createApplication({
        customer_name: "Aarav Mehta",
        application_type: appName,
        requested_amount: parseFloat(appAmount) || 1000000,
      });
      if (newApp) {
        toast.success(`Application ${newApp.application_number} submitted successfully!`);
      }
      setOpenNewDialog(false);
      loadData();
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSmartFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newApp = await applicationService.createApplication({
        customer_name: "Aarav Mehta",
        application_type: sfProduct,
        requested_amount: 6500000,
      });
      setSfSubmitted(true);
      if (newApp) {
        toast.success(`AI Smart Form pre-approval generated for ${newApp.application_number}!`);
      }
      loadData();
    } catch {
      toast.error("Smart form submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newApt = {
      id: `apt-${Date.now()}`,
      type: aptType === "video" ? "1-on-1 Video KYC Call" : "Branch In-Person Consultation",
      officer: aptOfficer,
      date: new Date(aptDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: aptTime,
      status: "CONFIRMED",
    };
    setBookedApts([newApt, ...bookedApts]);
    toast.success(`Appointment confirmed for ${newApt.date} at ${newApt.time}!`);
  };

  const handleSelectApp = async (app: ApplicationItem) => {
    setSelectedApp(app);
    const hist = await applicationService.getStatusHistory(app.id);
    setHistory(hist);
  };

  return (
    <PortalShell role="customer" title="Financial Applications & Services" subtitle="Manage credit applications, AI smart form filling, officer appointments, and timeline history.">
      <div className="space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          {[
            { id: "all", label: "Applications List", icon: ClipboardList, badge: apps.length.toString() },
            { id: "smart-form", label: "Smart Form Filling", icon: Sparkles, badge: "AI" },
            { id: "appointments", label: "Appointments", icon: CalendarClock, badge: bookedApts.length.toString() },
            { id: "history", label: "Application History", icon: Activity, badge: "Timeline" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  navigate({ to: "/customer/applications", search: { tab: tab.id } as any });
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "glass hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="size-4" />
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: All Applications List */}
        {activeTab === "all" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Applications</p>
                    <p className="font-display text-2xl font-semibold">{apps.length}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-success/10 text-success">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requested Capital</p>
                    <p className="font-display text-2xl font-semibold">
                      ₹{(apps.reduce((sum, a) => sum + (a.requested_amount || 0), 0) / 100000).toFixed(1)} Lakhs
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-info/10 text-info">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vault Consent Status</p>
                    <p className="font-display text-2xl font-semibold text-success">Auto-Verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search application # or product..."
                  className="h-10 rounded-xl pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
                <DialogTrigger asChild>
                  <Button className="h-10 rounded-xl bg-brand text-white shadow-glow">
                    <Plus className="size-4 mr-2" /> Start New Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display">Submit Financial Application</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Application Type</Label>
                      <select
                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                      >
                        <optgroup label="Loans & Credit Products">
                          <option value="Home Loan (Housing Credit)">Home Loan (Housing Credit)</option>
                          <option value="Personal Loan">Personal Loan</option>
                          <option value="Vehicle Financing (Auto Loan)">Vehicle Financing (Auto Loan)</option>
                          <option value="Education Loan">Education Loan</option>
                          <option value="Gold Loan">Gold Loan</option>
                          <option value="MSME Business Credit">MSME Business Credit</option>
                          <option value="Business Expansion Loan">Business Expansion Loan</option>
                          <option value="Working Capital Line">Working Capital Line</option>
                          <option value="Loan Top-Up Request">Loan Top-Up Request</option>
                          <option value="EMI Restructuring">EMI Restructuring</option>
                          <option value="Loan Closure Request">Loan Closure Request</option>
                          <option value="Credit Card Application">Credit Card Application</option>
                        </optgroup>
                        <optgroup label="Deposit Accounts & Investments">
                          <option value="Savings Account">Savings Account</option>
                          <option value="Current Account">Current Account</option>
                          <option value="Corporate Account Opening">Corporate Account Opening</option>
                          <option value="Fixed Deposit (FD)">Fixed Deposit (FD)</option>
                          <option value="Recurring Deposit (RD)">Recurring Deposit (RD)</option>
                          <option value="Demat Account">Demat Account</option>
                          <option value="NPS Registration">NPS Registration</option>
                          <option value="Mutual Funds Investment">Mutual Funds Investment</option>
                        </optgroup>
                        <optgroup label="Banking Services & Trade">
                          <option value="KYC Information Update">KYC Information Update</option>
                          <option value="Nominee Addition / Update">Nominee Addition / Update</option>
                          <option value="Address Change Request">Address Change Request</option>
                          <option value="PAN & Aadhaar Linking">PAN & Aadhaar Linking</option>
                          <option value="Debit Card Replacement">Debit Card Replacement</option>
                          <option value="Cheque Book Request">Cheque Book Request</option>
                          <option value="Safe Deposit Locker Application">Safe Deposit Locker Application</option>
                          <option value="Trade Finance & LC Opening">Trade Finance & LC Opening</option>
                          <option value="Bank Guarantee (BG) Request">Bank Guarantee (BG) Request</option>
                          <option value="UPI & FASTag Registration">UPI & FASTag Registration</option>
                          <option value="Insurance Products (Life & Health)">Insurance Products (Life & Health)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Requested Amount (INR)</Label>
                      <Input
                        type="number"
                        value={appAmount}
                        onChange={(e) => setAppAmount(e.target.value)}
                        className="h-10 rounded-xl"
                      />
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Fast-Track AI Underwriting:</p>
                      Documents saved in your Vault (PAN, Aadhaar, Form 16) will be attached automatically.
                    </div>

                    <Button type="submit" className="w-full h-10 rounded-xl bg-brand text-white" disabled={submitting}>
                      {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : "Submit Application"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {apps.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectApp(app)}
                    className="group glass flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-all hover:border-primary/40 hover:shadow-soft"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-foreground">{app.application_number}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {app.application_type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Requested: <span className="font-medium text-foreground">₹{app.requested_amount?.toLocaleString("en-IN")}</span> · Submitted: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            app.status === "Approved"
                              ? "bg-success/15 text-success"
                              : app.status === "Risk Flagged"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-warning/15 text-warning"
                          }`}
                        >
                          {app.status === "Approved" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                          {app.status}
                        </span>
                        <p className="mt-1 text-[11px] text-muted-foreground">Risk Score: {app.risk_score || 800}</p>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Smart Form Filling */}
        {activeTab === "smart-form" && (
          <div className="glass-strong rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                  <Sparkles className="size-3.5" /> Vault AI Smart Form Pre-fill
                </span>
                <h3 className="font-display text-xl font-semibold mt-1">1-Click Loan Application Form</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  FinPilot AI extracts verified identity and financial fields directly from your Secure Document Vault.
                </p>
              </div>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> 4 Documents Attached
              </span>
            </div>

            {sfSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="size-14 mx-auto grid place-items-center rounded-2xl bg-success/15 text-success">
                  <Check className="size-8" />
                </div>
                <h3 className="font-display text-2xl font-semibold">Application Submitted & Pre-Approved!</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your AI Smart Form was processed with 98.6% document confidence rating. Your application is now in the fast-track underwriting queue.
                </p>
                <Button onClick={() => setSfSubmitted(false)} variant="outline" className="rounded-xl mt-2">
                  Submit Another Smart Form
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSmartFormSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Select Product Type</Label>
                    <select
                      className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium focus:ring-2 focus:ring-primary"
                      value={sfProduct}
                      onChange={(e) => setSfProduct(e.target.value)}
                    >
                      <optgroup label="Loans & Credit Products">
                        <option value="Home Loan (Housing Credit)">Home Loan (Housing Credit)</option>
                        <option value="Personal Loan">Personal Loan</option>
                        <option value="Vehicle Financing (Auto Loan)">Vehicle Financing (Auto Loan)</option>
                        <option value="Education Loan">Education Loan</option>
                        <option value="Gold Loan">Gold Loan</option>
                        <option value="MSME Business Credit">MSME Business Credit</option>
                        <option value="Business Expansion Loan">Business Expansion Loan</option>
                        <option value="Working Capital Line">Working Capital Line</option>
                        <option value="Loan Top-Up Request">Loan Top-Up Request</option>
                        <option value="EMI Restructuring">EMI Restructuring</option>
                        <option value="Loan Closure Request">Loan Closure Request</option>
                        <option value="Credit Card Application">Credit Card Application</option>
                      </optgroup>
                      <optgroup label="Deposit Accounts & Investments">
                        <option value="Savings Account">Savings Account</option>
                        <option value="Current Account">Current Account</option>
                        <option value="Corporate Account Opening">Corporate Account Opening</option>
                        <option value="Fixed Deposit (FD)">Fixed Deposit (FD)</option>
                        <option value="Recurring Deposit (RD)">Recurring Deposit (RD)</option>
                        <option value="Demat Account">Demat Account</option>
                        <option value="NPS Registration">NPS Registration</option>
                        <option value="Mutual Funds Investment">Mutual Funds Investment</option>
                      </optgroup>
                      <optgroup label="Banking Services & Trade">
                        <option value="KYC Information Update">KYC Information Update</option>
                        <option value="Nominee Addition / Update">Nominee Addition / Update</option>
                        <option value="Address Change Request">Address Change Request</option>
                        <option value="PAN & Aadhaar Linking">PAN & Aadhaar Linking</option>
                        <option value="Debit Card Replacement">Debit Card Replacement</option>
                        <option value="Cheque Book Request">Cheque Book Request</option>
                        <option value="Safe Deposit Locker Application">Safe Deposit Locker Application</option>
                        <option value="Trade Finance & LC Opening">Trade Finance & LC Opening</option>
                        <option value="Bank Guarantee (BG) Request">Bank Guarantee (BG) Request</option>
                        <option value="UPI & FASTag Registration">UPI & FASTag Registration</option>
                        <option value="Insurance Products (Life & Health)">Insurance Products (Life & Health)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Verified Monthly Net Income (Form 16)</Label>
                    <div className="relative">
                      <Input value={sfMonthlyIncome} onChange={(e) => setSfMonthlyIncome(e.target.value)} className="h-11 rounded-xl pr-10" />
                      <CheckCircle2 className="absolute right-3 top-3.5 size-4 text-success" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">PAN & Aadhaar Identity Reference</Label>
                    <div className="relative">
                      <Input value={sfPan} onChange={(e) => setSfPan(e.target.value)} className="h-11 rounded-xl pr-10" />
                      <CheckCircle2 className="absolute right-3 top-3.5 size-4 text-success" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Verified Employer Name</Label>
                    <div className="relative">
                      <Input value={sfEmpName} onChange={(e) => setSfEmpName(e.target.value)} className="h-11 rounded-xl pr-10" />
                      <CheckCircle2 className="absolute right-3 top-3.5 size-4 text-success" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">AI Pre-Approval Score: 890 / 900</p>
                      <p className="text-[11px] text-muted-foreground">DTI Ratio: 28.4% · Zero missing mandatory documents</p>
                    </div>
                  </div>
                  <Button type="submit" className="h-11 rounded-xl bg-brand text-white shadow-glow px-6" disabled={submitting}>
                    {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : "Submit Pre-Filled Application"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Appointments */}
        {activeTab === "appointments" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Booking Form (Left 6 cols) */}
            <div className="lg:col-span-6 glass-strong rounded-3xl p-6 space-y-5">
              <div className="border-b border-border/60 pb-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                  <CalendarClock className="size-3.5" /> Book Consultation
                </span>
                <h3 className="font-display text-xl font-semibold mt-1">Schedule Officer Meeting</h3>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Appointment Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAptType("video")}
                      className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-semibold border transition-all ${
                        aptType === "video" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      <Video className="size-4" /> 1-on-1 Video Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setAptType("branch")}
                      className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-semibold border transition-all ${
                        aptType === "branch" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      <Building className="size-4" /> Branch Visit
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Officer / Specialist</Label>
                  <select
                    value={aptOfficer}
                    onChange={(e) => setAptOfficer(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option>Senior Underwriting Officer (Rajesh Sharma)</option>
                    <option>KYC Compliance Manager (Priya Verma)</option>
                    <option>Branch Manager (Daniel Cole)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={aptDate} onChange={(e) => setAptDate(e.target.value)} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Slot</Label>
                    <select
                      value={aptTime}
                      onChange={(e) => setAptTime(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:ring-2 focus:ring-primary"
                    >
                      <option>10:00 AM</option>
                      <option>11:30 AM</option>
                      <option>02:00 PM</option>
                      <option>04:30 PM</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 rounded-xl bg-brand text-white shadow-glow">
                  Confirm Appointment Booking
                </Button>
              </form>
            </div>

            {/* Scheduled List (Right 6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Upcoming Scheduled Meetings ({bookedApts.length})
              </h3>
              <div className="space-y-3">
                {bookedApts.map((apt) => (
                  <div key={apt.id} className="glass flex items-center justify-between rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Calendar className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{apt.type}</p>
                        <p className="text-xs text-muted-foreground">{apt.officer}</p>
                        <p className="text-[11px] font-medium text-primary mt-0.5">
                          {apt.date} · {apt.time}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-success">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Application History Timeline */}
        {activeTab === "history" && (
          <div className="glass-strong rounded-3xl p-6 space-y-6">
            <div className="border-b border-border/60 pb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                <Activity className="size-3.5" /> Full Audit Trail
              </span>
              <h3 className="font-display text-xl font-semibold mt-1">Application State History</h3>
            </div>

            <div className="relative border-l border-border/80 pl-6 space-y-6">
              {[
                {
                  title: "Home Loan APP-24817 Pre-Approved",
                  desc: "Automated underwriting decision engine completed risk evaluation. Score: 890 / 900.",
                  date: "Today at 02:15 PM",
                  actor: "AI Engine",
                  type: "APPROVAL",
                },
                {
                  title: "Document Vault Verification Completed",
                  desc: "Aadhaar e-KYC, PAN verification, and Form-16 income validation passed with zero discrepancies.",
                  date: "Yesterday at 11:30 AM",
                  actor: "KYC Agent",
                  type: "VERIFIED",
                },
                {
                  title: "Business Loan APP-24816 Underwriting Review",
                  desc: "Case assigned to Senior Underwriting Officer for manual cashflow verification.",
                  date: "02 Aug 2026",
                  actor: "Ops Officer",
                  type: "REVIEW",
                },
                {
                  title: "Initial Application Submission (APP-24804)",
                  desc: "Working Capital line application created via Customer Portal.",
                  date: "28 Jul 2026",
                  actor: "Aarav Mehta",
                  type: "SUBMITTED",
                },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-1 size-3.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <span className="text-[11px] text-muted-foreground">{item.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  <p className="text-[11px] font-medium text-primary mt-1">Actor: {item.actor}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Application Details Modal */}
        <AnimatePresence>
          {selectedApp && (
            <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
              <DialogContent className="glass-strong max-w-xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    Application Details: {selectedApp.application_number}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Product Type</p>
                      <p className="font-semibold text-foreground">{selectedApp.application_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold text-foreground">₹{selectedApp.requested_amount?.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Stage</p>
                      <p className="font-semibold text-primary">{selectedApp.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Underwriting Score</p>
                      <p className="font-semibold text-success">{selectedApp.risk_score} / 900</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-semibold mb-3">Status Audit Timeline</h4>
                    <div className="relative border-l border-border pl-4 space-y-4">
                      {history.map((item, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                          <p className="text-xs font-semibold text-foreground">{item.status}</p>
                          <p className="text-[11px] text-muted-foreground">{item.remarks}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </PortalShell>
  );
}

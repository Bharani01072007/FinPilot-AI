import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  Banknote,
  ChevronRight,
  Loader2,
  ShieldCheck,
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
    meta: [{ title: "My Applications — FinPilot AI Customer Portal" }],
  }),
  component: CustomerApplicationsPage,
});

function CustomerApplicationsPage() {
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
      toast.success(`Application ${newApp.application_number} submitted successfully!`);
      setOpenNewDialog(false);
      loadData();
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectApp = async (app: ApplicationItem) => {
    setSelectedApp(app);
    const hist = await applicationService.getStatusHistory(app.id);
    setHistory(hist);
  };

  return (
    <PortalShell role="customer" title="Financial Applications" subtitle="Track real-time underwriting progress and submit new credit applications.">
      <div className="space-y-6">
        {/* Top Summary Bar */}
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

        {/* Filter & Action Toolbar */}
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
                    <option value="Home Loan">Home Loan (Housing Credit)</option>
                    <option value="Business Loan">Business Expansion Loan</option>
                    <option value="Auto Loan">Vehicle Financing</option>
                    <option value="Working Capital">Working Capital Line</option>
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

        {/* Applications List */}
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

        {/* Selected Application Modal */}
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

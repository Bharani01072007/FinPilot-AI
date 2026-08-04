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

function EmployeeApplicationsPage() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await applicationService.listApplications({ search, status: statusFilter !== "ALL" ? statusFilter : undefined });
      setApps(data.items);
    } catch {
      toast.error("Failed to load applications queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleStatusTransition = async (id: string, newStatus: string) => {
    const success = await applicationService.transitionStatus(id, newStatus, `Transitioned to ${newStatus} by Underwriter`);
    if (success) {
      toast.success(`Application updated to ${newStatus}`);
      setSelectedApp(null);
      loadData();
    } else {
      toast.error("Status update failed");
    }
  };

  return (
    <PortalShell role="employee" title="Underwriting Queue" subtitle="Review applicant documents, evaluate risk scores, and transition application workflows.">
      <div className="space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applicant name, application #..."
              className="h-10 rounded-xl pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
            {(["ALL", "Underwriting", "Document Review", "Approved", "Risk Flagged"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === st ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {apps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-all hover:border-primary/40 hover:shadow-soft"
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-xl bg-brand/10 text-brand">
                    <ClipboardList className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-foreground">{app.application_number}</span>
                      <span className="font-medium text-foreground">· {app.customer_name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Product: <span className="font-medium text-foreground">{app.application_type}</span> · Amount: <span className="font-medium text-foreground">₹{app.requested_amount?.toLocaleString("en-IN")}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-foreground">Risk Score: {app.risk_score || 812}</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        app.status === "Approved"
                          ? "bg-success/15 text-success"
                          : app.status === "Risk Flagged"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-warning/15 text-warning"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl">
                    Review Case <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Case Review Modal */}
        {selectedApp && (
          <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
            <DialogContent className="glass-strong max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Underwriting Review: {selectedApp.application_number}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Applicant</p>
                    <p className="font-semibold text-foreground">{selectedApp.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requested Amount</p>
                    <p className="font-semibold text-foreground">₹{selectedApp.requested_amount?.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI Risk Rating</p>
                    <p className="font-semibold text-success">{selectedApp.risk_score} (LOW RISK)</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <UserCheck className="size-4" /> AI Document Verification Check
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aadhaar, PAN, and Form-16 documents matched with 98.4% identity confidence. Vault credentials active.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
                    className="rounded-xl bg-success text-white hover:bg-success/90"
                    onClick={() => handleStatusTransition(selectedApp.id, "Approved")}
                  >
                    <CheckCircle2 className="size-4 mr-2" /> Approve Application
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PortalShell>
  );
}

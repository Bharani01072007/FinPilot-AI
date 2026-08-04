import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ShieldCheck, Zap, Loader2, Award, ChevronRight } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { applicationService, ApplicationItem } from "@/lib/services/application-service";
import { aiService } from "@/lib/services/ai-service";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/approvals")({
  head: () => ({
    meta: [{ title: "Executive Approval Queue — FinPilot AI Manager Portal" }],
  }),
  component: ManagerApprovalsPage,
});

function ManagerApprovalsPage() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingWorkflow, setExecutingWorkflow] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await applicationService.listApplications();
      setApps(data.items.filter((a) => a.requested_amount > 2000000 || a.status === "Underwriting"));
    } catch {
      toast.error("Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    await applicationService.transitionStatus(id, "Approved", "Executive Manager Sign-off Approved");
    toast.success("Application approved with manager sign-off");
    loadData();
  };

  const handleReject = async (id: string) => {
    await applicationService.transitionStatus(id, "Rejected", "Executive Manager Declined");
    toast.info("Application rejected");
    loadData();
  };

  const handleTriggerFullOrchestration = async (appId: string) => {
    setExecutingWorkflow(true);
    try {
      await aiService.executeWorkflow("FULL_ONBOARDING_WORKFLOW", appId);
      toast.success(`Multi-Agent Orchestration (KYC + Risk + Recommendation) executed for ${appId}`);
      loadData();
    } catch {
      toast.error("Orchestration pipeline failed");
    } finally {
      setExecutingWorkflow(false);
    }
  };

  return (
    <PortalShell role="manager" title="Executive Approval Queue" subtitle="Sign off on high-value loan requests, review risk flags, and trigger multi-agent AI orchestration.">
      <div className="space-y-6">
        {/* Top Metric Header */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Pending Manager Sign-offs</p>
            <p className="font-display text-2xl font-bold text-primary">{apps.length}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Total Pending Portfolio Value</p>
            <p className="font-display text-2xl font-bold text-foreground">
              ₹{(apps.reduce((sum, a) => sum + (a.requested_amount || 0), 0) / 10000000).toFixed(2)} Cr
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">AI Automation Rate</p>
            <p className="font-display text-2xl font-bold text-success">94.2%</p>
          </div>
        </div>

        {/* Approval Items */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-foreground">{app.application_number}</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {app.application_type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applicant: <span className="font-semibold text-foreground">{app.customer_name}</span> · Amount: <span className="font-semibold text-foreground">₹{app.requested_amount?.toLocaleString("en-IN")}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="font-semibold text-success">Risk Score: {app.risk_score || 812} (Low)</span>
                    <span className="text-muted-foreground">· Underwriting Officer: Priya Verma</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTriggerFullOrchestration(app.id)}
                    disabled={executingWorkflow}
                    className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {executingWorkflow ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Zap className="size-3.5 mr-1" />}
                    Run AI Orchestration
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(app.id)}
                    className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="size-3.5 mr-1" /> Reject
                  </Button>

                  <Button size="sm" onClick={() => handleApprove(app.id)} className="rounded-xl bg-success text-white">
                    <CheckCircle2 className="size-3.5 mr-1" /> Executive Sign-off
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

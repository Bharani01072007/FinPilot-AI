import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sliders, Shield, Bot, Save } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/settings")({
  head: () => ({
    meta: [{ title: "System & AI Platform Settings — FinPilot AI Manager Portal" }],
  }),
  component: ManagerSettingsPage,
});

function ManagerSettingsPage() {
  const [ocrThreshold, setOcrThreshold] = useState("95");
  const [maxAutoApprove, setMaxAutoApprove] = useState("500000");
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("AI Platform Configuration saved successfully!");
    }, 800);
  };

  return (
    <PortalShell role="manager" title="System & AI Platform Configuration" subtitle="Configure AI decision confidence thresholds, automated approval limits, and security parameters.">
      <div className="mx-auto max-w-3xl space-y-6">
        <form onSubmit={handleSave} className="glass rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <Bot className="size-6 text-primary" />
            <div>
              <h3 className="font-display text-lg font-semibold">AI Agent Confidence Thresholds</h3>
              <p className="text-xs text-muted-foreground">Set mandatory confidence limits for automated OCR & KYC decisions.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Minimum OCR Confidence Threshold (%)</Label>
              <Input
                type="number"
                value={ocrThreshold}
                onChange={(e) => setOcrThreshold(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Documents below this confidence rating trigger mandatory human officer review.</p>
            </div>

            <div className="space-y-2">
              <Label>Max Auto-Approval Limit (INR)</Label>
              <Input
                type="number"
                value={maxAutoApprove}
                onChange={(e) => setMaxAutoApprove(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Applications requesting amounts above this ceiling require manager sign-off.</p>
            </div>
          </div>

          <Button type="submit" className="h-11 rounded-xl bg-brand text-white shadow-glow" disabled={saving}>
            <Save className="size-4 mr-2" />
            {saving ? "Saving Configuration..." : "Save AI Platform Settings"}
          </Button>
        </form>
      </div>
    </PortalShell>
  );
}

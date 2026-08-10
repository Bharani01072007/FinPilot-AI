import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sliders, Shield, Bot, Save, Server, Globe, Lock, Database, Key } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Executive Settings — FinPilot AI Admin Portal" }],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [ocrThreshold, setOcrThreshold] = useState("95");
  const [maxAutoApprove, setMaxAutoApprove] = useState("500000");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [jwtExpiry, setJwtExpiry] = useState("60");
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Executive system configuration saved successfully!");
    }, 800);
  };

  return (
    <PortalShell role="admin" title="Executive Settings" subtitle="Platform-wide AI thresholds, security policies, authentication parameters, and system governance controls.">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* AI Agent Configuration */}
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

          {/* Security Configuration */}
          <div className="flex items-center gap-3 border-b border-border/60 pb-4 pt-4">
            <Shield className="size-6 text-amber-500" />
            <div>
              <h3 className="font-display text-lg font-semibold">Security & Authentication Policy</h3>
              <p className="text-xs text-muted-foreground">Platform-wide authentication enforcement and session security controls.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Key className="size-3.5 text-muted-foreground" /> JWT Token Expiry (minutes)</Label>
              <Input
                type="number"
                value={jwtExpiry}
                onChange={(e) => setJwtExpiry(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Access tokens expire after this duration. Refresh tokens rotate automatically.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Lock className="size-3.5 text-muted-foreground" /> Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Inactive sessions are automatically terminated after this period.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Shield className="size-3.5 text-muted-foreground" /> Max Login Attempts Before Lockout</Label>
              <Input
                type="number"
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Accounts are temporarily locked after exceeding this number of failed login attempts.</p>
            </div>
          </div>

          <Button type="submit" className="h-11 rounded-xl bg-brand text-white shadow-glow w-full" disabled={saving}>
            <Save className="size-4 mr-2" />
            {saving ? "Saving Executive Configuration..." : "Save Executive Settings"}
          </Button>
        </form>
      </div>
    </PortalShell>
  );
}

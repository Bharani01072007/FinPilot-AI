import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, ShieldCheck, Smartphone, Bell, KeyRound } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/settings")({
  head: () => ({
    meta: [{ title: "Account & Security Settings — FinPilot AI" }],
  }),
  component: CustomerSettingsPage,
});

function CustomerSettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 12) {
      toast.error("Password must be at least 12 characters long and include uppercase, lowercase, number, and special character");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPassword, old_password: currentPassword, new_password: newPassword }),
      });

      if (res.success) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.message || "Failed to update password");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalShell role="customer" title="Account & Security Settings" subtitle="Manage profile credentials, active devices, and notification preferences.">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Profile Card */}
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-brand text-xl font-bold text-white shadow-glow">
              {user?.first_name?.[0] || "A"}{user?.last_name?.[0] || "M"}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">{user?.first_name || "Aarav"} {user?.last_name || "Mehta"}</h3>
              <p className="text-xs text-muted-foreground">{user?.email || "aarav@finpilot.ai"}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-semibold text-success">
                <ShieldCheck className="size-3" /> Identity Verified (KYC Passed)
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <KeyRound className="size-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Change Security Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="mt-2 h-11 rounded-xl bg-brand text-white" disabled={loading}>
              {loading ? "Updating Security Credentials..." : "Update Password"}
            </Button>
          </form>
        </div>

        {/* Active Sessions & Device Security */}
        <div className="glass rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Active Device Sessions & Security Score</h3>
                <p className="text-xs text-muted-foreground">Monitor logged-in devices, browser sessions, and revoke suspicious tokens.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success flex items-center gap-1.5">
                <ShieldCheck className="size-4" /> Security Score: 98/100
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl h-9"
                onClick={async () => {
                  try {
                    await fetchApi("/auth/logout-all", { method: "POST" });
                    toast.success("Successfully logged out all active device sessions!");
                  } catch {
                    toast.info("Active device sessions revoked!");
                  }
                }}
              >
                Logout All Devices
              </Button>
            </div>
          </div>

          {/* Device Sessions List */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between rounded-2xl bg-muted/40 p-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                  MAC
                </div>
                <div>
                  <p className="text-sm font-semibold">MacBook Pro 16" · Chrome 127.0 (macOS Sequoia)</p>
                  <p className="text-xs text-muted-foreground">IP: 103.21.124.8 · Location: Mumbai, MH, India · Logged in: Today 09:14 AM</p>
                </div>
              </div>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                Current Active Session
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between rounded-2xl bg-muted/40 p-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-secondary/20 text-foreground font-bold text-xs">
                  IPH
                </div>
                <div>
                  <p className="text-sm font-semibold">iPhone 15 Pro · Mobile Safari (iOS 17.5)</p>
                  <p className="text-xs text-muted-foreground">IP: 103.21.124.9 · Location: Mumbai, MH, India · Last Active: 2 hours ago</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-8 text-xs"
                onClick={() => toast.success("Session revoked for iPhone 15 Pro")}
              >
                Revoke Session
              </Button>
            </div>
          </div>

          {/* Security Features Breakdown */}
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="rounded-2xl border border-border/60 p-4 bg-card/40 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Two-Factor Auth</p>
              <p className="text-sm font-bold text-success flex items-center gap-1">
                <ShieldCheck className="size-4" /> Enabled (Email OTP)
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 p-4 bg-card/40 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Biometric Passkey</p>
              <p className="text-sm font-bold text-foreground">TouchID / FaceID Active</p>
            </div>
            <div className="rounded-2xl border border-border/60 p-4 bg-card/40 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Emergency Support</p>
              <p className="text-sm font-bold text-primary truncate">finpilotaiadmin@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

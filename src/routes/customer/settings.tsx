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
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
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

        {/* Active Sessions */}
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="size-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Active Device Sessions</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
              <div>
                <p className="text-sm font-semibold">MacBook Pro · Chrome browser</p>
                <p className="text-xs text-muted-foreground">Mumbai, India · Active current session</p>
              </div>
              <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">Active</span>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, UserPlus, Search, Shield, Lock, Unlock, ShieldAlert, KeyRound, CheckCircle2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { userService, UserAccountItem } from "@/lib/services/user-service";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/users")({
  head: () => ({
    meta: [{ title: "User & Role Management — FinPilot AI Manager Portal" }],
  }),
  component: ManagerUsersPage,
});

function ManagerUsersPage() {
  const [users, setUsers] = useState<UserAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  // New user form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleName, setRoleName] = useState("Employee");
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.listUsers({ search });
      setUsers(data);
    } catch {
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userService.createUser({ email, first_name: firstName, last_name: lastName, role_name: roleName });
      toast.success(`User ${email} created successfully!`);
      setOpenCreate(false);
      loadUsers();
    } catch {
      toast.error("Failed to create user account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserAccountItem) => {
    const success = await userService.toggleActiveStatus(user.id, !user.is_active);
    if (success) {
      toast.success(`User status updated for ${user.email}`);
      loadUsers();
    } else {
      toast.error("Failed to update user status");
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    await userService.revokeAllSessions(userId);
    toast.info("All active sessions revoked for target user");
  };

  return (
    <PortalShell role="manager" title="User & Role Management" subtitle="Manage enterprise staff accounts, assign security roles, and enforce active session revocations.">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search user name or email address..."
              className="h-10 rounded-xl pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl bg-brand text-white shadow-glow">
                <UserPlus className="size-4 mr-2" /> Add Staff / User Account
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Create System User</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>First Name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-xl" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-xl" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Work Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl" required />
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned Security Role</Label>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Employee">Employee (Underwriter / Ops)</option>
                    <option value="Manager">Manager (Executive Approver)</option>
                    <option value="Admin">Tenant Admin</option>
                  </select>
                </div>

                <Button type="submit" className="w-full h-10 rounded-xl bg-brand text-white" disabled={submitting}>
                  {submitting ? "Creating Account..." : "Provision User Account"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl overflow-hidden border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{u.first_name} {u.last_name}</p>
                      <p className="text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-0.5 font-semibold ${
                        u.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      }`}>
                        {u.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{u.created_at}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(u)} className="rounded-xl">
                        {u.is_active ? <Lock className="size-3.5 text-warning" /> : <Unlock className="size-3.5 text-success" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRevokeSessions(u.id)} className="rounded-xl text-destructive" title="Revoke Sessions">
                        <KeyRound className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

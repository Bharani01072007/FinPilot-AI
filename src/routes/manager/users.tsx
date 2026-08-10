import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, UserPlus, Search, Shield, Lock, Unlock, ShieldAlert, KeyRound, CheckCircle2, Trash2, Building, Briefcase, Phone, Mail } from "lucide-react";
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
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [openCreate, setOpenCreate] = useState(false);

  // New user form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [branch, setBranch] = useState("Krishnagiri Main");
  const [department, setDepartment] = useState("Retail Underwriting");
  const [roleName, setRoleName] = useState("Employee");
  const [password, setPassword] = useState("Password123!");
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.listUsers({ search, role: roleFilter !== "ALL" ? roleFilter : undefined });
      setUsers(data);
    } catch {
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading(`Provisioning employee account for ${email}...`);
    try {
      await userService.createUser({
        email,
        first_name: firstName,
        last_name: lastName,
        gender,
        phone,
        employee_id: employeeId,
        branch,
        department,
        role_name: "Employee",
        password,
      });
      toast.success(`Employee account ${email} provisioned in Database! Credentials active for immediate login.`, { id: toastId });
      setOpenCreate(false);
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setEmployeeId("");
      setGender("Male");
      loadUsers();
    } catch {
      toast.error("Failed to create user account", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserAccountItem) => {
    const success = await userService.toggleActiveStatus(user.id, !user.is_active);
    if (success) {
      toast.success(`Account ${user.is_active ? "DEACTIVATED" : "ACTIVATED"} for ${user.email}`);
      loadUsers();
    } else {
      toast.error("Failed to update user status");
    }
  };

  const handleToggleLock = async (user: UserAccountItem) => {
    const success = await userService.toggleLockStatus(user.id, !user.is_locked);
    if (success) {
      toast.success(`Account ${user.is_locked ? "UNLOCKED" : "LOCKED"} for ${user.email}`);
      loadUsers();
    } else {
      toast.error("Failed to update lock status");
    }
  };

  const handleResetPassword = async (user: UserAccountItem) => {
    await userService.resetPassword(user.id);
    toast.info(`Password reset link dispatched to ${user.email}`);
  };

  const handleDeleteUser = async (user: UserAccountItem) => {
    if (confirm(`Are you sure you want to delete account for ${user.full_name}?`)) {
      await userService.deleteUser(user.id);
      toast.success(`User account ${user.email} removed.`);
      loadUsers();
    }
  };

  return (
    <PortalShell role="manager" title="Enterprise User & Role Management" subtitle="Provision staff accounts, assign granular governance roles, and manage authentication lockouts.">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email or employee ID..."
                className="h-10 rounded-xl pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Roles</option>
              <option value="Customer">Customer</option>
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* User Provisioning Modal */}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl bg-brand text-white shadow-glow">
                <UserPlus className="size-4 mr-2" /> Create User / Staff Account
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-lg">Provision Enterprise User Account</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name *</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Rahul" className="h-9 rounded-xl" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name *</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Sharma" className="h-9 rounded-xl" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gender *</Label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Work Email *</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@finpilot.ai" className="h-9 rounded-xl" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mobile Number</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-9876543210" className="h-9 rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employee ID / Staff Code</Label>
                    <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-20268" className="h-9 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Assigned Branch</Label>
                    <Input value={branch} onChange={(e) => setBranch(e.target.value)} className="h-9 rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Retail Underwriting">Retail Underwriting</option>
                      <option value="SME & Corporate Credit">SME & Corporate Credit</option>
                      <option value="Risk & Compliance">Risk & Compliance</option>
                      <option value="Branch Operations">Branch Operations</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Security Role *</Label>
                    <select
                      value="Employee"
                      disabled
                      className="w-full h-9 rounded-xl border border-border bg-muted px-3 text-xs font-semibold"
                    >
                      <option value="Employee">Employee (Loan Officer / Ops)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Initial Login Password *</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 rounded-xl font-mono" required />
                  <p className="text-[11px] text-muted-foreground">Credentials active immediately upon creation.</p>
                </div>

                <Button type="submit" className="w-full h-10 rounded-xl bg-brand text-white shadow-glow" disabled={submitting}>
                  {submitting ? "Provisioning Account..." : "Provision & Activate User Account"}
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
                  <th className="p-4">User & Employee Details</th>
                  <th className="p-4">Role & Dept</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{u.full_name}</p>
                      <p className="text-muted-foreground">{u.email} {u.phone ? `· ${u.phone}` : ""}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{u.employee_id || u.id}</p>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                        {u.role}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-1">{u.department || "Retail Banking"}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-self-start rounded-full px-2.5 py-0.5 font-semibold text-[10px] ${
                          u.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}>
                          {u.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                        {u.is_locked && (
                          <span className="rounded-full bg-warning/15 px-2.5 py-0.5 font-semibold text-[10px] text-warning">
                            LOCKED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{u.created_at}</td>
                    <td className="p-4 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(u)} className="h-8 rounded-lg text-xs" title={u.is_active ? "Deactivate User" : "Activate User"}>
                        {u.is_active ? <Lock className="size-3.5 text-warning" /> : <Unlock className="size-3.5 text-success" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggleLock(u)} className="h-8 rounded-lg text-xs text-warning" title={u.is_locked ? "Unlock Account" : "Lock Account"}>
                        <ShieldAlert className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleResetPassword(u)} className="h-8 rounded-lg text-xs text-primary" title="Reset Password">
                        <KeyRound className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u)} className="h-8 rounded-lg text-xs text-destructive hover:bg-destructive/10" title="Delete User">
                        <Trash2 className="size-3.5" />
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

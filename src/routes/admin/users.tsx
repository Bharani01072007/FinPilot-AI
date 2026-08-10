import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Users, UserPlus, ShieldCheck, Search, Filter, Loader2, CheckCircle2, Lock, Building2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, SectionTitle, StatusPill } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userService, type UserAccountItem } from "@/lib/services/user-service";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Provisioning & Directory · FinPilot AI Admin" },
      { name: "description", content: "Admin user provisioning portal for Managers, Employees, and Customers." },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserAccountItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showPassword, setShowPassword] = useState(false);

  // Create User Form State
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [roleName, setRoleName] = useState("Manager");

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await userService.listUsers({ search: search || undefined });
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const ok = await userService.createUser({
        email,
        first_name: firstName,
        last_name: lastName,
        gender,
        password,
        role_name: roleName,
      });

      if (ok) {
        toast.success(`Account for ${firstName} ${lastName} (${roleName}) provisioned successfully in Database!`);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("Password123!");
        setGender("Male");
        setRoleName("Manager");
        setCreateOpen(false);
        await loadUsers();
      } else {
        toast.error("Failed to create account. Email may already exist.");
      }
    } catch {
      toast.error("Account provisioning error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (u: UserAccountItem) => {
    const newPass = prompt(`Enter new password for ${u.full_name} (${u.email}):`, "Password123!");
    if (newPass) {
      await userService.updateUserPassword(u.id, newPass);
      toast.success(`Password updated for ${u.email}`);
      loadUsers();
    }
  };

  const handleDeleteUser = async (u: UserAccountItem) => {
    if (confirm(`Are you sure you want to remove login credentials for ${u.full_name} (${u.email})?`)) {
      await userService.deleteUser(u.id);
      toast.success(`User credentials for ${u.email} removed from Database.`);
      loadUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === "ALL") return true;
    return u.role.toLowerCase() === roleFilter.toLowerCase();
  });

  return (
    <PortalShell
      role="admin"
      title="User Provisioning & Directory"
      subtitle="System Administrator User Management & Role Hierarchy Portal"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search user by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                suppressHydrationWarning
                className="pl-9 rounded-xl border-border/80 bg-background/80"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger suppressHydrationWarning className="w-[160px] rounded-xl border-border/80 bg-background/80">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Customer">Customer</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setCreateOpen((o) => !o)}
            suppressHydrationWarning
            className="rounded-xl bg-brand text-white font-semibold shadow-glow"
          >
            <UserPlus className="size-4 mr-2" />
            {createOpen ? "Close Form" : "Provision New User"}
          </Button>
        </div>

        {/* Provisioning Form Container */}
        {createOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassPanel className="p-6 border-primary/30" hover={false}>
              <SectionTitle
                title="Provision New Account (Database Linked)"
                action={<StatusPill tone="warning">Admin Role Assignment</StatusPill>}
              />

              <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-semibold">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Vishnupriya"
                      suppressHydrationWarning
                      className="rounded-xl bg-background/90"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. A"
                      suppressHydrationWarning
                      className="rounded-xl bg-background/90"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Gender *</Label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-background/90 px-3 text-xs focus:ring-2 focus:ring-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">Work Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@finpilot.ai"
                      suppressHydrationWarning
                      className="rounded-xl bg-background/90"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 rounded-xl bg-background/90 font-mono pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4 text-primary" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Assign Role *</Label>
                    <Select value={roleName} onValueChange={setRoleName}>
                      <SelectTrigger suppressHydrationWarning className="rounded-xl bg-background/90">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Manager">Manager (Branch Executive)</SelectItem>
                        <SelectItem value="Employee">Employee (Loan Officer)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={submitting} className="rounded-xl bg-brand text-white font-semibold h-10">
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" /> Provisioning Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4 mr-2" /> Complete Provisioning
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </GlassPanel>
          </motion.div>
        )}

        {/* User Directory Table */}
        <GlassPanel className="p-5" hover={false}>
          <SectionTitle
            title="User Directory"
            action={<StatusPill tone="info">{filteredUsers.length} Users Listed</StatusPill>}
          />

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto pt-2">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-3 font-medium">User Name & Details</th>
                    <th className="py-3 font-medium">Email</th>
                    <th className="py-3 font-medium">Role</th>
                    <th className="py-3 font-medium">Gender</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium text-right">Credentials Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                        No users match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                        <td className="py-3 font-medium">
                          {u.full_name}
                          <p className="text-[10px] text-muted-foreground font-mono">{u.employee_id}</p>
                        </td>
                        <td className="text-xs text-muted-foreground font-mono">{u.email}</td>
                        <td>
                          <StatusPill
                            tone={
                              u.role.toLowerCase() === "admin"
                                ? "danger"
                                : u.role.toLowerCase() === "manager"
                                ? "warning"
                                : u.role.toLowerCase() === "employee"
                                ? "info"
                                : "success"
                            }
                          >
                            {u.role}
                          </StatusPill>
                        </td>
                        <td className="text-xs text-muted-foreground">{u.gender || "Not Specified"}</td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                            <CheckCircle2 className="size-3" /> Active
                          </span>
                        </td>
                        <td className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetPassword(u)}
                            className="h-8 rounded-lg text-xs text-primary"
                            title="Change Password"
                          >
                            <Lock className="size-3.5 mr-1" /> Password
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(u)}
                            className="h-8 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                            title="Remove Credentials"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </PortalShell>
  );
}

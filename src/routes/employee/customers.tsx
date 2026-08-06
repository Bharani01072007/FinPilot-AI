import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
  ChevronRight,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  Calendar,
  ExternalLink,
  Plus,
  Loader2,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { userService, type UserAccountItem } from "@/lib/services/user-service";

export const Route = createFileRoute("/employee/customers")({
  head: () => ({
    meta: [{ title: "Customer Directory & Management — FinPilot AI" }],
  }),
  component: CustomerManagementPage,
});

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  tier: "Retail" | "HNI" | "Corporate" | "SME";
  kyc_status: "VERIFIED" | "PENDING" | "FLAGGED";
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  active_applications_count: number;
  total_borrowed: string;
  joined_date: string;
  last_activity: string;
  documents_count: number;
}

function CustomerManagementPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [kycFilter, setKycFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      try {
        const users = await userService.listUsers({ role: "Customer" });
        const records: CustomerRecord[] = users.map((u, i) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          phone: u.phone ?? "+91-9876543210",
          company: u.first_name === "Bharanidharan" ? "Northwind Systems" : "Private Individual",
          tier: u.first_name === "Bharanidharan" ? "HNI" : i % 2 === 0 ? "Retail" : "SME",
          kyc_status: u.email_verified ? "VERIFIED" : "PENDING",
          risk_level: u.email_verified ? "LOW" : "MEDIUM",
          active_applications_count: u.first_name === "Bharanidharan" ? 1 : 0,
          total_borrowed: u.first_name === "Bharanidharan" ? "₹68,00,000" : "₹0",
          joined_date: new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          last_activity: u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Recently",
          documents_count: u.first_name === "Bharanidharan" ? 14 : 0,
        }));
        setCustomers(records);
      } catch {
        toast.error("Failed to load customer list");
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTier = tierFilter === "ALL" || c.tier === tierFilter;
      const matchKyc = kycFilter === "ALL" || c.kyc_status === kycFilter;
      return matchSearch && matchTier && matchKyc;
    });
  }, [customers, searchQuery, tierFilter, kycFilter]);

  return (
    <PortalShell
      role="employee"
      title="Customer Directory & Profile Management"
      subtitle="View customer profiles, active credit lines, document vault history, and automated KYC status."
    >
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Customers</span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="font-display text-2xl font-bold">{customers.length}</p>
            <p className="text-[11px] text-success">Live from Supabase</p>
          </div>

          <div className="glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>KYC Verified</span>
              <ShieldCheck className="size-4 text-success" />
            </div>
            <p className="font-display text-2xl font-bold text-success">
              {customers.filter((c) => c.kyc_status === "VERIFIED").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Automated fast-track pass</p>
          </div>

          <div className="glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>KYC Flagged / Pending</span>
              <ShieldAlert className="size-4 text-warning" />
            </div>
            <p className="font-display text-2xl font-bold text-warning">
              {customers.filter((c) => c.kyc_status !== "VERIFIED").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Requires human review</p>
          </div>

          <div className="glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Active Credit Facilities</span>
              <Building className="size-4 text-primary" />
            </div>
            <p className="font-display text-2xl font-bold">₹68.00 L</p>
            <p className="text-[11px] text-muted-foreground">Across all active loans</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or customer ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/60 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Tiers</option>
              <option value="Retail">Retail</option>
              <option value="HNI">HNI</option>
              <option value="Corporate">Corporate</option>
              <option value="SME">SME</option>
            </select>

            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All KYC Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="glass overflow-hidden rounded-2xl border border-border/60">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Tier</th>
                    <th className="px-4 py-3 font-semibold">KYC Status</th>
                    <th className="px-4 py-3 font-semibold">Risk Level</th>
                    <th className="px-4 py-3 font-semibold">Active Loans</th>
                    <th className="px-4 py-3 font-semibold">Total Borrowed</th>
                    <th className="px-4 py-3 font-semibold">Joined Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No customers found matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="group hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 font-display text-sm font-semibold text-primary">
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {customer.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-lg bg-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                            {customer.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {customer.kyc_status === "VERIFIED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                              <ShieldCheck className="size-3" /> Verified
                            </span>
                          )}
                          {customer.kyc_status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                              <Clock className="size-3" /> Pending
                            </span>
                          )}
                          {customer.kyc_status === "FLAGGED" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                              <ShieldAlert className="size-3" /> Flagged
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              customer.risk_level === "LOW"
                                ? "text-success"
                                : customer.risk_level === "MEDIUM"
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          >
                            ● {customer.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{customer.active_applications_count}</td>
                        <td className="px-4 py-3 font-medium tabular-nums">{customer.total_borrowed}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{customer.joined_date}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" className="rounded-xl">
                            <ChevronRight className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl rounded-2xl glass-strong border-border/80">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-xl font-bold">
                <span>Customer Profile</span>
                <span className="text-xs text-muted-foreground">{selectedCustomer.id}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-4 rounded-xl bg-card/60 p-4 border border-border/60">
                <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 font-display text-xl font-bold text-primary">
                  {selectedCustomer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{selectedCustomer.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.company || "Individual Customer"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" /> {selectedCustomer.email}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="size-3" /> {selectedCustomer.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Tier</p>
                  <p className="font-semibold text-foreground">{selectedCustomer.tier}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">KYC Status</p>
                  <p className="font-semibold text-success">{selectedCustomer.kyc_status}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                  <p className="font-semibold text-foreground">{selectedCustomer.risk_level}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Vault Docs</p>
                  <p className="font-semibold text-foreground">{selectedCustomer.documents_count} Files</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setSelectedCustomer(null)}>
                  Close Profile
                </Button>
                <Button
                  className="rounded-xl bg-brand text-white"
                  onClick={() => {
                    toast.success(`Sent verification link to ${selectedCustomer.email}`);
                    setSelectedCustomer(null);
                  }}
                >
                  Request KYC Refresh
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PortalShell>
  );
}

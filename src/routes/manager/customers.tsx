import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  Search,
  Filter,
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
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/customers")({
  component: CustomerManagementPage,
});

function CustomerManagementPage() {
  // Reuse employee customer data and UI logic
  const [customers, setCustomers] = useState([
    // Sample data – you can replace with real API calls
    {
      id: "CUST-8021",
      name: "Aarav Mehta",
      email: "aarav@finpilot.ai",
      phone: "+91 98201 44820",
      company: "Northwind Systems",
      tier: "HNI",
      kyc_status: "VERIFIED",
      risk_level: "LOW",
      active_applications_count: 2,
      total_borrowed: "₹85,00,000",
      joined_date: "15 Jan 2024",
      last_activity: "2 hours ago",
      documents_count: 8,
    },
    // Add other mock customers as needed
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [kycFilter, setKycFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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
    <PortalShell role="manager" title="Customer Directory & Profile Management" subtitle="View customer profiles, active credit lines, document vault history, and automated KYC status.">
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Customers</span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="font-display text-2xl font-bold">{customers.length}</p>
            <p className="text-[11px] text-success">↑ 12% growth this month</p>
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
            <p className="font-display text-2xl font-bold">₹14.05 Cr</p>
            <p className="text-[11px] text-muted-foreground">Across all active loans</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Tiers</option>
              <option value="Retail">Retail</option>
              <option value="HNI">HNI</option>
              <option value="SME">SME</option>
              <option value="Corporate">Corporate</option>
            </select>
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All KYC Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="FLAGGED">Flagged</option>
            </select>
            <Button className="h-10 rounded-xl bg-brand text-white shadow-glow" onClick={() => toast.info("Create Customer form ready")}> 
              <Plus className="size-4 mr-2" /> Add Customer
            </Button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Tier</th>
                  <th className="px-5 py-4 font-semibold">KYC Status</th>
                  <th className="px-5 py-4 font-semibold">Risk Rating</th>
                  <th className="px-5 py-4 font-semibold">Applications</th>
                  <th className="px-5 py-4 font-semibold">Total Borrowed</th>
                  <th className="px-5 py-4 font-semibold">Last Activity</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="transition-colors hover:bg-accent/40 cursor-pointer" onClick={() => setSelectedCustomer(cust)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-primary/10 font-bold text-primary">
                          {cust.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{cust.name}</p>
                          <p className="text-[11px] text-muted-foreground">{cust.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold">{cust.tier}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cust.kyc_status === "VERIFIED" ? "bg-success/15 text-success" : cust.kyc_status === "FLAGGED" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                        {cust.kyc_status === "VERIFIED" ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
                        {cust.kyc_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cust.risk_level === "LOW" ? "bg-success/15 text-success" : cust.risk_level === "MEDIUM" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                        {cust.risk_level} RISK
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">{cust.active_applications_count} Active</td>
                    <td className="px-5 py-4 font-mono font-semibold text-foreground">{cust.total_borrowed}</td>
                    <td className="px-5 py-4 text-muted-foreground">{cust.last_activity}</td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" size="sm" className="rounded-lg h-8" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(cust); }}>
                        View Profile <ChevronRight className="size-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Profile Modal */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl rounded-3xl p-6 glass-strong border border-border">
            {selectedCustomer && (
              <div className="space-y-6">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-brand font-display text-lg font-bold text-white shadow-glow">{selectedCustomer.name.split(" ").map((n) => n[0]).join("")}</div>
                    <div>
                      <DialogTitle className="font-display text-xl font-bold">{selectedCustomer.name}</DialogTitle>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.id} · {selectedCustomer.company} ({selectedCustomer.tier})</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-2xl border border-border/60 bg-card/40 p-3 space-y-1">
                    <span className="text-muted-foreground">Email Address</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5"><Mail className="size-3 text-primary" /> {selectedCustomer.email}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/40 p-3 space-y-1">
                    <span className="text-muted-foreground">Phone Number</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5"><Phone className="size-3 text-primary" /> {selectedCustomer.phone}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/40 p-3 space-y-1">
                    <span className="text-muted-foreground">KYC Verification</span>
                    <p className="font-bold text-success flex items-center gap-1.5"><ShieldCheck className="size-3" /> {selectedCustomer.kyc_status} (98.4% match)</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/40 p-3 space-y-1">
                    <span className="text-muted-foreground">Document Vault</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5"><FileText className="size-3 text-primary" /> {selectedCustomer.documents_count} Verified Documents</p>
                  </div>
                </div>
                <div className="glass rounded-2xl p-4 space-y-3">
                  <h4 className="font-display text-sm font-semibold">Active Loan Facilities & History</h4>
                  <div className="flex justify-between text-xs border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Home Loan Top-up (APP-24817)</span>
                    <span className="font-mono font-semibold text-foreground">₹70,00,000 · Underwriting</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Personal Line (APP-24802)</span>
                    <span className="font-mono font-semibold text-foreground">₹15,00,000 · Active</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setSelectedCustomer(null)}>Close</Button>
                  <Button className="rounded-xl bg-brand text-white shadow-glow" onClick={() => { toast.success(`Opening detailed dossier for ${selectedCustomer.name}`); setSelectedCustomer(null); }}>
                    <ExternalLink className="size-4 mr-2" /> Open Full Dossier
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PortalShell>
  );
}


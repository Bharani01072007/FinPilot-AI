import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BookOpen,
  Building2,
  FileText,
  IdCard,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export type Health = "valid" | "expiring" | "expired" | "renewing" | "missing";

export type VaultDoc = {
  id: string;
  name: string;
  category: string;
  size: string;
  uploaded: string;
  expires?: string;
  health: Health;
  favourite?: boolean;
  versions: number;
  tags: string[];
  extracted?: { label: string; value: string }[];
  shared?: boolean;
  rawFile?: File;
};

export type VaultCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  tint: string;
  count: number;
};

export const vaultCategories: VaultCategory[] = [
  { id: "identity", label: "Identity", icon: IdCard, tint: "text-primary", count: 5 },
  { id: "address", label: "Address Proof", icon: Building2, tint: "text-indigo", count: 3 },
  { id: "income", label: "Income Proof", icon: ReceiptText, tint: "text-success", count: 4 },
  { id: "banking", label: "Banking", icon: Banknote, tint: "text-cyan", count: 3 },
  { id: "property", label: "Property", icon: Wallet, tint: "text-warning", count: 2 },
  { id: "education", label: "Education", icon: BookOpen, tint: "text-indigo", count: 3 },
  { id: "insurance", label: "Insurance", icon: ShieldCheck, tint: "text-destructive", count: 2 },
  { id: "other", label: "Other Documents", icon: FileText, tint: "text-muted-foreground", count: 2 },
];

export const vaultDocs: VaultDoc[] = [
  {
    id: "d1",
    name: "Aadhaar Card.pdf",
    category: "identity",
    size: "1.2 MB",
    uploaded: "12 Mar 2026",
    health: "valid",
    favourite: true,
    versions: 2,
    tags: ["KYC", "Verified"],
    shared: true,
    extracted: [
      { label: "Name", value: "Bharanidharan Saravanakumar" },
      { label: "Aadhaar No.", value: "XXXX XXXX 5549" },
      { label: "DOB", value: "01 Jul 2007" },
    ],
  },
  {
    id: "d2",
    name: "PAN Card.pdf",
    category: "identity",
    size: "480 KB",
    uploaded: "12 Mar 2026",
    health: "valid",
    favourite: true,
    versions: 1,
    tags: ["KYC"],
    extracted: [
      { label: "PAN", value: "BHARN1234K" },
      { label: "Name", value: "Bharanidharan Saravanakumar" },
      { label: "DOB", value: "01 Jul 2007" },
    ],
  },
  {
    id: "d3",
    name: "Passport.pdf",
    category: "identity",
    size: "2.4 MB",
    uploaded: "02 Jan 2026",
    expires: "29 Aug 2026",
    health: "expiring",
    versions: 1,
    tags: ["Travel", "ID"],
    extracted: [{ label: "Passport No.", value: "M4821993" }],
  },
  {
    id: "d4",
    name: "Driving License.jpg",
    category: "identity",
    size: "820 KB",
    uploaded: "18 Feb 2026",
    expires: "19 Aug 2026",
    health: "expiring",
    versions: 1,
    tags: ["ID"],
  },
  {
    id: "d5",
    name: "Electricity Bill - June.pdf",
    category: "address",
    size: "310 KB",
    uploaded: "04 Jul 2026",
    health: "valid",
    versions: 3,
    tags: ["Address"],
  },
  {
    id: "d6",
    name: "Rental Agreement.pdf",
    category: "address",
    size: "3.1 MB",
    uploaded: "11 Nov 2025",
    health: "valid",
    versions: 1,
    tags: ["Address", "Legal"],
  },
  {
    id: "d7",
    name: "Salary Slip - June 2026.pdf",
    category: "income",
    size: "220 KB",
    uploaded: "05 Jul 2026",
    health: "valid",
    favourite: true,
    versions: 6,
    tags: ["Income"],
    extracted: [
      { label: "Employer", value: "Northwind Systems" },
      { label: "Net Pay", value: "₹1,84,500" },
    ],
  },
  {
    id: "d8",
    name: "Form-16 FY 25-26.pdf",
    category: "income",
    size: "640 KB",
    uploaded: "22 Jun 2026",
    health: "valid",
    versions: 1,
    tags: ["Tax"],
  },
  {
    id: "d9",
    name: "Income Certificate.pdf",
    category: "income",
    size: "410 KB",
    uploaded: "14 Aug 2025",
    expires: "11 Aug 2026",
    health: "expiring",
    versions: 1,
    tags: ["Government"],
  },
  {
    id: "d10",
    name: "Bank Statement - Q4.pdf",
    category: "banking",
    size: "1.8 MB",
    uploaded: "09 Jan 2026",
    health: "expired",
    versions: 2,
    tags: ["Statement"],
  },
  {
    id: "d11",
    name: "Cancelled Cheque.jpg",
    category: "banking",
    size: "160 KB",
    uploaded: "12 Mar 2026",
    health: "valid",
    versions: 1,
    tags: ["Banking"],
  },
  {
    id: "d12",
    name: "Property Tax Receipt.pdf",
    category: "property",
    size: "290 KB",
    uploaded: "30 Apr 2026",
    health: "renewing",
    versions: 1,
    tags: ["Property"],
  },
  {
    id: "d13",
    name: "Degree Certificate.pdf",
    category: "education",
    size: "1.1 MB",
    uploaded: "07 Sep 2025",
    health: "valid",
    versions: 1,
    tags: ["Education"],
  },
  {
    id: "d14",
    name: "Health Insurance Policy.pdf",
    category: "insurance",
    size: "2.0 MB",
    uploaded: "16 Dec 2025",
    expires: "06 Aug 2026",
    health: "expiring",
    versions: 2,
    tags: ["Insurance"],
  },
];

export const healthMeta: Record<Health, { label: string; className: string; dot: string }> = {
  valid: { label: "Valid", className: "bg-success/12 text-success", dot: "bg-success" },
  expiring: { label: "Expiring soon", className: "bg-warning/15 text-warning", dot: "bg-warning" },
  expired: { label: "Expired", className: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
  renewing: { label: "Renewal in progress", className: "bg-info/15 text-info", dot: "bg-info" },
  missing: { label: "Missing", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

export const readiness = [
  { label: "Identity", value: 100 },
  { label: "Income", value: 90 },
  { label: "Banking", value: 74 },
  { label: "Property", value: 40 },
  { label: "Education", value: 100 },
];

export const expiryTimeline = [
  { doc: "Driving License", days: 20, health: "expiring" as Health, impact: "Vehicle loan, KYC refresh" },
  { doc: "Health Insurance Policy", days: 7, health: "expiring" as Health, impact: "Medical claim eligibility" },
  { doc: "Income Certificate", days: 12, health: "expiring" as Health, impact: "Subsidised loan schemes" },
  { doc: "Passport", days: 30, health: "expiring" as Health, impact: "Forex & NRI services" },
  { doc: "Bank Statement - Q4", days: -14, health: "expired" as Health, impact: "Home loan underwriting" },
];

export const revenueSeries = [
  { m: "Jan", disbursed: 42, applications: 128, risk: 12 },
  { m: "Feb", disbursed: 48, applications: 141, risk: 10 },
  { m: "Mar", disbursed: 55, applications: 163, risk: 14 },
  { m: "Apr", disbursed: 51, applications: 158, risk: 9 },
  { m: "May", disbursed: 64, applications: 187, risk: 11 },
  { m: "Jun", disbursed: 72, applications: 204, risk: 8 },
  { m: "Jul", disbursed: 81, applications: 226, risk: 7 },
];

export const slaSeries = [
  { m: "Mon", sla: 92 },
  { m: "Tue", sla: 95 },
  { m: "Wed", sla: 88 },
  { m: "Thu", sla: 97 },
  { m: "Fri", sla: 94 },
  { m: "Sat", sla: 99 },
  { m: "Sun", sla: 96 },
];

export const applications = [
  { id: "APP-24817", customer: "Aarav Mehta", product: "Home Loan", amount: "₹68,00,000", stage: "Underwriting", risk: "Low", sla: "4h", score: 812 },
  { id: "APP-24816", customer: "Isha Rao", product: "Business Loan", amount: "₹22,50,000", stage: "Document Review", risk: "Medium", sla: "9h", score: 704 },
  { id: "APP-24812", customer: "Kabir Shah", product: "Auto Loan", amount: "₹14,20,000", stage: "AI Verification", risk: "Low", sla: "2h", score: 788 },
  { id: "APP-24809", customer: "Meera Nair", product: "Personal Loan", amount: "₹6,00,000", stage: "Manager Approval", risk: "High", sla: "1h", score: 611 },
  { id: "APP-24804", customer: "Rohan Gupta", product: "Working Capital", amount: "₹1,10,00,000", stage: "Risk Flagged", risk: "High", sla: "Breach", score: 578 },
  { id: "APP-24798", customer: "Sara Iyer", product: "Home Loan", amount: "₹41,00,000", stage: "Approved", risk: "Low", sla: "—", score: 834 },
];

export const activity = [
  { title: "AI extracted 14 fields from Form-16", meta: "Vault · 2 min ago", tone: "primary" },
  { title: "Home Loan APP-24817 moved to Underwriting", meta: "Workflow · 18 min ago", tone: "info" },
  { title: "Duplicate Aadhaar upload prevented", meta: "Vault AI · 42 min ago", tone: "success" },
  { title: "Bank Statement flagged as older than 6 months", meta: "Risk · 1 hr ago", tone: "warning" },
  { title: "Consent granted to share PAN with underwriting", meta: "Security · 3 hr ago", tone: "primary" },
];

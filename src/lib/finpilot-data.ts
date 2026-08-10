/**
 * FinPilot AI — Type Definitions & Static UI Constants
 *
 * All runtime data (vault docs, applications, notifications, users, etc.)
 * is now fetched live from Supabase via the service layer.
 * This file only contains TypeScript types and static UI metadata.
 */

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

// ─── Core Types ───────────────────────────────────────────────────────────────

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

// ─── Static UI Metadata ───────────────────────────────────────────────────────

/** Category sidebar items — counts updated dynamically from Supabase data */
export const vaultCategories: VaultCategory[] = [
  { id: "identity",  label: "Identity",         icon: IdCard,      tint: "text-primary",          count: 0 },
  { id: "address",   label: "Address Proof",     icon: Building2,   tint: "text-indigo",           count: 0 },
  { id: "income",    label: "Income Proof",      icon: ReceiptText, tint: "text-success",          count: 0 },
  { id: "banking",   label: "Banking",           icon: Banknote,    tint: "text-cyan",             count: 0 },
  { id: "property",  label: "Property",          icon: Wallet,      tint: "text-warning",          count: 0 },
  { id: "education", label: "Education",         icon: BookOpen,    tint: "text-indigo",           count: 0 },
  { id: "insurance", label: "Insurance",         icon: ShieldCheck, tint: "text-destructive",      count: 0 },
  { id: "other",     label: "Other Documents",   icon: FileText,    tint: "text-muted-foreground", count: 0 },
];

export const healthMeta: Record<Health, { label: string; className: string; dot: string }> = {
  valid:    { label: "Valid",                className: "bg-success/12 text-success",        dot: "bg-success" },
  expiring: { label: "Expiring soon",        className: "bg-warning/15 text-warning",        dot: "bg-warning" },
  expired:  { label: "Expired",             className: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
  renewing: { label: "Renewal in progress", className: "bg-info/15 text-info",              dot: "bg-info" },
  missing:  { label: "Missing",             className: "bg-muted text-muted-foreground",     dot: "bg-muted-foreground" },
};

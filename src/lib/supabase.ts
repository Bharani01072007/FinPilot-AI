/**
 * FinPilot AI — Supabase JS Client
 *
 * Connects to Supabase via HTTPS (PostgREST + GoTrue) so it works even when
 * the direct Postgres port (5432) is not reachable on this machine's network.
 *
 * The anon key is public-safe; Row-Level Security (RLS) policies on Supabase
 * protect row visibility per user.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://WgLDUEnuqO6wHWb3nZVXcw.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_WgLDUEnuqO6wHWb3nZVXcw_Xtp7dnFB";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ─── Typed Database Interfaces ────────────────────────────────────────────────

export interface SupabaseUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface SupabaseRole {
  id: string;
  name: string;
  description: string;
}

export interface SupabaseDocument {
  id: string;
  user_id: string;
  category_id?: string;
  original_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  health_score: number;
  version: number;
  is_favourite: boolean;
  is_shared: boolean;
  expires_at?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  document_categories?: { name: string };
}

export interface SupabaseOcrExtraction {
  id: string;
  document_id: string;
  document_type: string;
  confidence_score: number;
  extracted_fields: { label: string; value: string }[];
  processed_at: string;
}

export interface SupabaseApplication {
  id: string;
  user_id: string;
  application_number: string;
  application_type: string;
  requested_amount: number;
  sanctioned_amount?: number;
  status: string;
  risk_score?: number;
  dti_ratio?: number;
  assigned_officer_id?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  users?: { first_name: string; last_name: string; email: string };
}

export interface SupabaseNotification {
  id: string;
  user_id: string;
  type: "SYSTEM" | "APPLICATION" | "DOCUMENT" | "PAYMENT" | "REMINDER";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SupabaseAuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

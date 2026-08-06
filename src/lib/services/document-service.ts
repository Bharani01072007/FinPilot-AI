/**
 * FinPilot AI — Document Service
 * All data is fetched live from Supabase. No mock/demo fallbacks.
 */

import { supabase, type SupabaseDocument, type SupabaseOcrExtraction } from "../supabase";
import { fetchApi } from "../api-client";
import type { Health, VaultDoc } from "../finpilot-data";

export interface DocumentCategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  category_id: string;
  category_name?: string;
  file_size: number;
  mime_type: string;
  verification_status: string;
  health: Health;
  created_at: string;
  expires_at?: string;
  download_url?: string;
  preview_url?: string;
  extracted_fields?: { label: string; value: string }[];
  tags?: string[];
  is_favourite?: boolean;
  is_shared?: boolean;
  version?: number;
}

// Map Supabase document row to VaultDoc shape
function mapDocToVaultDoc(doc: SupabaseDocument & { document_categories?: { name: string }; ocr_extractions?: SupabaseOcrExtraction[] }): VaultDoc {
  const catName = doc.document_categories?.name?.toLowerCase() ?? "other";
  const categorySlug =
    catName.includes("identity") ? "identity" :
    catName.includes("address") ? "address" :
    catName.includes("income") ? "income" :
    catName.includes("banking") || catName.includes("bank") ? "banking" :
    catName.includes("property") ? "property" :
    catName.includes("education") ? "education" :
    catName.includes("insurance") ? "insurance" : "other";

  const health: Health =
    doc.verification_status === "REJECTED" ? "expired" :
    doc.expires_at && new Date(doc.expires_at) < new Date() ? "expired" :
    doc.expires_at && new Date(doc.expires_at) < new Date(Date.now() + 30 * 86400000) ? "expiring" :
    doc.health_score != null && doc.health_score < 50 ? "renewing" :
    "valid";

  const sizeKb = Math.round(doc.file_size / 1024);
  const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

  const ocrFields = doc.ocr_extractions?.[0]?.extracted_fields ?? [];

  return {
    id: doc.id,
    name: doc.original_name,
    category: categorySlug,
    size: sizeStr,
    uploaded: new Date(doc.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    expires: doc.expires_at ? new Date(doc.expires_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : undefined,
    health,
    favourite: doc.is_favourite,
    versions: doc.version ?? 1,
    tags: (doc as any).tags ?? [],
    shared: doc.is_shared,
    extracted: ocrFields.length > 0 ? ocrFields : undefined,
  };
}

export const documentService = {
  async getCategories(): Promise<DocumentCategoryItem[]> {
    const { data, error } = await supabase
      .from("document_categories")
      .select("id, name, description")
      .eq("is_active", true)
      .order("name");

    if (!error && data?.length) {
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.id.toUpperCase(),
        description: c.description ?? "",
      }));
    }

    // Fallback to backend API
    const res = await fetchApi<DocumentCategoryItem[]>("/documents/categories");
    if (res.success && res.data) return res.data;

    return [];
  },

  async listDocuments(params?: { category_id?: string; search?: string; user_id?: string }): Promise<DocumentItem[]> {
    let query = supabase
      .from("documents")
      .select("*, document_categories(name), ocr_extractions(extracted_fields)")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (params?.user_id) query = query.eq("user_id", params.user_id);
    if (params?.category_id) query = query.eq("category_id", params.category_id);
    if (params?.search) query = query.ilike("original_name", `%${params.search}%`);

    const { data, error } = await query;

    if (!error && data?.length) {
      return data.map((doc: any) => ({
        id: doc.id,
        filename: doc.original_name,
        original_name: doc.original_name,
        category_id: doc.category_id ?? "",
        category_name: doc.document_categories?.name ?? "",
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        verification_status: doc.verification_status,
        health: mapDocToVaultDoc(doc as any).health,
        created_at: doc.created_at,
        expires_at: doc.expires_at ?? undefined,
        extracted_fields: doc.ocr_extractions?.[0]?.extracted_fields ?? [],
        tags: doc.tags ?? [],
        is_favourite: doc.is_favourite,
        is_shared: doc.is_shared,
        version: doc.version,
      }));
    }

    // Fallback to backend API
    const searchQuery = new URLSearchParams();
    if (params?.category_id) searchQuery.append("category_id", params.category_id);
    if (params?.search) searchQuery.append("search", params.search);
    const res = await fetchApi<{ items: DocumentItem[] }>(`/documents?${searchQuery.toString()}`);
    return res.success && res.data?.items ? res.data.items : [];
  },

  async listVaultDocs(userId?: string): Promise<VaultDoc[]> {
    let query = supabase
      .from("documents")
      .select("*, document_categories(name), ocr_extractions(extracted_fields, document_type, confidence_score)")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (!error && data?.length) {
      return data.map((doc: any) => mapDocToVaultDoc(doc as any));
    }
    return [];
  },

  async uploadDocument(file: File, categoryId: string, applicationId?: string): Promise<DocumentItem | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category_id", categoryId);
    if (applicationId) formData.append("application_id", applicationId);

    const res = await fetchApi<DocumentItem>("/documents/upload", {
      method: "POST",
      body: formData,
    });

    return res.success && res.data ? res.data : null;
  },

  async verifyDocument(id: string, notes?: string): Promise<boolean> {
    const res = await fetchApi(`/documents/${id}/verify`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
    return res.success;
  },

  async rejectDocument(id: string, reason: string): Promise<boolean> {
    const res = await fetchApi(`/documents/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return res.success;
  },

  async getVaultItems(userId?: string): Promise<VaultDoc[]> {
    return this.listVaultDocs(userId);
  },

  async addToVault(documentId: string): Promise<boolean> {
    const res = await fetchApi("/document-vault", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId }),
    });
    return res.success;
  },

  async extractDocumentFields(documentId: string): Promise<{ fields: { label: string; value: string }[]; document_classification: string; confidence: number; engine: string } | null> {
    // Try Supabase first for cached OCR result
    const { data } = await supabase
      .from("ocr_extractions")
      .select("extracted_fields, document_type, confidence_score")
      .eq("document_id", documentId)
      .order("processed_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.extracted_fields?.length) {
      return {
        fields: data.extracted_fields as { label: string; value: string }[],
        document_classification: data.document_type,
        confidence: Number(data.confidence_score) / 100,
        engine: "Groq Vision (Supabase Cached)",
      };
    }

    // Fallback: run live extraction via backend
    try {
      const res = await fetchApi<{
        fields: { label: string; value: string }[];
        document_classification: string;
        confidence: number;
        engine: string;
      }>(`/documents/${documentId}/extract`, { method: "POST" });
      if (res.success && res.data) return res.data;
    } catch (err) {
      console.error("[extractDocumentFields]", err);
    }
    return null;
  },

  async getDashboardStats(userId?: string): Promise<{
    totalDocs: number;
    verified: number;
    expiringSoon: number;
    expired: number;
  }> {
    let query = supabase
      .from("documents")
      .select("verification_status, expires_at")
      .eq("is_deleted", false);

    if (userId) query = query.eq("user_id", userId);
    const { data } = await query;

    if (data) {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 86400000);
      return {
        totalDocs: data.length,
        verified: data.filter((d) => d.verification_status === "VERIFIED").length,
        expiringSoon: data.filter((d) => d.expires_at && new Date(d.expires_at) > now && new Date(d.expires_at) <= soon).length,
        expired: data.filter((d) => d.expires_at && new Date(d.expires_at) <= now).length,
      };
    }
    return { totalDocs: 0, verified: 0, expiringSoon: 0, expired: 0 };
  },
};

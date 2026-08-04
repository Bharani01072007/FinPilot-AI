import { fetchApi } from "../api-client";
import { vaultDocs, vaultCategories, VaultDoc, Health } from "../finpilot-data";

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
  download_url?: string;
  preview_url?: string;
  extracted_fields?: Record<string, any>;
  tags?: string[];
}

export const documentService = {
  async getCategories(): Promise<DocumentCategoryItem[]> {
    const res = await fetchApi<DocumentCategoryItem[]>("/documents/categories");
    if (res.success && res.data) {
      return res.data;
    }
    return vaultCategories.map((c) => ({
      id: c.id,
      name: c.label,
      code: c.id.toUpperCase(),
      description: `${c.label} Verification Category`,
    }));
  },

  async listDocuments(params?: { category_id?: string; search?: string }): Promise<DocumentItem[]> {
    const query = new URLSearchParams();
    if (params?.category_id) query.append("category_id", params.category_id);
    if (params?.search) query.append("search", params.search);

    const res = await fetchApi<{ items: DocumentItem[] }>(`/documents?${query.toString()}`);
    if (res.success && res.data?.items) {
      return res.data.items;
    }

    return vaultDocs.map((doc) => ({
      id: doc.id,
      filename: doc.name,
      original_name: doc.name,
      category_id: doc.category,
      category_name: doc.category.charAt(0).toUpperCase() + doc.category.slice(1),
      file_size: 1024 * 500,
      mime_type: doc.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      verification_status: doc.health === "valid" ? "VERIFIED" : doc.health === "expired" ? "REJECTED" : "PENDING",
      health: doc.health,
      created_at: new Date().toISOString(),
      tags: doc.tags,
      extracted_fields: doc.extracted?.reduce((acc, curr) => ({ ...acc, [curr.label]: curr.value }), {}),
    }));
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

    if (res.success && res.data) {
      return res.data;
    }

    // Mock upload fallback
    return {
      id: `doc-${Date.now()}`,
      filename: file.name,
      original_name: file.name,
      category_id: categoryId,
      file_size: file.size,
      mime_type: file.type,
      verification_status: "PENDING",
      health: "valid",
      created_at: new Date().toISOString(),
      tags: ["New Upload"],
    };
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

  async getVaultItems(customerId?: string): Promise<VaultDoc[]> {
    const query = customerId ? `?customer_id=${customerId}` : "";
    const res = await fetchApi<any[]>(`/document-vault${query}`);
    if (res.success && res.data) {
      return res.data.map((item) => ({
        id: item.id || `v-${item.document_id}`,
        name: item.document?.original_name || item.name || "Document.pdf",
        category: item.category || "identity",
        size: "1.4 MB",
        uploaded: new Date(item.created_at || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        health: (item.document?.verification_status === "VERIFIED" ? "valid" : "expiring") as Health,
        versions: item.version || 1,
        tags: item.tags || ["Vault"],
        shared: true,
      }));
    }
    return vaultDocs;
  },

  async addToVault(documentId: string): Promise<boolean> {
    const res = await fetchApi("/document-vault", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId }),
    });
    return res.success;
  },
};

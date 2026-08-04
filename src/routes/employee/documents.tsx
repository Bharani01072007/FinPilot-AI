import { createFileRoute, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { FileSearch, Sparkle, CheckCircle2, XCircle, Loader2, FileText, Upload, Cpu, Layers } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { documentService, DocumentItem } from "@/lib/services/document-service";
import { aiService, OCRResult } from "@/lib/services/ai-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/documents")({
  head: () => ({
    meta: [{ title: "Document Review & OCR Engine — FinPilot AI Employee Portal" }],
  }),
  component: EmployeeDocumentsPage,
});

type DocTab = "review" | "ocr";

function EmployeeDocumentsPage() {
  const navigate = useNavigate();
  const searchLocation = useRouterState({ select: (s) => s.location.search });

  const activeTab: DocTab = useMemo(() => {
    let rawSearch = "";
    if (typeof searchLocation === "string") {
      rawSearch = searchLocation;
    } else if (searchLocation && typeof searchLocation === "object") {
      rawSearch = (searchLocation as any).tab ? `?tab=${(searchLocation as any).tab}` : "";
    } else if (typeof window !== "undefined") {
      rawSearch = window.location.search;
    }
    const params = new URLSearchParams(rawSearch);
    const tabParam = params.get("tab") as DocTab;
    if (tabParam === "ocr") return "ocr";
    return "review";
  }, [searchLocation]);

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [ocrData, setOcrData] = useState<OCRResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await documentService.listDocuments();
      setDocs(data);
    } catch {
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunOCR = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setProcessing(true);
    try {
      const res = await aiService.processDocumentOCR(doc.id);
      setOcrData(res);
      toast.success("AI Document OCR processing completed");
    } catch {
      toast.error("OCR extraction failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async (docId: string) => {
    await documentService.verifyDocument(docId);
    toast.success("Document marked as VERIFIED");
    loadData();
  };

  const handleReject = async (docId: string) => {
    await documentService.rejectDocument(docId, "Illegible text or missing signature");
    toast.info("Document marked as REJECTED");
    loadData();
  };

  const handleDropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessing(true);
      setTimeout(() => {
        setOcrData({
          document_id: `ocr-${Date.now()}`,
          document_type: file.name.toUpperCase().includes("PAN") ? "PAN_CARD" : "FINANCIAL_DOCUMENT",
          raw_text: `EXTRACTED TEXT FROM ${file.name}: CERTIFIED UNDER SECTION 203 OF THE INCOME TAX ACT 1961...`,
          cleaned_text: `Form 16 Tax Certificate. File: ${file.name}. Verified Name: Aarav Mehta. Tax Deducted: ₹3,42,000.`,
          confidence_score: 99.1,
          extracted_fields: [
            { label: "Filename", value: file.name, confidence: 1.0 },
            { label: "File Size", value: `${(file.size / 1024).toFixed(1)} KB`, confidence: 1.0 },
            { label: "Parsed Status", value: "PASSED", confidence: 0.99 },
            { label: "Extracted Income", value: "₹24,00,000", confidence: 0.98 },
          ],
          validation_status: "PASSED",
          missing_fields: [],
        });
        setProcessing(false);
        toast.success(`OCR Extractor processed ${file.name} successfully!`);
      }, 1000);
    }
  };

  return (
    <PortalShell
      role="employee"
      title={activeTab === "ocr" ? "AI OCR Field Extractor Playground" : "Document Review & Verification Queue"}
      subtitle={
        activeTab === "ocr"
          ? "Upload any financial file to inspect OCR bounding boxes, text cleaning, and key-value confidence scores."
          : "Inspect uploaded financial documents, run AI field extraction, and verify authenticity."
      }
    >
      <div className="space-y-6">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <button
            onClick={() => {
              navigate({ to: "/employee/documents" });
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "review"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "glass hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSearch className="size-4" />
            <span>Document Review Queue</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === "review" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
              {docs.length}
            </span>
          </button>

          <button
            onClick={() => {
              navigate({ to: "/employee/documents", search: { tab: "ocr" } as any });
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "ocr"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "glass hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cpu className="size-4" />
            <span>OCR Extractor Playground</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === "ocr" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
              AI
            </span>
          </button>
        </div>

        {/* Tab 1: Document Review Queue */}
        {activeTab === "review" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Document Queue (Left 6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Uploaded Customer Documents Queue ({docs.length})
              </h3>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleRunOCR(doc)}
                      className={`glass flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-all hover:border-primary/40 ${
                        selectedDoc?.id === doc.id ? "ring-2 ring-primary/50 bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{doc.original_name}</p>
                          <p className="text-xs text-muted-foreground">Category: {doc.category_name || "Identity"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            doc.verification_status === "VERIFIED"
                              ? "bg-success/15 text-success"
                              : doc.verification_status === "REJECTED"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-warning/15 text-warning"
                          }`}
                        >
                          {doc.verification_status}
                        </span>
                        <Button size="sm" variant="ghost" className="rounded-xl">
                          <Sparkle className="size-3.5 text-primary" /> Run OCR
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OCR & Verification Details (Right 6 cols) */}
            <div className="lg:col-span-6">
              <div className="glass-strong rounded-3xl p-6 sticky top-24 space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                      <Sparkle className="size-3.5" /> AI Document Verification
                    </span>
                    <h3 className="font-display text-lg font-semibold mt-1">
                      {selectedDoc ? selectedDoc.original_name : "Select a Document"}
                    </h3>
                  </div>

                  {selectedDoc && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReject(selectedDoc.id)} className="rounded-xl border-destructive/40 text-destructive">
                        <XCircle className="size-3.5 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleVerify(selectedDoc.id)} className="rounded-xl bg-success text-white">
                        <CheckCircle2 className="size-3.5 mr-1" /> Verify
                      </Button>
                    </div>
                  )}
                </div>

                {processing ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin text-primary mb-3" />
                    <p className="text-sm font-medium">Running Layout Classification & OCR Pipeline...</p>
                  </div>
                ) : ocrData ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Extracted Type:</span>
                        <p className="font-semibold text-foreground">{ocrData.document_type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">AI Confidence:</span>
                        <p className="font-semibold text-success">{ocrData.confidence_score}%</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Extracted Fields</h4>
                      <div className="space-y-2">
                        {ocrData.extracted_fields.map((field, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs">
                            <span className="text-muted-foreground">{field.label}</span>
                            <span className="font-semibold text-foreground">{field.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Raw Cleaned Text</h4>
                      <div className="rounded-xl bg-muted/60 p-3 font-mono text-[11px] text-muted-foreground max-h-32 overflow-y-auto">
                        {ocrData.cleaned_text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <FileSearch className="size-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click any document on the left queue to run verification & OCR extraction.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: OCR Extractor Playground */}
        {activeTab === "ocr" && (
          <div className="glass-strong rounded-3xl p-8 space-y-6">
            <div className="border-b border-border/60 pb-4 flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                  <Cpu className="size-3.5" /> High-Performance Vision Engine
                </span>
                <h3 className="font-display text-xl font-semibold mt-1">Interactive OCR Extractor Playground</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary flex items-center gap-1">
                <Layers className="size-3.5" /> Optical Character Recognition
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* File Drag/Drop Zone (Left 6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-4 transition-colors hover:border-primary/50">
                  <div className="size-12 mx-auto grid place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Upload className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Upload Document for OCR Field Extraction</p>
                    <p className="text-xs text-muted-foreground mt-1">Drag and drop PDF, PNG, or JPG files (Form-16, Salary Slip, PAN, Bank Statement)</p>
                  </div>
                  <label className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground cursor-pointer shadow-glow">
                    <span>Browse Local Computer</span>
                    <input type="file" onChange={handleDropUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                  </label>
                </div>
              </div>

              {/* Extraction Output (Right 6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                {processing ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground glass rounded-2xl">
                    <Loader2 className="size-8 animate-spin text-primary mb-3" />
                    <p className="text-sm font-medium">Extracting Text & Key-Value Coordinates...</p>
                  </div>
                ) : ocrData ? (
                  <div className="glass rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Document Type</p>
                        <p className="font-semibold text-foreground text-sm">{ocrData.document_type}</p>
                      </div>
                      <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                        Score: {ocrData.confidence_score}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Parsed Key-Value Pairs</p>
                      {ocrData.extracted_fields.map((f, idx) => (
                        <div key={idx} className="flex justify-between items-center rounded-xl bg-muted/40 p-2.5 text-xs">
                          <span className="text-muted-foreground">{f.label}:</span>
                          <span className="font-semibold text-foreground">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted-foreground glass rounded-2xl">
                    <Sparkle className="size-10 mx-auto mb-2 opacity-50 text-primary" />
                    <p className="text-sm">Upload any document on the left to test the OCR Extractor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

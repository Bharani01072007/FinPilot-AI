import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileSearch, Sparkle, CheckCircle2, XCircle, Loader2, FileText, Eye, ShieldCheck } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { documentService, DocumentItem } from "@/lib/services/document-service";
import { aiService, OCRResult } from "@/lib/services/ai-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/documents")({
  head: () => ({
    meta: [{ title: "Document Review & OCR — FinPilot AI Employee Portal" }],
  }),
  component: EmployeeDocumentsPage,
});

function EmployeeDocumentsPage() {
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

  return (
    <PortalShell role="employee" title="Document Review & OCR Engine" subtitle="Inspect uploaded financial documents, run AI field extraction, and verify authenticity.">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Document List (Left 6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Uploaded Documents Queue ({docs.length})
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
                      <Sparkle className="size-3.5 text-primary" /> OCR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OCR Result View (Right 6 cols) */}
        <div className="lg:col-span-6">
          <div className="glass-strong rounded-3xl p-6 sticky top-24 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                  <Sparkle className="size-3.5" /> AI Document Intelligence
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
                <p className="text-sm font-medium">Processing OCR Extraction Pipeline...</p>
                <p className="text-xs">Classifying document layout, cleaning image noise, and parsing key-value fields.</p>
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
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Raw Cleaned OCR Text</h4>
                  <div className="rounded-xl bg-muted/60 p-3 font-mono text-[11px] text-muted-foreground max-h-32 overflow-y-auto">
                    {ocrData.cleaned_text}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <FileSearch className="size-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click any document on the left queue to run OCR extraction.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

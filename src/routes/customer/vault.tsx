import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useRef } from "react";
import {
  AlertTriangle,
  ChevronRight,
  CloudUpload,
  Download,
  FileText,
  Filter,
  Grid2X2,
  Hash,
  History,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Search,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Vault,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel, ProgressRing, SectionTitle, StatusPill } from "@/components/kit";
import { documentService } from "@/lib/services/document-service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { expiryTimeline, healthMeta, readiness, vaultCategories, vaultDocs, type VaultDoc } from "@/lib/finpilot-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customer/vault")({
  head: () => ({
    meta: [
      { title: "Secure Document Vault · FinPilot AI" },
      {
        name: "description",
        content:
          "An institution-managed encrypted document vault with AI categorisation, OCR extraction, expiry monitoring and one-tap document reuse across applications.",
      },
    ],
  }),
  component: VaultPage,
});

const sidebarExtra = [
  { id: "recent", label: "Recent" },
  { id: "favourites", label: "Favourites" },
  { id: "shared", label: "Shared Documents" },
  { id: "trash", label: "Trash" },
];

function VaultPage() {
  const [activeTab, setActiveTab] = useState<"documents" | "health">("documents");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<VaultDoc | null>(null);
  const [reuseOpen, setReuseOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customDocs, setCustomDocs] = useState<VaultDoc[]>([]);

  const docs = useMemo(() => {
    const combined = [...customDocs, ...vaultDocs];
    return combined.filter((d) => {
      const matchCat =
        filter === "all" ||
        filter === "recent" ||
        (filter === "favourites" ? d.favourite : filter === "shared" ? d.shared : d.category === filter);
      const matchQ =
        !query ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      return matchCat && matchQ && filter !== "trash";
    });
  }, [filter, query, customDocs]);

  const startUpload = async (file?: File) => {
    setUploading(true);
    setProgress(30);
    try {
      if (file) {
        await documentService.uploadDocument(file, "identity");
        const newDoc: VaultDoc = {
          id: `doc-${Date.now()}`,
          name: file.name,
          category: "identity",
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploaded: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          versions: 1,
          favourite: true,
          shared: false,
          health: "valid",
          tags: ["KYC", "Verified"],
        };
        setCustomDocs((prev) => [newDoc, ...prev]);
        toast.success(`Document '${file.name}' uploaded & saved to database!`);
      } else {
        toast.info("Opening device file selector...");
      }
      setProgress(100);
    } catch {
      toast.error("Upload failed");
    } finally {
      setTimeout(() => setUploading(false), 600);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startUpload(file);
    }
  };

  return (
    <PortalShell
      role="customer"
      title="Secure Document Vault"
      subtitle="Institution-managed, end-to-end encrypted. Upload once, reuse everywhere."
    >
      <div className="space-y-5">
        {/* Smart Reuse Banner */}
        <AnimatePresence>
          {reuseOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass-strong relative overflow-hidden rounded-2xl p-4"
            >
              <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/20 blur-3xl" />
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid size-10 place-items-center rounded-xl bg-brand text-white shadow-glow">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold text-foreground">
                    Smart reuse for your Home Loan application
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Aadhaar, PAN and Salary Slip already exist and are valid. Reuse them instead of uploading again.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl bg-brand text-white" onClick={() => setReuseOpen(false)}>
                    Reuse existing
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => fileInputRef.current?.click()}>
                    Upload new
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Vault Workspace Grid */}
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Left Navigation Sidebar */}
          <GlassPanel hover={false} className="h-max p-3 space-y-4">
            <div>
              <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Folders
              </p>
              <ul className="space-y-1">
                <li>
                  <FolderButton active={filter === "all"} onClick={() => setFilter("all")} label="All Documents" count={vaultDocs.length} icon={Vault} />
                </li>
                {vaultCategories.map((c) => (
                  <li key={c.id}>
                    <FolderButton
                      active={filter === c.id}
                      onClick={() => setFilter(c.id)}
                      label={c.label}
                      count={c.count}
                      icon={c.icon}
                      tint={c.tint}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Library
              </p>
              <ul className="space-y-1">
                {sidebarExtra.map((s) => (
                  <li key={s.id}>
                    <FolderButton active={filter === s.id} onClick={() => setFilter(s.id)} label={s.label} icon={FileText} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/70 bg-card/50 p-3">
              <p className="text-xs font-medium">Storage Used</p>
              <Progress value={38} className="mt-2 h-1.5" />
              <p className="mt-2 text-[11px] text-muted-foreground">3.8 GB of 10 GB</p>
            </div>
          </GlassPanel>

          {/* Primary View Area (DOCUMENTS FIRST!) */}
          <div className="space-y-4">
            {/* View Switcher & Search Bar */}
            <GlassPanel hover={false} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("documents")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === "documents"
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "glass hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Vault className="size-4" />
                    <span>All Documents ({docs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("health")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === "health"
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "glass hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Activity className="size-4" />
                    <span>Document Health & Expiry</span>
                    <span className="rounded-full bg-warning/20 text-warning px-2 py-0.5 text-[10px]">
                      4 Alerts
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border border-border/70 p-0.5">
                    {(["grid", "list"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        aria-label={`${v} view`}
                        className={cn(
                          "grid size-8 place-items-center rounded-lg transition-colors",
                          view === v ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {v === "grid" ? <Grid2X2 className="size-4" /> : <LayoutList className="size-4" />}
                      </button>
                    ))}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  />
                  <Button size="sm" className="h-9 rounded-xl bg-brand text-white shadow-glow" onClick={() => fileInputRef.current?.click()}>
                    <CloudUpload className="size-4 mr-1" /> Select File from Device
                  </Button>
                </div>
              </div>

              {/* Search & Drag Drop Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search inside Aadhaar, PAN, Bank Statements, Salary Slips…"
                    className="h-10 rounded-xl pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-10 rounded-xl">
                  <Filter className="size-4 mr-1" /> Filter
                </Button>
              </div>

              {/* Compact Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  startUpload();
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl border border-dashed border-border/80 px-4 py-2.5 transition-all",
                  dragging && "border-primary bg-primary/6 shadow-glow",
                )}
              >
                <AnimatePresence mode="wait">
                  {uploading ? (
                    <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        {progress < 100 ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <Sparkles className="size-4 text-success" />
                        )}
                        {progress < 100 ? "Scanning & categorising with AI…" : "Uploaded & verified"}
                      </div>
                      <Progress value={progress} className="w-32 h-1.5" />
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-full items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <CloudUpload className={cn("size-4 text-primary", dragging && "animate-bounce")} />
                        <span>Drag & drop files here (PDF, PNG, JPG up to 25MB)</span>
                      </span>
                      <span className="font-medium text-foreground text-[11px]">AI Auto-Categorisation</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassPanel>

            {/* TAB 1: ALL DOCUMENTS IN PRIMARY EYESIGHT */}
            {activeTab === "documents" && (
              <GlassPanel hover={false} className="p-5">
                <SectionTitle
                  title={filter === "all" ? "All Documents" : vaultCategories.find((c) => c.id === filter)?.label ?? "Library"}
                  action={<span className="text-xs font-semibold text-muted-foreground">{docs.length} Items Available</span>}
                />

                {docs.length === 0 ? (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-border py-14 text-center">
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Vault className="size-5" />
                    </span>
                    <p className="mt-3 text-sm font-medium">Nothing stored here yet</p>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      Upload a document and FinPilot AI will classify it into the right folder automatically.
                    </p>
                    <Button className="mt-4 rounded-xl bg-brand text-white" onClick={() => startUpload()}>
                      <CloudUpload className="size-4" /> Upload document
                    </Button>
                  </div>
                ) : view === "grid" ? (
                  <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {docs.map((d, i) => (
                        <motion.button
                          key={d.id}
                          layout
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ type: "spring", stiffness: 160, damping: 20, delay: i * 0.02 }}
                          onClick={() => setSelected(d)}
                          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-float"
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                              <FileText className="size-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{d.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {d.size} · {d.uploaded} · v{d.versions}
                              </p>
                            </div>
                            {d.favourite && <Star className="size-4 fill-warning text-warning" />}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", healthMeta[d.health].className)}>
                              {healthMeta[d.health].label}
                            </span>
                            {d.tags.map((t) => (
                              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                <Hash className="mr-0.5 inline size-2.5" />
                                {t}
                              </span>
                            ))}
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2.5 font-semibold">Document Name</th>
                          <th className="py-2.5 font-semibold">Verification Status</th>
                          <th className="py-2.5 font-semibold">Size</th>
                          <th className="py-2.5 font-semibold">Uploaded Date</th>
                          <th className="py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {docs.map((d) => (
                          <tr
                            key={d.id}
                            onClick={() => setSelected(d)}
                            className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/50"
                          >
                            <td className="flex items-center gap-2.5 py-3 font-semibold text-foreground">
                              <FileText className="size-4 text-primary" /> {d.name}
                            </td>
                            <td>
                              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", healthMeta[d.health].className)}>
                                {healthMeta[d.health].label}
                              </span>
                            </td>
                            <td className="text-muted-foreground">{d.size}</td>
                            <td className="text-muted-foreground">{d.uploaded}</td>
                            <td className="text-right">
                              <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassPanel>
            )}

            {/* TAB 2: HEALTH & EXPIRY ANALYTICS */}
            {activeTab === "health" && (
              <div className="grid gap-4 xl:grid-cols-3">
                <GlassPanel className="p-5" hover={false}>
                  <SectionTitle title="Overall Document Health" />
                  <div className="flex items-center gap-4">
                    <ProgressRing value={92} size={104} label="Overall" />
                    <ul className="flex-1 space-y-2">
                      {readiness.map((r) => (
                        <li key={r.label} className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              r.value >= 90 ? "bg-success" : r.value >= 60 ? "bg-warning" : "bg-destructive",
                            )}
                          />
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="ml-auto font-medium tabular-nums">{r.value}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5 xl:col-span-2" hover={false}>
                  <SectionTitle
                    title="AI Expiry Manager & Notifications"
                    action={<StatusPill tone="warning">4 Need Renewal</StatusPill>}
                  />
                  <ul className="space-y-2">
                    {expiryTimeline.map((e) => (
                      <li
                        key={e.doc}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-3 py-2.5"
                      >
                        <span className={cn("size-2 shrink-0 rounded-full", healthMeta[e.health].dot)} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{e.doc}</p>
                          <p className="truncate text-[11px] text-muted-foreground">May affect: {e.impact}</p>
                        </div>
                        <StatusPill tone={e.days < 0 ? "danger" : e.days <= 10 ? "warning" : "info"}>
                          {e.days < 0 ? `Expired ${-e.days}d ago` : `${e.days} days left`}
                        </StatusPill>
                        <Button size="sm" variant="ghost" className="rounded-lg text-xs">
                          Remind me
                        </Button>
                      </li>
                    ))}
                  </ul>
                </GlassPanel>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Document Details Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" /> {selected?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-xl border border-border bg-muted/40">
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="rotate-[-24deg] text-4xl font-bold text-foreground/5">FINPILOT · CONFIDENTIAL</span>
              </div>
              <div className="space-y-2 p-8 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Secure watermarked preview · download restricted</p>
              </div>
              <span className="animate-scan absolute inset-x-0 h-px bg-primary/50" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI extracted fields</p>
                <ul className="mt-2 space-y-1.5">
                  {(selected?.extracted ?? [{ label: "Document type", value: "Auto-detected" }]).map((f) => (
                    <li key={f.label} className="flex justify-between rounded-lg bg-muted/60 px-3 py-1.5 text-xs">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-medium">{f.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-primary/8 p-3 text-xs">
                <p className="flex items-center gap-1.5 font-medium text-primary">
                  <Sparkles className="size-3.5" /> AI summary
                </p>
                <p className="mt-1 text-muted-foreground">
                  Verified identity document matching your KYC profile. Quality score 98/100, no blur detected, no
                  duplicates in your vault.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-lg"><Download className="size-3.5 mr-1" /> Download</Button>
                <Button size="sm" variant="outline" className="rounded-lg"><Share2 className="size-3.5 mr-1" /> Share with consent</Button>
                <Button size="sm" variant="outline" className="rounded-lg"><History className="size-3.5 mr-1" /> v{selected?.versions} history</Button>
                <Button size="sm" variant="ghost" className="rounded-lg text-destructive"><Trash2 className="size-3.5 mr-1" /> Delete</Button>
              </div>
              <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                Every access is written to the audit log. Sharing requires explicit consent and can be revoked anytime.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}

function FolderButton({
  label,
  count,
  icon: Icon,
  active,
  onClick,
  tint,
}: {
  label: string;
  count?: number;
  icon: React.ElementType;
  active?: boolean;
  onClick: () => void;
  tint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
        active ? "bg-primary/10 font-semibold text-primary" : "text-foreground/85 hover:bg-accent",
      )}
    >
      <Icon className={cn("size-4", active ? "text-primary" : tint ?? "text-muted-foreground")} />
      <span className="truncate">{label}</span>
      {count !== undefined ? (
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">{count}</span>
      ) : (
        <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

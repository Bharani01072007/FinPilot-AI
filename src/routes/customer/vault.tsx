import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
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
      { property: "og:title", content: "Secure Document Vault · FinPilot AI" },
      {
        property: "og:description",
        content: "Store, organise and reuse financial documents securely with AI expiry alerts and readiness scoring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<VaultDoc | null>(null);
  const [reuseOpen, setReuseOpen] = useState(true);

  const docs = useMemo(() => {
    return vaultDocs.filter((d) => {
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
  }, [filter, query]);

  const startUpload = async (file?: File) => {
    setUploading(true);
    setProgress(20);
    try {
      if (file) {
        await documentService.uploadDocument(file, "identity");
      }
      setProgress(100);
      toast.success("Document uploaded & processed via Vault AI!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setTimeout(() => setUploading(false), 600);
    }
  };

  return (
    <PortalShell
      role="customer"
      title="Secure Document Vault"
      subtitle="Institution-managed, end-to-end encrypted. Upload once, reuse everywhere."
    >
      <div className="space-y-6">
        <AnimatePresence>
          {reuseOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass-strong relative overflow-hidden rounded-2xl p-5"
            >
              <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/20 blur-3xl" />
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand text-white shadow-glow">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold">
                    Smart reuse for your Home Loan application
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Aadhaar, PAN and Salary Slip already exist and are valid. Reuse them instead of uploading again —
                    saves about 9 minutes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="rounded-xl bg-brand text-white" onClick={() => setReuseOpen(false)}>
                    Reuse existing
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => startUpload()}>
                    Upload new
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <GlassPanel hover={false} className="h-max p-3">
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
            <p className="px-2 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Library
            </p>
            <ul className="space-y-1">
              {sidebarExtra.map((s) => (
                <li key={s.id}>
                  <FolderButton active={filter === s.id} onClick={() => setFilter(s.id)} label={s.label} icon={FileText} />
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-border/70 bg-card/50 p-3">
              <p className="text-xs font-medium">Storage</p>
              <Progress value={38} className="mt-2 h-1.5" />
              <p className="mt-2 text-[11px] text-muted-foreground">3.8 GB of 10 GB used</p>
            </div>
          </GlassPanel>

          <div className="space-y-4">
            <GlassPanel hover={false} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Semantic search inside documents…"
                    className="h-10 rounded-xl pl-9"
                  />
                </div>
                <Button variant="outline" className="h-10 rounded-xl">
                  <Filter className="size-4" /> Filters
                </Button>
                <div className="flex rounded-xl border border-border/70 p-0.5">
                  {(["grid", "list"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      aria-label={`${v} view`}
                      className={cn(
                        "grid size-9 place-items-center rounded-lg transition-colors",
                        view === v ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {v === "grid" ? <Grid2X2 className="size-4" /> : <LayoutList className="size-4" />}
                    </button>
                  ))}
                </div>
                <Button className="h-10 rounded-xl bg-brand text-white shadow-glow" onClick={() => startUpload()}>
                  <CloudUpload className="size-4" /> Upload
                </Button>
              </div>

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
                  "mt-4 grid place-items-center rounded-2xl border-2 border-dashed border-border px-6 py-7 text-center transition-all",
                  dragging && "border-primary bg-primary/6 shadow-glow",
                )}
              >
                <AnimatePresence mode="wait">
                  {uploading ? (
                    <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
                      <div className="flex items-center gap-2 text-sm">
                        {progress < 100 ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <Sparkles className="size-4 text-success" />
                        )}
                        {progress < 100 ? "Uploading & scanning with AI…" : "Uploaded · AI categorised as Identity"}
                      </div>
                      <Progress value={progress} className="mt-3 h-2" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {progress < 100 ? "OCR extraction in progress · chunked upload · resumable" : "0 duplicates · quality check passed"}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <CloudUpload className={cn("mx-auto size-7 text-muted-foreground", dragging && "text-primary")} />
                      <p className="mt-2 text-sm font-medium">Drag & drop documents here</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, JPG, PNG up to 25 MB · AI detects type, duplicates and blurry scans
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassPanel>

            <div className="grid gap-4 xl:grid-cols-3">
              <GlassPanel className="p-5" hover={false}>
                <SectionTitle title="Document health" />
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
                  title="AI Document Expiry Manager"
                  action={<StatusPill tone="warning">4 need attention</StatusPill>}
                />
                <ul className="space-y-2">
                  {expiryTimeline.map((e) => (
                    <li
                      key={e.doc}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-3 py-2.5"
                    >
                      <span className={cn("size-2 shrink-0 rounded-full", healthMeta[e.health].dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.doc}</p>
                        <p className="truncate text-[11px] text-muted-foreground">May affect: {e.impact}</p>
                      </div>
                      <StatusPill tone={e.days < 0 ? "danger" : e.days <= 10 ? "warning" : "info"}>
                        {e.days < 0 ? `Expired ${-e.days}d ago` : `${e.days} days left`}
                      </StatusPill>
                      <Button size="sm" variant="ghost" className="rounded-lg">
                        Remind me
                      </Button>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            </div>

            <GlassPanel hover={false} className="p-5">
              <SectionTitle
                title={filter === "all" ? "All documents" : vaultCategories.find((c) => c.id === filter)?.label ?? "Library"}
                action={<span className="text-xs text-muted-foreground">{docs.length} items</span>}
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
                        transition={{ type: "spring", stiffness: 160, damping: 20, delay: i * 0.03 }}
                        onClick={() => setSelected(d)}
                        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-float"
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <FileText className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{d.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {d.size} · {d.uploaded} · v{d.versions}
                            </p>
                          </div>
                          {d.favourite && <Star className="size-4 fill-warning text-warning" />}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", healthMeta[d.health].className)}>
                            {healthMeta[d.health].label}
                          </span>
                          {d.tags.map((t) => (
                            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              <Hash className="mr-0.5 inline size-2.5" />
                              {t}
                            </span>
                          ))}
                        </div>
                        <span className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="animate-scan absolute inset-x-0 h-px bg-primary/40" />
                        </span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 font-medium">Name</th>
                        <th className="py-2 font-medium">Status</th>
                        <th className="py-2 font-medium">Size</th>
                        <th className="py-2 font-medium">Uploaded</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((d) => (
                        <tr
                          key={d.id}
                          onClick={() => setSelected(d)}
                          className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/50"
                        >
                          <td className="flex items-center gap-2 py-3">
                            <FileText className="size-4 text-primary" /> {d.name}
                          </td>
                          <td>
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", healthMeta[d.health].className)}>
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
          </div>
        </div>
      </div>

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
                <Button size="sm" variant="outline" className="rounded-lg"><Download className="size-3.5" /> Download</Button>
                <Button size="sm" variant="outline" className="rounded-lg"><Share2 className="size-3.5" /> Share with consent</Button>
                <Button size="sm" variant="outline" className="rounded-lg"><History className="size-3.5" /> v{selected?.versions} history</Button>
                <Button size="sm" variant="ghost" className="rounded-lg text-destructive"><Trash2 className="size-3.5" /> Delete</Button>
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
        active ? "bg-primary/10 font-medium text-primary" : "text-foreground/85 hover:bg-accent",
      )}
    >
      <Icon className={cn("size-4", active ? "text-primary" : tint ?? "text-muted-foreground")} />
      <span className="truncate">{label}</span>
      {count !== undefined ? (
        <span className="ml-auto text-[11px] text-muted-foreground">{count}</span>
      ) : (
        <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

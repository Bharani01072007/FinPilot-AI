import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, FileCheck, ShieldCheck, Sparkles, User, BookOpen } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/services/ai-service";

export const Route = createFileRoute("/employee/assistant")({
  head: () => ({
    meta: [
      { title: "Employee Operations AI Copilot · FinPilot AI" },
      {
        name: "description",
        content:
          "Internal operations AI copilot for underwriting guidelines, document verification rules, and RBI compliance lookup.",
      },
    ],
  }),
  component: EmployeeAssistantPage,
});

type Msg = { id: number; role: "user" | "assistant"; text: string; sources?: any[] };

const opsPrompts = [
  "What is the maximum DTI ratio for fast-track approval?",
  "How to verify salary slip authenticity & TDS Match?",
  "Explain RBI e-KYC compliance requirements §12",
  "SLA escalation protocol for high-risk applications",
];

function EmployeeAssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hello Priya — I am your Operations & Underwriting AI Copilot. Ask me about credit policy rules, document verification SOPs, or RBI compliance standards.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [sessionId] = useState(() => `emp-session-${Date.now()}`);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const uid = Date.now();
    setMessages((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setStreaming(true);
    const aid = uid + 1;
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Consulting Underwriting Policy Index & RBI Guidelines..." }]);

    try {
      const res = await aiService.querySupportAssistant(`[Employee Ops] ${text}`, sessionId);
      setMessages((m) =>
        m.map((msg) => (msg.id === aid ? { ...msg, text: res.answer, sources: res.sources } : msg))
      );
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aid
            ? { ...msg, text: "Underwriting policy rule §4.2: Maximum allowable DTI ratio is 45.0% for prime applicants." }
            : msg
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <PortalShell role="employee" title="Employee Operations AI Copilot" subtitle="Instant underwriting policy lookup, document verification SOPs, and RBI compliance guidance.">
      <GlassPanel hover={false} className="flex h-[calc(100vh-15rem)] min-h-[540px] flex-col p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </span>
            <p className="text-xs font-semibold text-foreground">Underwriting & Compliance AI Assistant</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1">
            <ShieldCheck className="size-3" /> Policy Engine v2.4
          </span>
        </div>

        <div className="scrollbar-slim flex-1 space-y-5 overflow-y-auto p-5">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                className={cn("flex gap-3", m.role === "user" && "justify-end")}
              >
                {m.role === "assistant" && (
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand text-white">
                    <Bot className="size-4" />
                  </span>
                )}
                <div className="space-y-2 max-w-[min(46rem,80%)]">
                  <div
                    className={cn(
                      "text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground font-medium"
                        : "glass rounded-2xl rounded-tl-md p-4 text-foreground border-border/70",
                    )}
                  >
                    {m.text}
                    {m.role === "assistant" && streaming && m.text && (
                      <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" />
                    )}
                  </div>

                  {m.sources && m.sources.length > 0 && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                      <p className="font-semibold text-primary flex items-center gap-1">
                        <BookOpen className="size-3" /> Policy References:
                      </p>
                      {m.sources.map((s, idx) => (
                        <p key={idx} className="text-muted-foreground text-[11px]">
                          • <span className="font-medium text-foreground">{s.title}:</span> {s.excerpt}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-muted">
                    <User className="size-4" />
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        <div className="border-t border-border/60 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {opsPrompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Sparkles className="mr-1 inline size-3 text-primary" />
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-2xl border border-border/70 bg-card/60 p-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask Copilot about underwriting rules, DTI ratios, or SOP guidelines..."
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            />
            <Button type="submit" size="icon" className="rounded-xl bg-brand text-white shadow-glow" disabled={streaming}>
              <ArrowUp className="size-4" />
            </Button>
          </form>
        </div>
      </GlassPanel>
    </PortalShell>
  );
}

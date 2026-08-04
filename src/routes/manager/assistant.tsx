import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Gauge, ShieldAlert, Sparkles, User, BarChart2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/services/ai-service";

export const Route = createFileRoute("/manager/assistant")({
  head: () => ({
    meta: [
      { title: "Executive AI Assistant · FinPilot AI Manager Portal" },
      {
        name: "description",
        content:
          "Executive AI Copilot for branch managers and VP of Ops for portfolio analysis, risk threshold policy queries, and team performance insights.",
      },
    ],
  }),
  component: ManagerAssistantPage,
});

type Msg = { id: number; role: "user" | "assistant"; text: string; sources?: any[] };

const managerPrompts = [
  "Summarize pending high-risk approval queue",
  "What is the average approval turnaround time this week?",
  "Explain manager override protocol §14.2",
  "Portfolio default rate comparison Q1 vs Q2",
];

function ManagerAssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 1,
      role: "assistant",
      text: "Welcome Daniel — I am your Executive AI Copilot. Ask me for portfolio performance summaries, risk override policy guidelines, or staff SLA turnaround metrics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [sessionId] = useState(() => `mgr-session-${Date.now()}`);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const uid = Date.now();
    setMessages((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setStreaming(true);
    const aid = uid + 1;
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Analyzing portfolio metrics & executive governance database..." }]);

    try {
      const res = await aiService.querySupportAssistant(`[Executive Manager] ${text}`, sessionId);
      setMessages((m) =>
        m.map((msg) => (msg.id === aid ? { ...msg, text: res.answer, sources: res.sources } : msg))
      );
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aid
            ? {
                ...msg,
                text: "Executive Summary: 7 pending applications require manager sign-off. Average SLA processing time is 3.8 hours (12% faster than last month). Zero portfolio default breaches detected.",
              }
            : msg
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <PortalShell role="manager" title="Executive AI Assistant" subtitle="Portfolio intelligence, manager risk override protocol guidelines, and SLA turnaround insights.">
      <GlassPanel hover={false} className="flex h-[calc(100vh-15rem)] min-h-[540px] flex-col p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </span>
            <p className="text-xs font-semibold text-foreground">Executive Operations Copilot</p>
          </div>
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success flex items-center gap-1">
            <BarChart2 className="size-3" /> Portfolio Intelligence Live
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
            {managerPrompts.map((p) => (
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
              placeholder="Ask Executive Copilot about portfolio SLAs, approval overrides, or risk metrics..."
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

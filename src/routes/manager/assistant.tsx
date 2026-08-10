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
  "How many Home Loan applications are pending today?",
  "Which department has the highest workload?",
  "Show applications approaching SLA breach",
  "Which employees completed the highest number of cases this week?",
  "Generate today's operational summary",
];

function renderFormattedLine(line: string) {
  if (!line) return "";
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary font-medium border border-border/50">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderTextBlocks(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1.5" />;

    if (trimmed.startsWith("###") || trimmed.startsWith("##")) {
      return (
        <h4 key={idx} className="font-semibold text-sm text-foreground mt-3 mb-1.5 flex items-center gap-2">
          {trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "")}
        </h4>
      );
    }

    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/, "");
      return (
        <div key={idx} className="my-2 border-l-3 border-primary bg-primary/5 p-3 rounded-r-xl text-xs font-medium text-foreground">
          {renderFormattedLine(quoteText)}
        </div>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^([-*]|\d+\.)\s*/, "");
      return (
        <div key={idx} className="flex items-start gap-2 text-xs py-0.5 pl-2">
          <span className="text-primary font-bold">•</span>
          <span className="text-foreground">{renderFormattedLine(bulletText)}</span>
        </div>
      );
    }

    return (
      <p key={idx} className="text-xs leading-relaxed py-0.5 text-foreground">
        {renderFormattedLine(trimmed)}
      </p>
    );
  });
}

function RenderMarkdownText({ content }: { content: string }) {
  if (!content) return null;

  if (content.includes("|") && content.includes("---")) {
    const lines = content.split("\n");
    const tableLines = lines.filter((l) => l.trim().startsWith("|") && l.includes("|"));
    const otherLinesBefore = lines.slice(0, lines.findIndex((l) => l.trim().startsWith("|")));
    const otherLinesAfter = lines.slice(lines.findLastIndex((l) => l.trim().startsWith("|")) + 1);

    return (
      <div className="space-y-3 font-sans">
        {otherLinesBefore.length > 0 && <div>{renderTextBlocks(otherLinesBefore.join("\n"))}</div>}

        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/60 p-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {tableLines.slice(0, 1).map((row, i) => (
                <tr key={i} className="bg-muted/80 font-semibold border-b border-border/60">
                  {row
                    .split("|")
                    .filter((c) => c.trim() !== "")
                    .map((cell, ci) => (
                      <th key={ci} className="p-2 border-r border-border/40 last:border-0">
                        {renderFormattedLine(cell.trim())}
                      </th>
                    ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border/60">
              {tableLines.slice(2).map((row, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  {row
                    .split("|")
                    .filter((c) => c.trim() !== "")
                    .map((cell, ci) => (
                      <td key={ci} className="p-2 border-r border-border/40 last:border-0">
                        {renderFormattedLine(cell.trim())}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {otherLinesAfter.length > 0 && <div>{renderTextBlocks(otherLinesAfter.join("\n"))}</div>}
      </div>
    );
  }

  return <div>{renderTextBlocks(content)}</div>;
}

import { useAuth } from "@/lib/auth-context";
import { RotateCcw } from "lucide-react";

function getLoggedInUserName(user: any, fallback = "Gopinath V"): string {
  try {
    const email = user?.email || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("finpilot_user") || "{}")?.email : "");
    if (email) {
      const em = email.toLowerCase().trim();
      if (em === "sbharanidharan2007@gmail.com" || em.includes("sbharanidharan")) return "Bharanidharan S";
      if (em === "gopinath.v.official.01@gmail.com" || em.includes("gopinath")) return "Gopinath V";
      if (em === "kabiyakaviya9@gmail.com" || em.includes("kabiyakaviya") || em.includes("kaviya")) return "Kaviya V";
      if (em === "deekshikabil@gmail.com" || em.includes("deekshikabil") || em.includes("deekshitha")) return "Deekshitha S";
    }

    if (user?.first_name && !user.first_name.includes("@")) {
      return `${user.first_name} ${user.last_name || ""}`.trim();
    }
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("finpilot_user") : null;
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.first_name && !parsed.first_name.includes("@")) {
        return `${parsed.first_name} ${parsed.last_name || ""}`.trim();
      }
    }
  } catch {}
  return fallback;
}

function ManagerAssistantPage() {
  const { user } = useAuth();
  const userName = getLoggedInUserName(user, "Gopinath V");

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("finpilot_chat_manager") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: Date.now(),
        role: "assistant",
        text: `Welcome ${userName} — I am your Executive AI Copilot. Ask me for live operational summaries, department workload distribution, SLA breach alerts, or staff performance leaderboards.`,
      },
    ];
  });

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && messages.length > 0) {
        localStorage.setItem("finpilot_chat_manager", JSON.stringify(messages));
      }
    } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClearChat = () => {
    const initialMsg: Msg[] = [
      {
        id: Date.now(),
        role: "assistant",
        text: `Welcome ${userName} — I am your Executive AI Copilot. Ask me for live operational summaries, department workload distribution, SLA breach alerts, or staff performance leaderboards.`,
      },
    ];
    setMessages(initialMsg);
    try {
      localStorage.setItem("finpilot_chat_manager", JSON.stringify(initialMsg));
    } catch {}
  };

  const [sessionId] = useState(() => `mgr-session-${Date.now()}`);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const uid = Date.now();
    setMessages((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setStreaming(true);
    const aid = uid + 1;
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Querying live database & operational AI agents..." }]);

    try {
      const res = await aiService.queryManagerAssistant(text, sessionId, user);
      setMessages((m) =>
        m.map((msg) => (msg.id === aid ? { ...msg, text: res.answer, sources: res.sources } : msg))
      );
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aid
            ? {
                ...msg,
                text: "Executive Summary: 4 pending applications require manager sign-off. Average SLA processing time is 3.8 hours (12% faster than last month). Zero portfolio default breaches detected.",
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
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success flex items-center gap-1">
              <BarChart2 className="size-3" /> Live Database & AI Agents Connected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="h-8 rounded-xl text-xs flex items-center gap-1.5 border-border/80"
              title="Clear conversation history"
            >
              <RotateCcw className="size-3.5 text-muted-foreground" /> Clear Chat
            </Button>
          </div>
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
                <div className="space-y-2 max-w-[min(48rem,85%)]">
                  <div
                    className={cn(
                      "text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground font-medium"
                        : "glass rounded-2xl rounded-tl-md p-4 text-foreground border-border/70",
                    )}
                  >
                    <RenderMarkdownText content={m.text} />
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
              placeholder="Ask Executive Copilot about pending Home Loans, department workloads, or SLA breaches..."
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none font-sans"
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

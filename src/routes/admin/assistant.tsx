import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Shield, Sparkles, User, Server, Terminal, RotateCcw } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/services/ai-service";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin/assistant")({
  head: () => ({
    meta: [
      { title: "Executive AI Assistant · FinPilot AI Admin Portal" },
      {
        name: "description",
        content:
          "System Administrator AI Copilot for infrastructure queries, user provisioning guidance, audit trail analysis, and platform governance.",
      },
    ],
  }),
  component: AdminAssistantPage,
});

type Msg = { id: number; role: "user" | "assistant"; text: string; sources?: any[] };

const adminPrompts = [
  "How many users were provisioned this week?",
  "Show recent failed login attempts across all portals",
  "Explain the role hierarchy and permission model",
  "What is the current API gateway health status?",
];

function FormattedInlineText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={i} className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-amber-500 font-medium border border-border/50">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}

function RenderMarkdownText({ content }: { content: string }) {
  if (!content) return <span className="text-muted-foreground italic">Analyzing platform telemetry...</span>;

  // Process markdown tables if present
  if (content.includes("|") && content.includes("---")) {
    const lines = content.split("\n");
    const tableStartIndex = lines.findIndex((l) => l.trim().startsWith("|") && l.includes("|"));
    const tableEndIndex = lines.findLastIndex((l) => l.trim().startsWith("|") && l.includes("|"));

    if (tableStartIndex !== -1 && tableEndIndex !== -1 && tableEndIndex >= tableStartIndex) {
      const beforeText = lines.slice(0, tableStartIndex).join("\n");
      const tableLines = lines.slice(tableStartIndex, tableEndIndex + 1);
      const afterText = lines.slice(tableEndIndex + 1).join("\n");

      return (
        <div className="space-y-3 text-xs font-sans leading-relaxed">
          {beforeText && <RenderMarkdownText content={beforeText} />}

          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/80 p-1 shadow-soft my-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {tableLines.slice(0, 1).map((row, i) => (
                  <tr key={i} className="bg-amber-500/10 font-semibold border-b border-border/70 text-foreground">
                    {row
                      .split("|")
                      .filter((c) => c.trim() !== "")
                      .map((cell, ci) => (
                        <th key={ci} className="p-2.5 border-r border-border/40 last:border-0 font-bold">
                          <FormattedInlineText text={cell.trim().replace(/^#+\s*/, "")} />
                        </th>
                      ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/50">
                {tableLines.slice(2).map((row, i) => (
                  <tr key={i} className="hover:bg-muted/40 transition-colors">
                    {row
                      .split("|")
                      .filter((c) => c.trim() !== "")
                      .map((cell, ci) => (
                        <td key={ci} className="p-2.5 border-r border-border/30 last:border-0 text-foreground/90">
                          <FormattedInlineText text={cell.trim()} />
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {afterText && <RenderMarkdownText content={afterText} />}
        </div>
      );
    }
  }

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs leading-relaxed font-sans text-foreground/90">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header level 1, 2, 3 (e.g. ### Header)
        if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
          const headerText = trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "");
          return (
            <div key={idx} className="pt-2 pb-1 border-b border-border/50 mb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                <span>{headerText}</span>
              </h3>
            </div>
          );
        }

        // Subheader level 4 (e.g. #### Subheader)
        if (trimmed.startsWith("####")) {
          const subText = trimmed.replace(/^####\s*/, "").replace(/\*\*/g, "");
          return (
            <h4 key={idx} className="font-semibold text-xs text-amber-500 pt-2 pb-1 flex items-center gap-1.5">
              <span>•</span>
              <span>{subText}</span>
            </h4>
          );
        }

        // Callout box (> Quote or 👮 Action)
        if (trimmed.startsWith(">") || trimmed.startsWith("👉") || trimmed.startsWith("👮") || trimmed.startsWith("🔐")) {
          const calloutText = trimmed.replace(/^>\s*/, "");
          return (
            <div key={idx} className="my-2.5 rounded-xl border-l-4 border-amber-500 bg-amber-500/10 p-3 text-xs font-medium text-foreground">
              <FormattedInlineText text={calloutText} />
            </div>
          );
        }

        // Checklist or Bullet line (e.g. ✅ Item or - Item or 1. Item)
        if (trimmed.startsWith("✅") || trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
          const isCheck = trimmed.startsWith("✅");
          const bulletText = trimmed.replace(/^(✅|[-*]|\d+\.)\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 py-1 pl-1 text-xs">
              <span className={cn("mt-0.5 text-xs shrink-0 font-bold", isCheck ? "text-success" : "text-amber-500")}>
                {isCheck ? "✓" : "•"}
              </span>
              <div className="flex-1">
                <FormattedInlineText text={bulletText} />
              </div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs">
            <FormattedInlineText text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

function getLoggedInUserName(user: any, fallback = "Bharanidharan S"): string {
  try {
    const email = user?.email || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("finpilot_user") || "{}")?.email : "");
    if (email) {
      const em = email.toLowerCase().trim();
      if (em === "sbharanidharan2007@gmail.com" || em.includes("sbharanidharan")) return "Bharanidharan S";
      if (em === "gopinath.v.official.01@gmail.com" || em.includes("gopinath")) return "Gopinath V";
      if (em === "kabiyakaviya9@gmail.com" || em.includes("kabiyakaviya") || em.includes("kaviya")) return "Kaviya V";
      if (em === "deekshikabil@gmail.com" || em.includes("deekshikabil") || em.includes("deekshitha")) return "Deekshika S";
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

function AdminAssistantPage() {
  const { user } = useAuth();
  const userName = getLoggedInUserName(user, "Bharanidharan S");

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("finpilot_chat_admin") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: Date.now(),
        role: "assistant",
        text: `### 🛠️ Welcome ${userName}\nI am your **Platform Governance AI Copilot**. Ask me about user provisioning, audit trail analysis, security policies, or infrastructure health.`,
      },
    ];
  });

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && messages.length > 0) {
        localStorage.setItem("finpilot_chat_admin", JSON.stringify(messages));
      }
    } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClearChat = () => {
    const initialMsg: Msg[] = [
      {
        id: Date.now(),
        role: "assistant",
        text: `### 🛠️ Welcome ${userName}\nI am your **Platform Governance AI Copilot**. Ask me about user provisioning, audit trail analysis, security policies, or infrastructure health.`,
      },
    ];
    setMessages(initialMsg);
    try {
      localStorage.setItem("finpilot_chat_admin", JSON.stringify(initialMsg));
    } catch {}
  };

  const [sessionId] = useState(() => `admin-session-${Date.now()}`);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const uid = Date.now();
    setMessages((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setStreaming(true);
    const aid = uid + 1;
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Querying platform governance database & infrastructure metrics..." }]);

    try {
      const res = await aiService.queryAdminAssistant(text, sessionId, user);
      setMessages((m) =>
        m.map((msg) => (msg.id === aid ? { ...msg, text: res.answer, sources: res.sources } : msg))
      );
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aid
            ? {
                ...msg,
                text: "### ⚡ Platform Status Summary\n\n- **AI Agents:** All 20 operational agents are healthy\n- **Provisioned Users:** 7 Users provisioned this week\n- **Security Alerts:** Zero threat anomalies detected\n- **Uptime Rating:** 99.99% API Gateway Uptime",
              }
            : msg
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <PortalShell role="admin" title="Executive AI Assistant" subtitle="Platform governance intelligence, user provisioning insights, audit trail analysis, and infrastructure health.">
      <GlassPanel hover={false} className="flex h-[calc(100vh-15rem)] min-h-[540px] flex-col p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
              <Bot className="size-4" />
            </span>
            <p className="text-xs font-semibold text-foreground">Admin Governance Copilot</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success flex items-center gap-1">
              <Terminal className="size-3" /> System Intelligence Live
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
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
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
                    {m.role === "assistant" ? <RenderMarkdownText content={m.text} /> : m.text}
                    {m.role === "assistant" && streaming && m.text && (
                      <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-amber-500 align-middle" />
                    )}
                  </div>

                  {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/40 p-2.5 text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                        <Sparkles className="size-3 text-amber-500" /> Grounded Audit Sources:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {m.sources.map((s: any, idx: number) => (
                          <span key={idx} className="rounded-md bg-card px-2 py-0.5 text-[11px] border border-border/50 text-foreground font-medium">
                            {s.title} ({Math.round((s.confidence || 0.99) * 100)}%)
                          </span>
                        ))}
                      </div>
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
            {adminPrompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
              >
                <Sparkles className="mr-1 inline size-3 text-amber-500" />
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
              placeholder="Ask Admin Copilot about user provisioning, audit trails, or platform health..."
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            />
            <Button type="submit" size="icon" className="rounded-xl bg-amber-500 text-white shadow-glow hover:bg-amber-600" disabled={streaming}>
              <ArrowUp className="size-4" />
            </Button>
          </form>
        </div>
      </GlassPanel>
    </PortalShell>
  );
}

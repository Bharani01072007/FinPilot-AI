import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Mic, Paperclip, Sparkles, User } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/services/ai-service";

export const Route = createFileRoute("/customer/assistant")({
  head: () => ({
    meta: [
      { title: "AI Financial Assistant · FinPilot AI" },
      {
        name: "description",
        content:
          "Chat with the FinPilot AI financial assistant for eligibility checks, document guidance and application status explanations.",
      },
      { property: "og:title", content: "AI Financial Assistant · FinPilot AI" },
      {
        property: "og:description",
        content: "Streaming AI chat for eligibility, documents and application status inside the FinPilot customer portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

type Msg = { id: number; role: "user" | "assistant"; text: string };

const canned =
  "Based on your Secure Document Vault, you're 92% ready for a Home Loan. Aadhaar, PAN and your June salary slip are valid and can be reused instantly. Two items need attention: your Bank Statement is older than six months, and your Property Tax Receipt is missing. Refreshing the statement should keep underwriting inside the 4-hour SLA.";

const prompts = [
  "Am I eligible for a ₹70L home loan?",
  "Which documents are missing for my application?",
  "Explain my current application status",
  "When does my Driving License expire?",
];

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "assistant", text: "Hi Aarav — I can check eligibility, prepare documents and explain any decision. What would you like to do?" },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [sessionId] = useState(() => `session-${Date.now()}`);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const uid = Date.now();
    setMessages((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setStreaming(true);
    const aid = uid + 1;
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Analyzing query & consulting Document Vault RAG index..." }]);

    try {
      const res = await aiService.querySupportAssistant(text, sessionId);
      setMessages((m) => m.map((msg) => (msg.id === aid ? { ...msg, text: res.answer } : msg)));
    } catch (e) {
        console.error('AI query failed', e);
        setMessages((m) => m.map((msg) => (msg.id === aid ? { ...msg, text: `Sorry, I couldn't answer that right now. Please try again later.` } : msg)));
      } finally {
      setStreaming(false);
    }
  };

  return (
    <PortalShell role="customer" title="AI Financial Assistant" subtitle="Grounded in your vault, applications and institution policies.">
      <GlassPanel hover={false} className="flex h-[calc(100vh-15rem)] min-h-[520px] flex-col p-0">
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
                <div
                  className={cn(
                    "max-w-[min(46rem,80%)] text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {m.text || <span className="text-muted-foreground">Thinking…</span>}
                  {m.role === "assistant" && streaming && m.text && (
                    <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" />
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

        <div className="border-t border-border/60 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
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
            <Button type="button" size="icon" variant="ghost" className="rounded-xl" aria-label="Attach file">
              <Paperclip className="size-4" />
            </Button>
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
              placeholder="Ask about eligibility, documents or an application…"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            />
            <Button type="button" size="icon" variant="ghost" className="rounded-xl" aria-label="Voice input">
              <Mic className="size-4" />
            </Button>
            <Button type="submit" size="icon" className="rounded-xl bg-brand text-white" disabled={streaming} aria-label="Send">
              <ArrowUp className="size-4" />
            </Button>
          </form>
        </div>
      </GlassPanel>
    </PortalShell>
  );
}

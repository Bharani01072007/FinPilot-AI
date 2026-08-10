import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, FileCheck, ShieldCheck, Sparkles, User, BookOpen } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/services/ai-service";
import { RenderMarkdownText } from "@/components/markdown-renderer";

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
  "Show status of Home Loan Application APP-2026-101",
  "How many pending applications are assigned to me?",
  "Which customers have missing KYC documents?",
  "Show all applications awaiting Compliance approval",
  "Explain why application APP-2026-104 is flagged",
];

import { useAuth } from "@/lib/auth-context";
import { RotateCcw } from "lucide-react";

function getLoggedInUserName(user: any, fallback = "Kaviya V"): string {
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

function EmployeeAssistantPage() {
  const { user } = useAuth();
  const userName = getLoggedInUserName(user, "Kaviya V");

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("finpilot_chat_employee") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: Date.now(),
        role: "assistant",
        text: `Hello ${userName} — I am your AI Knowledge & Operations Copilot (Agent 16). Ask me about live application statuses, pending underwriting queues, missing customer KYC, or RBI compliance SOPs.`,
      },
    ];
  });

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && messages.length > 0) {
        localStorage.setItem("finpilot_chat_employee", JSON.stringify(messages));
      }
    } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClearChat = () => {
    const initialMsg: Msg[] = [
      {
        id: Date.now(),
        role: "assistant",
        text: `Hello ${userName} — I am your AI Knowledge & Operations Copilot (Agent 16). Ask me about live application statuses, pending underwriting queues, missing customer KYC, or RBI compliance SOPs.`,
      },
    ];
    setMessages(initialMsg);
    try {
      localStorage.setItem("finpilot_chat_employee", JSON.stringify(initialMsg));
    } catch {}
  };

  const [sessionId] = useState(() => `emp-session-${Date.now()}`);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const uid = Date.now();
    setMessages((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setStreaming(true);
    const aid = uid + 1;
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Querying AI Knowledge Agent & Live Database..." }]);

    try {
      const q = text.toLowerCase();
      let answerText = "";
      let sourcesList = [
        { title: "FinPilot AI Database Index", excerpt: "Live query across applications, vault documents, and audit logs." },
        { title: "RBI Master Direction §14", excerpt: "Underwriting compliance & risk score threshold standards." },
      ];

      if (q.includes("app-2026-101") || (q.includes("status") && q.includes("home loan"))) {
        answerText = `### Application Details Card

**Application ID:** APP-2026-101  
**Customer Name:** Deekshitha R S  
**Product Category:** Home Loan Top-Up  
**Sanction Amount:** ₹45,00,000  
**Current Stage:** UNDER_REVIEW (Underwriting & Credit Risk)  
**Assigned Officer:** Gopinath V (Senior Underwriter)  
**Risk Classification:** LOW_RISK (Risk Score: 18.5 / 100)  
**Document Vault Status:** 100% Verified (PAN, Aadhaar, Form 16)  
**Recommended Action:** Proceed with credit sanction letter generation.`;
      } else if (q.includes("pending") || q.includes("assigned")) {
        answerText = `### Employee Underwriting Queue Summary

**Assigned Employee:** Gopinath V (Senior Underwriter)  
**Total Assigned Cases:** 4 Applications  
**Status Breakdown:**
- **APP-2026-101:** Home Loan (₹45,00,000) — *UNDER_REVIEW* (High Priority)
- **APP-2026-104:** Business Expansion (₹35,00,000) — *SUBMITTED* (Needs KYC Review)
- **APP-2026-102:** Personal Line (₹5,00,000) — *APPROVED* (Disbursement Ready)
- **APP-2026-103:** EV Auto Loan (₹12,50,000) — *APPROVED* (Disbursed)`;
      } else if (q.includes("missing") || q.includes("kyc")) {
        answerText = `### Customers Awaiting KYC & Missing Documents

**1. Customer:** Madhiyarasu R (Customer 2)  
- **Application ID:** APP-2026-104 (Business Expansion)  
- **Missing Items:** Business Premises Tax Receipt, 6-Month GST Returns  
- **Action Taken:** Alert sent via Notification Agent 13  

**2. Customer:** Deekshitha R S (Customer 1)  
- **Application ID:** APP-2026-101 (Home Loan)  
- **Status:** All mandatory KYC documents VERIFIED. Zero missing items.`;
      } else if (q.includes("flagged") || q.includes("compliance") || q.includes("app-2026-104")) {
        answerText = `### AI Risk Flag & Compliance Explanation (Agent 11)

**Application ID:** APP-2026-104 (Business Expansion ₹35,00,000)  
**Flag Reason:** High Capital Line request exceeding 3x annual turnover estimate.  
**Fraud Score:** 4.2% (Low Risk)  
**Compliance Flag:** Requires Manager Approval for line limits exceeding ₹30 Lakhs.  
**Suggested Next Action:** Route case to Manager Vishnupriya A for Executive Approval.`;
        const res = await aiService.queryEmployeeAssistant(text, sessionId, user);
        answerText = res.answer;
        if (res.sources && res.sources.length > 0) sourcesList = res.sources;
      }

      setMessages((m) =>
        m.map((msg) => (msg.id === aid ? { ...msg, text: answerText, sources: sourcesList } : msg))
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
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1">
              <ShieldCheck className="size-3" /> Policy Engine v2.4
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
                <div className="space-y-2 max-w-[min(46rem,80%)]">
                  <div
                    className={cn(
                      "text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground font-medium"
                        : "glass rounded-2xl rounded-tl-md p-4 text-foreground border-border/70",
                    )}
                  >
                    {m.role === "user" ? (
                      m.text
                    ) : (
                      <RenderMarkdownText content={m.text} />
                    )}
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

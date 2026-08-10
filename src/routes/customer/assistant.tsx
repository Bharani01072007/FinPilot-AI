import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Globe, Mic, Paperclip, Sparkles, User } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { GlassPanel } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiService } from "@/lib/services/ai-service";

export const Route = createFileRoute("/customer/assistant")({
  head: () => ({
    meta: [
      { title: "Multilingual AI Financial Assistant · FinPilot AI" },
      {
        name: "description",
        content:
          "Chat with the FinPilot AI financial assistant in your preferred language for eligibility checks, document guidance and application status.",
      },
    ],
  }),
  component: AssistantPage,
});

type Language = "en" | "hi" | "ta" | "te" | "mr" | "gu" | "kn" | "bn" | "es";

interface LangOption {
  code: Language;
  name: string;
  native: string;
  greeting: string;
  prompts: string[];
}

const languages: Record<Language, LangOption> = {
  en: {
    code: "en",
    name: "English",
    native: "English",
    greeting: "Hi Aarav — I am your FinPilot AI Financial Copilot. How can I assist you with your loans or document vault today?",
    prompts: [
      "Am I eligible for a ₹70L home loan?",
      "Which documents are missing for my application?",
      "Explain my current application status",
      "When does my Driving License expire?",
    ],
  },
  hi: {
    code: "hi",
    name: "Hindi",
    native: "हिंदी",
    greeting: "नमस्ते आरव — मैं आपका फिनपायलट एआई वित्तीय सहायक हूँ। आज मैं ऋण या दस्तावेज़ वॉल्ट में आपकी कैसे मदद कर सकता हूँ?",
    prompts: [
      "क्या मैं ₹70 लाख के होम लोन के लिए पात्र हूँ?",
      "मेरे आवेदन में कौन से दस्तावेज़ गायब हैं?",
      "मेरी वर्तमान आवेदन स्थिति समझाएं",
      "मेरा ड्राइविंग लाइसेंस कब समाप्त होता है?",
    ],
  },
  ta: {
    code: "ta",
    name: "Tamil",
    native: "தமிழ்",
    greeting: "வணக்கம் ஆரவ் — நான் உங்கள் ஃபின்பைலட் AI நிதி உதவியாளர். உங்கள் கடன் அல்லது ஆவண பெட்டகத்தில் நான் எவ்வாறு உதவ முடியும்?",
    prompts: [
      "ரூ.70 லட்ச வீட்டுக் கடனுக்கு நான் தகுதியானவனா?",
      "என் விண்ணப்பத்தில் எந்த ஆவணங்கள் விடுபட்டுள்ளன?",
      "எனது தற்போதைய விண்ணப்ப நிலையை விளக்குங்கள்",
      "என் ஓட்டுநர் உரிமம் எப்போது காலாவதியாகிறது?",
    ],
  },
  te: {
    code: "te",
    name: "Telugu",
    native: "తెలుగు",
    greeting: "నమస్తే ఆరవ్ — నేను మీ ఫిన్‌పైలట్ AI ఆర్థిక సహాయకుడిని. మీ రుణాలు లేదా డాక్యుమెంట్ వాల్ట్‌తో నేను మీకు ఎలా సహాయం చేయగలను?",
    prompts: [
      "నేను ₹70 లక్షల హోమ్ లోన్‌కు అర్హుడినా?",
      "నా అప్లికేషన్‌లో ఏ డాక్యుమెంట్లు మిస్ అయ్యాయి?",
      "నా ప్రస్తుత అప్లికేషన్ స్థితిని వివరించండి",
      "నా డ్రైవింగ్ లైసెన్స్ ఎప్పుడు గడువు ముగుస్తుంది?",
    ],
  },
  mr: {
    code: "mr",
    name: "Marathi",
    native: "मराठी",
    greeting: "नमस्कार आरव — मी तुमचा फिनपायलट एआय आर्थिक सहाय्यक आहे. मी तुम्हाला कर्ज किंवा दस्तऐवज व्हॉल्टबद्दल कशी मदत करू शकतो?",
    prompts: [
      "मी ₹70 लाखांच्या गृहकर्जासाठी पात्र आहे का?",
      "माझ्या अर्जात कोणते दस्तऐवज गहाळ आहेत?",
      "माझ्या सध्याच्या अर्जाची स्थिती स्पष्ट करा",
      "माझे ड्रायव्हिंग लायसन्स कधी संपेल?",
    ],
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    native: "ગુજરાતી",
    greeting: "નમસ્તે આરવ — હું તમારો ફિનપાયલટ AI નાણાકીય સહાયક છું. આજે હું લોન અથવા દસ્તાવેજ વોલ્ટમાં તમારી કેવી રીતે મદદ કરી શકું?",
    prompts: [
      "શું હું ₹70 લાખની હોમ લોન માટે પાત્ર છું?",
      "મારી અરજીમાં કયા દસ્તાવેજો ખૂટે છે?",
      "મારી વર્તમાન અરજી સ્થિતિ સમજાવો",
      "મારું ડ્રાઇવિંગ લાઇસન્સ ક્યારે સમાપ્ત થાય છે?",
    ],
  },
  kn: {
    code: "kn",
    name: "Kannada",
    native: "ಕನ್ನಡ",
    greeting: "ನಮಸ್ಕಾರ ಆರವ್ — ನಾನು ನಿಮ್ಮ ಫಿನ್‌ಪೈಲಟ್ AI ಹಣಕಾಸು ಸಹಾಯಕ. ನಿಮ್ಮ ಸಾಲಗಳು ಅಥವಾ ಡಾಕ್ಯುಮೆಂಟ್ ವಾಲ್ಟ್‌ನಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    prompts: [
      "ನಾನು ₹70 ಲಕ್ಷದ ಗೃಹ ಸಾಲಕ್ಕೆ ಅರ್ಹನೇ?",
      "ನನ್ನ ಅರ್ಜಿಯಲ್ಲಿ ಯಾವ ದಾಖಲೆಗಳು ಕಾಣೆಯಾಗಿವೆ?",
      "ನನ್ನ ಪ್ರಸ್ತುತ ಅರ್ಜಿ ಸ್ಥಿತಿಯನ್ನು ವಿವರಿಸಿ",
      "ನನ್ನ ಚಾಲನಾ ಪರವಾನಗಿ ಯಾವಾಗ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ?",
    ],
  },
  bn: {
    code: "bn",
    name: "Bengali",
    native: "বাংলা",
    greeting: "নমস্কার আরভ — আমি আপনার ফিনপাইলট এআই আর্থিক সহকারী। আপনার ঋণ বা নথি ভল্ট সম্পর্কিত কীভাবে সাহায্য করতে পারি?",
    prompts: [
      "আমি কি ₹৭০ লাখের হোম লোনের জন্য যোগ্য?",
      "আমার আবেদনে কোন নথিগুলি অনুপস্থিত?",
      "আমার বর্তমান আবেদনের স্থিতি ব্যাখ্যা করুন",
      "আমার ড্রাইভিং লাইসেন্স কখন মেয়াদ শেষ হবে?",
    ],
  },
  es: {
    code: "es",
    name: "Spanish",
    native: "Español",
    greeting: "Hola Aarav — Soy tu copiloto financiero FinPilot AI. ¿Cómo puedo ayudarte hoy con tus préstamos o bóveda de documentos?",
    prompts: [
      "¿Soy elegible para un préstamo hipotecario de ₹70L?",
      "¿Qué documentos faltan en mi solicitud?",
      "Explícame el estado actual de mi solicitud",
      "¿Cuándo vence mi licencia de conducir?",
    ],
  },
};

type Msg = { id: number; role: "user" | "assistant"; text: string };

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
            <code key={i} className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-primary font-medium border border-border/50">
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
  if (!content) return <span className="text-muted-foreground italic">Analyzing request...</span>;

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
        <div className="space-y-3.5 text-xs font-sans leading-relaxed">
          {beforeText && <RenderMarkdownText content={beforeText} />}

          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/80 p-1 shadow-soft my-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {tableLines.slice(0, 1).map((row, i) => (
                  <tr key={i} className="bg-primary/10 font-semibold border-b border-border/70 text-foreground">
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
                <span className="size-2 rounded-full bg-primary shrink-0" />
                <span>{headerText}</span>
              </h3>
            </div>
          );
        }

        // Subheader level 4 (e.g. #### 1. Subheader)
        if (trimmed.startsWith("####")) {
          const subText = trimmed.replace(/^####\s*/, "").replace(/\*\*/g, "");
          return (
            <h4 key={idx} className="font-semibold text-xs text-primary pt-2 pb-1 flex items-center gap-1.5">
              <span>•</span>
              <span>{subText}</span>
            </h4>
          );
        }

        // Callout box (> Quote or 👉 Action)
        if (trimmed.startsWith(">") || trimmed.startsWith("👉")) {
          const calloutText = trimmed.replace(/^>\s*/, "");
          return (
            <div key={idx} className="my-2.5 rounded-xl border-l-4 border-primary bg-primary/10 p-3 text-xs font-medium text-foreground">
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
              <span className={cn("mt-0.5 text-xs shrink-0 font-bold", isCheck ? "text-success" : "text-primary")}>
                {isCheck ? "✓" : "•"}
              </span>
              <span className="text-foreground/90 font-normal">
                <FormattedInlineText text={bulletText} />
              </span>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={idx} className="py-0.5 text-xs leading-relaxed text-foreground/90">
            <FormattedInlineText text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

import { useAuth } from "@/lib/auth-context";
import { RotateCcw } from "lucide-react";

function getLoggedInUserName(user: any, fallback = "Deekshika S"): string {
  try {
    if (user?.full_name && !user.full_name.includes("@")) return user.full_name;
    if (user?.first_name && !user.first_name.includes("@")) {
      return `${user.first_name} ${user.last_name || ""}`.trim();
    }

    if (typeof window !== "undefined") {
      const rawUser = localStorage.getItem("finpilot_user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.full_name && !parsed.full_name.includes("@")) return parsed.full_name;
        if (parsed?.first_name && !parsed.first_name.includes("@")) {
          return `${parsed.first_name} ${parsed.last_name || ""}`.trim();
        }
        if (parsed?.email) {
          const em = parsed.email.toLowerCase().trim();
          if (em.includes("sbharanidharan") || em.includes("bharani")) return "Bharanidharan S";
          if (em.includes("gopinath")) return "Gopinath V";
          if (em.includes("kaviya")) return "Kaviya V";
          if (em.includes("deekshika") || em.includes("deekshitha")) return "Deekshika S";
        }
      }
    }

    const email = user?.email || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("finpilot_user") || "{}")?.email : "");
    if (email) {
      const em = email.toLowerCase().trim();
      if (em.includes("sbharanidharan") || em.includes("bharani")) return "Bharanidharan S";
      if (em.includes("gopinath")) return "Gopinath V";
      if (em.includes("kaviya")) return "Kaviya V";
      if (em.includes("deekshika") || em.includes("deekshitha")) return "Deekshika S";
    }
  } catch {}
  return fallback;
}

function AssistantPage() {
  const { user } = useAuth();
  const userName = getLoggedInUserName(user, "Deekshika S");

  const [lang, setLang] = useState<Language>("en");
  const langConfig = languages[lang];

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("finpilot_chat_customer") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const greetingText = langConfig.greeting.replace("Aarav", userName);
    return [{ id: Date.now(), role: "assistant", text: greetingText }];
  });

  // Ensure first greeting message in chat dynamically matches logged-in user name
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) {
        return [{ id: Date.now(), role: "assistant", text: langConfig.greeting.replace("Aarav", userName) }];
      }
      const first = prev[0];
      if (first && first.role === "assistant") {
        const expectedGreeting = langConfig.greeting.replace("Aarav", userName);
        if (first.text.includes("Hi ") && !first.text.includes(userName)) {
          const updated = [{ ...first, text: expectedGreeting }, ...prev.slice(1)];
          try {
            localStorage.setItem("finpilot_chat_customer", JSON.stringify(updated));
          } catch {}
          return updated;
        }
      }
      return prev;
    });
  }, [userName, lang]);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage on change
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && messages.length > 0) {
        localStorage.setItem("finpilot_chat_customer", JSON.stringify(messages));
      }
    } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClearChat = () => {
    const greetingText = langConfig.greeting.replace("Aarav", userName);
    const initialMsg: Msg[] = [{ id: Date.now(), role: "assistant", text: greetingText }];
    setMessages(initialMsg);
    try {
      localStorage.setItem("finpilot_chat_customer", JSON.stringify(initialMsg));
    } catch {}
  };

  const [sessionId] = useState(() => `session-${Date.now()}`);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const uid = Date.now();
    setMessages((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setStreaming(true);
    const aid = uid + 1;
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Querying financial RAG knowledgebase & loan policy rules..." }]);

    try {
      const promptWithLang = `[Language: ${langConfig.name}] ${text}`;
      const res = await aiService.queryCustomerAssistant(promptWithLang, sessionId, user);
      setMessages((m) => m.map((msg) => (msg.id === aid ? { ...msg, text: res.answer } : msg)));

      if (res.actionUrl) {
        const lowerT = text.toLowerCase();
        if (lowerT === "yes" || lowerT.includes("apply") || lowerT.includes("form") || lowerT.includes("start")) {
          setTimeout(() => {
            window.location.href = res.actionUrl as string;
          }, 1200);
        }
      }
    } catch {
      setMessages((m) =>
        m.map((msg) => (msg.id === aid ? { ...msg, text: `Sorry, I couldn't process that right now. Please try again.` } : msg))
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <PortalShell role="customer" title="Multilingual AI Financial Assistant" subtitle="Personalized AI chatbot grounded in your vault, credit score and institution policies.">
      <GlassPanel hover={false} className="flex h-[calc(100vh-15rem)] min-h-[540px] flex-col p-0">
        {/* Multilingual Selector Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </span>
            <p className="text-xs font-semibold text-foreground">Vault RAG Chatbot</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="h-8 rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
              >
                {Object.values(languages).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>

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

        {/* Chat Messages */}
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
                    "max-w-[min(46rem,85%)] text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground font-medium"
                      : "text-foreground glass rounded-2xl rounded-tl-md p-4 border-border/70 shadow-soft",
                  )}
                >
                  {m.role === "user" ? (
                    <span>{m.text}</span>
                  ) : (
                    <RenderMarkdownText content={m.text} />
                  )}
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

        {/* Canned Prompts & Input Controls */}
        <div className="border-t border-border/60 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {langConfig.prompts.map((p) => (
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
              placeholder={`Ask in ${langConfig.name} about loans, status or documents...`}
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            />
            <Button type="button" size="icon" variant="ghost" className="rounded-xl" aria-label="Voice input">
              <Mic className="size-4" />
            </Button>
            <Button type="submit" size="icon" className="rounded-xl bg-brand text-white shadow-glow" disabled={streaming}>
              <ArrowUp className="size-4" />
            </Button>
          </form>
        </div>
      </GlassPanel>
    </PortalShell>
  );
}

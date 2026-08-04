import { createFileRoute } from "@tanstack/react-router";
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

function AssistantPage() {
  const [lang, setLang] = useState<Language>("en");
  const langConfig = languages[lang];

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Re-initialize initial greeting when language changes
  useEffect(() => {
    setMessages([{ id: Date.now(), role: "assistant", text: langConfig.greeting }]);
  }, [lang]);

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
    setMessages((m) => [...m, { id: aid, role: "assistant", text: "Analyzing query with RAG index..." }]);

    try {
      const promptWithLang = `[Language: ${langConfig.name}] ${text}`;
      const res = await aiService.querySupportAssistant(promptWithLang, sessionId);
      setMessages((m) => m.map((msg) => (msg.id === aid ? { ...msg, text: res.answer } : msg)));
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
                    "max-w-[min(46rem,80%)] text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground font-medium"
                      : "text-foreground glass rounded-2xl rounded-tl-md p-4 border-border/70",
                  )}
                >
                  {m.text || <span className="text-muted-foreground">Analyzing request…</span>}
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

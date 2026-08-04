import { useEffect, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LanguageOption {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export const CUSTOMER_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
];

function getActiveLanguage(): string {
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const [key, val] = c.trim().split("=");
      if (key === "googtrans" && val) {
        const parts = val.split("/");
        const lastPart = parts[parts.length - 1];
        if (lastPart && CUSTOMER_LANGUAGES.some((l) => l.code === lastPart)) {
          return lastPart;
        }
      }
    }
  }
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("finpilot-customer-lang");
    if (saved && CUSTOMER_LANGUAGES.some((l) => l.code === saved)) return saved;
  }
  return "en";
}

export function CustomerTranslator() {
  const [selectedLang, setSelectedLang] = useState<string>(getActiveLanguage());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Initialize Google Translate Element Callback
    (window as any).googleTranslateElementInit = () => {
      if ((window as any).google && (window as any).google.translate) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,ta,te,mr,gu,kn,bn,es,fr,de",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    // Inject Google Translate script dynamically if not already injected
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    // Interval to keep active language synced & strip Google Translate top banner iframe
    const interval = setInterval(() => {
      const active = getActiveLanguage();
      setSelectedLang(active);

      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
      }
      const banner = document.querySelector(
        ".goog-te-banner-frame, iframe.goog-te-banner-frame, .VIpgJd-yDsffb-Lg2fxd-wT32Ac"
      ) as HTMLElement;
      if (banner) {
        banner.style.display = "none";
        banner.style.visibility = "hidden";
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const changeLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    localStorage.setItem("finpilot-customer-lang", langCode);
    setDropdownOpen(false);

    // Set cookies for Google Translate engine
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/en/${langCode}; path=/`;

    // Trigger translate widget dropdown change if present
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    } else {
      window.location.reload();
    }
  };

  const currentLang = CUSTOMER_LANGUAGES.find((l) => l.code === selectedLang) || CUSTOMER_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left notranslate" translate="no">
      {/* Hidden Google Translate container */}
      <div id="google_translate_element" className="hidden" />

      {/* Styled Language Selector Pill */}
      <button
        onClick={() => setDropdownOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary transition-all hover:bg-primary/20 shadow-glow notranslate"
        translate="no"
      >
        <Globe className="size-3.5" />
        <span className="notranslate" translate="no">
          {currentLang.flag} {currentLang.native}
        </span>
        <ChevronDown className="size-3 opacity-70" />
      </button>

      {/* Dropdown Options Menu */}
      {dropdownOpen && (
        <div className="glass-strong absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-border/80 p-1.5 shadow-xl notranslate" translate="no">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1 notranslate" translate="no">
            Select Language / भाषा चुनें
          </div>
          <div className="max-h-60 overflow-y-auto space-y-0.5 notranslate" translate="no">
            {CUSTOMER_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors text-left notranslate",
                  selectedLang === lang.code
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-accent text-foreground"
                )}
                translate="no"
              >
                <span className="flex items-center gap-2 notranslate" translate="no">
                  <span>{lang.flag}</span>
                  <span>{lang.native}</span>
                </span>
                <span className="text-[10px] opacity-70 notranslate" translate="no">({lang.name})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

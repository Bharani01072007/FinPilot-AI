import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LifeBuoy,
  Search,
  HelpCircle,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  Mail,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/help")({
  head: () => ({
    meta: [{ title: "Help Center & Support — FinPilot AI Customer Portal" }],
  }),
  component: CustomerHelpPage,
});

interface FAQItem {
  id: string;
  category: "vault" | "loans" | "kyc" | "security";
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "f1",
    category: "vault",
    question: "How does the Secure Document Vault work?",
    answer: "FinPilot AI's Document Vault uses AES-256 encryption to store your financial documents (PAN, Aadhaar, Salary Slips, Tax Returns). Saved documents carry permanent validity tags and can be pre-filled into future loan applications with 1 click.",
  },
  {
    id: "f2",
    category: "loans",
    question: "What is the typical SLA turnaround time for home loan pre-approval?",
    answer: "For applications submitted via AI Smart Form with valid Vault documents attached, automated pre-approval decisioning takes less than 4 hours. Manual underwriting reviews take up to 24 hours.",
  },
  {
    id: "f3",
    category: "kyc",
    question: "Why does my document status show 'Needs Renewal'?",
    answer: "Bank statements must be issued within the last 6 months to satisfy RBI digital KYC guidelines. If your document is older, simply upload an updated PDF copy to your Vault.",
  },
  {
    id: "f4",
    category: "security",
    question: "Is my consent required before underwriting officers inspect my vault?",
    answer: "Yes! FinPilot AI enforces strict zero-trust consent. Underwriting officers cannot inspect your vault documents until you grant temporary consent.",
  },
];

function CustomerHelpPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("f1");

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const filteredFaqs = faqs.filter((f) => {
    const matchesSearch = f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "all" || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMsg.trim()) {
      toast.error("Please fill in both subject and description");
      return;
    }
    setTicketSubmitted(true);
    toast.success("Support ticket created! Ticket #TKT-8842");
    setTicketSubject("");
    setTicketMsg("");
  };

  return (
    <PortalShell role="customer" title="Help Center & Customer Support" subtitle="Find answers to common questions, raise support tickets, or consult policy documentation.">
      <div className="space-y-8">
        {/* Search Header Banner */}
        <div className="glass-strong rounded-3xl p-8 text-center space-y-4">
          <div className="size-12 mx-auto grid place-items-center rounded-2xl bg-primary/10 text-primary">
            <LifeBuoy className="size-6" />
          </div>
          <h2 className="font-display text-2xl font-semibold">How can we help you today?</h2>
          <div className="relative max-w-xl mx-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search help articles, KYC rules, application SLAs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl pl-11 shadow-soft"
            />
          </div>
        </div>

        {/* FAQs & Contact Ticket Layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* FAQ Accordion (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Knowledge Base & FAQs
              </h3>
              <div className="flex items-center gap-1.5">
                {["all", "vault", "loans", "kyc", "security"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors ${
                      selectedCategory === cat ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div key={faq.id} className="glass rounded-2xl p-4 transition-all">
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between text-left font-semibold text-foreground text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="size-4 text-primary shrink-0" />
                        {faq.question}
                      </span>
                      {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </button>
                    {isOpen && <p className="mt-3 text-xs text-muted-foreground leading-relaxed pl-6">{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raise Support Ticket (Right 5 cols) */}
          <div className="lg:col-span-5 glass-strong rounded-3xl p-6 space-y-5">
            <div className="border-b border-border/60 pb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-primary">
                <MessageSquare className="size-3.5" /> 24/7 Escalation
              </span>
              <h3 className="font-display text-lg font-semibold mt-1">Raise Support Ticket</h3>
            </div>

            {ticketSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="size-12 mx-auto grid place-items-center rounded-2xl bg-success/15 text-success">
                  <CheckCircle2 className="size-6" />
                </div>
                <h4 className="font-display text-lg font-semibold">Ticket #TKT-8842 Created</h4>
                <p className="text-xs text-muted-foreground">
                  Our customer support team and AI copilot have received your inquiry. Expected response within 30 minutes.
                </p>
                <Button variant="outline" onClick={() => setTicketSubmitted(false)} className="rounded-xl text-xs">
                  Create Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Subject / Topic</Label>
                  <Input
                    placeholder="e.g. Document re-upload issue or SLA delay"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Detailed Description</Label>
                  <textarea
                    rows={4}
                    placeholder="Describe your question or issue in detail..."
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <Button type="submit" className="w-full h-10 rounded-xl bg-brand text-white shadow-glow">
                  <Send className="size-4 mr-2" /> Submit Ticket
                </Button>
              </form>
            )}

            <div className="rounded-2xl bg-muted/40 p-4 space-y-2 text-xs">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <PhoneCall className="size-3.5 text-primary" /> Direct Customer Helpline
              </p>
              <p className="text-muted-foreground">Toll-Free: 1800-FINPILOT (1800-346-7456)</p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="size-3.5 text-primary" /> finpilotaiadmin@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

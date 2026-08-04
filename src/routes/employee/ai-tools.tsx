import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Sparkle, Mail, BarChart3, CheckCircle2, Copy, Send, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { aiService } from "@/lib/services/ai-service";
import { toast } from "sonner";

export const Route = createFileRoute("/employee/ai-tools")({
  head: () => ({
    meta: [{ title: "AI Tools & Recommendation Center — FinPilot AI" }],
  }),
  component: EmployeeAIToolsPage,
});

function EmployeeAIToolsPage() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [emailText, setEmailText] = useState("");
  const [generatingEmail, setGeneratingEmail] = useState(false);

  const handleGenerateRecs = async () => {
    setLoading(true);
    try {
      const res = await aiService.generateRecommendations([], "LOW");
      setRecommendations(res.recommendations || []);
      toast.success("AI Insights & Recommendations generated");
    } catch {
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleDraftEmail = async () => {
    setGeneratingEmail(true);
    setTimeout(() => {
      setEmailText(
        `Dear Aarav Mehta,\n\nWe are pleased to inform you that your Home Loan application (APP-24817) has successfully passed automated KYC and risk verification with a score of 812/900.\n\nOur underwriting team has approved a preliminary sanction of ₹68,00,000 at a preferred interest rate of 8.25% p.a.\n\nBest regards,\nFinPilot AI Operations Team`
      );
      setGeneratingEmail(false);
      toast.success("Customer update email drafted by AI");
    }, 1000);
  };

  return (
    <PortalShell role="employee" title="AI Recommendation Center & Tools" subtitle="Generate AI next actions, auto-draft applicant communications, and synthesize case summaries.">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: AI Recommendations (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold">AI Insights & Next Actions</h3>
                  <p className="text-xs text-muted-foreground">Automated recommendations grounded in case data</p>
                </div>
              </div>

              <Button size="sm" onClick={handleGenerateRecs} disabled={loading} className="rounded-xl bg-brand text-white">
                {loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Sparkle className="size-3.5 mr-1" />}
                Generate AI Insights
              </Button>
            </div>

            {recommendations.length > 0 ? (
              <div className="space-y-3 pt-2">
                {recommendations.map((r, i) => (
                  <div key={i} className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{r.title}</span>
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                        {r.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-muted-foreground">{r.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                Click "Generate AI Insights" to trigger recommendation agent.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Email Generator (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">AI Customer Email Generator</h3>
                <p className="text-xs text-muted-foreground">Draft approval & clarification emails automatically</p>
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={handleDraftEmail} disabled={generatingEmail} className="rounded-xl w-full">
              {generatingEmail ? <Loader2 className="size-3.5 animate-spin mr-2" /> : <Sparkle className="size-3.5 mr-2 text-primary" />}
              Draft Approval Email for APP-24817
            </Button>

            {emailText && (
              <div className="space-y-3 pt-2">
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full h-44 rounded-2xl border border-border bg-background/80 p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary font-sans"
                />

                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(emailText);
                      toast.success("Email copied to clipboard");
                    }}
                    className="rounded-xl"
                  >
                    <Copy className="size-3.5 mr-1" /> Copy Text
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success("Email dispatched to applicant!");
                      setEmailText("");
                    }}
                    className="rounded-xl bg-brand text-white"
                  >
                    <Send className="size-3.5 mr-1" /> Send Email
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

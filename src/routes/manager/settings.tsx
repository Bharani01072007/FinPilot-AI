import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sliders, Shield, Bot, Save, Workflow, Bell, Lock, FileText, Database, Settings as SettingsIcon, Link2, CheckCircle2, RefreshCw } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/settings")({
  head: () => ({
    meta: [{ title: "Enterprise System Administration & AI Configuration — FinPilot AI Manager Portal" }],
  }),
  component: ManagerSettingsPage,
});

export type TabType = "ai" | "workflow" | "notifications" | "security" | "documents" | "database" | "system" | "integrations";

function ManagerSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("ai");
  const [saving, setSaving] = useState(false);

  // 1. AI Settings
  const [ocrThreshold, setOcrThreshold] = useState("95");
  const [maxAutoApprove, setMaxAutoApprove] = useState("500000");
  const [aiProvider, setAiProvider] = useState("groq_llama3");
  const [aiTemperature, setAiTemperature] = useState("0.2");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [retryPolicy, setRetryPolicy] = useState("3");

  // 2. Workflow Settings
  const [approvalLevels, setApprovalLevels] = useState("3");
  const [slaHours, setSlaHours] = useState("14");
  const [autoRoutingEnabled, setAutoRoutingEnabled] = useState(true);

  // 3. Notification Settings
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // 4. Security Settings
  const [passwordMinLength, setPasswordMinLength] = useState("8");
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState("30");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [ipWhitelisting, setIpWhitelisting] = useState("192.168.1.0/24, 10.0.0.0/16");

  // 5. Document Settings
  const [maxFileSizeMB, setMaxFileSizeMB] = useState("25");
  const [ocrLanguage, setOcrLanguage] = useState("English + Hindi");
  const [duplicateDetection, setDuplicateDetection] = useState(true);
  const [retentionYears, setRetentionYears] = useState("8");

  // 6. System Settings
  const [branchName, setBranchName] = useState("FinPilot AI Head Office (Krishnagiri Main)");
  const [workingHours, setWorkingHours] = useState("09:00 - 18:00 IST");
  const [timeZone, setTimeZone] = useState("Asia/Kolkata (+05:30)");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Enterprise System & AI Configuration saved successfully!");
    }, 600);
  };

  return (
    <PortalShell role="manager" title="Enterprise Administration Center" subtitle="Configure AI decision engines, workflow SLAs, security policies, and core banking integrations.">
      <div className="space-y-6">
        {/* Navigation Tabs Header */}
        <div className="glass-strong flex flex-wrap items-center gap-1.5 rounded-2xl p-2 border border-border/60">
          <Button
            size="sm"
            variant={activeTab === "ai" ? "default" : "ghost"}
            onClick={() => setActiveTab("ai")}
            className="rounded-xl text-xs"
          >
            <Bot className="size-3.5 mr-1.5" /> AI Engine
          </Button>
          <Button
            size="sm"
            variant={activeTab === "workflow" ? "default" : "ghost"}
            onClick={() => setActiveTab("workflow")}
            className="rounded-xl text-xs"
          >
            <Workflow className="size-3.5 mr-1.5" /> Workflows & SLA
          </Button>
          <Button
            size="sm"
            variant={activeTab === "notifications" ? "default" : "ghost"}
            onClick={() => setActiveTab("notifications")}
            className="rounded-xl text-xs"
          >
            <Bell className="size-3.5 mr-1.5" /> Notifications
          </Button>
          <Button
            size="sm"
            variant={activeTab === "security" ? "default" : "ghost"}
            onClick={() => setActiveTab("security")}
            className="rounded-xl text-xs"
          >
            <Lock className="size-3.5 mr-1.5" /> Security & Policy
          </Button>
          <Button
            size="sm"
            variant={activeTab === "documents" ? "default" : "ghost"}
            onClick={() => setActiveTab("documents")}
            className="rounded-xl text-xs"
          >
            <FileText className="size-3.5 mr-1.5" /> Document Vault
          </Button>
          <Button
            size="sm"
            variant={activeTab === "database" ? "default" : "ghost"}
            onClick={() => setActiveTab("database")}
            className="rounded-xl text-xs"
          >
            <Database className="size-3.5 mr-1.5" /> Database & Backup
          </Button>
          <Button
            size="sm"
            variant={activeTab === "system" ? "default" : "ghost"}
            onClick={() => setActiveTab("system")}
            className="rounded-xl text-xs"
          >
            <SettingsIcon className="size-3.5 mr-1.5" /> System Info
          </Button>
          <Button
            size="sm"
            variant={activeTab === "integrations" ? "default" : "ghost"}
            onClick={() => setActiveTab("integrations")}
            className="rounded-xl text-xs"
          >
            <Link2 className="size-3.5 mr-1.5" /> Core Banking APIs
          </Button>
        </div>

        {/* Tab Content Box */}
        <form onSubmit={handleSave} className="glass rounded-3xl p-6 sm:p-8 space-y-6">
          {activeTab === "ai" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <Bot className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">AI Agent & LLM Decision Configuration</h3>
                  <p className="text-xs text-muted-foreground">Configure AI provider, OCR confidence ceilings, temperature, and RAG embeddings.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary AI LLM Provider</Label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="groq_llama3">Groq Llama-3.3 70B Versatile (Primary High-Speed)</option>
                    <option value="gemini_pro">Google Gemini 3.6 Flash (High Reasoning)</option>
                    <option value="openai_gpt4">OpenAI GPT-4o Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Minimum OCR Confidence Threshold (%)</Label>
                  <Input type="number" value={ocrThreshold} onChange={(e) => setOcrThreshold(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Auto-Approval Ceiling (INR)</Label>
                  <Input type="number" value={maxAutoApprove} onChange={(e) => setMaxAutoApprove(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">AI Sampling Temperature (0.0 = Precise, 1.0 = Creative)</Label>
                  <Input value={aiTemperature} onChange={(e) => setAiTemperature(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">RAG Vector Embedding Model</Label>
                  <Input value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">API Gateway Retry Policy (Attempts)</Label>
                  <Input type="number" value={retryPolicy} onChange={(e) => setRetryPolicy(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "workflow" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <Workflow className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">Workflow Orchestration & SLA Rules</h3>
                  <p className="text-xs text-muted-foreground">Define approval hierarchies, turnaround SLAs, and auto-routing rules.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Approval Hierarchy Levels</Label>
                  <Input type="number" value={approvalLevels} onChange={(e) => setApprovalLevels(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Maximum Loan Underwriting SLA (Hours)</Label>
                  <Input type="number" value={slaHours} onChange={(e) => setSlaHours(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoRouting"
                  checked={autoRoutingEnabled}
                  onChange={(e) => setAutoRoutingEnabled(e.target.checked)}
                  className="size-4 rounded border-border"
                />
                <label htmlFor="autoRouting" className="text-xs font-semibold text-foreground cursor-pointer">
                  Enable AI Agent 8 Automated Workload Load-Balancing & Queue Routing
                </label>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <Bell className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">Multi-Channel Communication & Alerts</h3>
                  <p className="text-xs text-muted-foreground">Configure Email, SMS, WhatsApp Business, and Push notifications.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
                  <span className="text-xs font-semibold">Real Gmail SMTP Email Notifications</span>
                  <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="size-4" />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
                  <span className="text-xs font-semibold">SMS Gateway Dispatch (Twilio)</span>
                  <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} className="size-4" />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
                  <span className="text-xs font-semibold">WhatsApp Business API Gateway</span>
                  <input type="checkbox" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} className="size-4" />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
                  <span className="text-xs font-semibold">Web Push Browser Notifications</span>
                  <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} className="size-4" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <Lock className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">Security Policy & Access Control</h3>
                  <p className="text-xs text-muted-foreground">Set password complexity, MFA enforcement, session timeouts, and IP whitelists.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Minimum Password Length</Label>
                  <Input type="number" value={passwordMinLength} onChange={(e) => setPasswordMinLength(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Max Failed Login Lockout Attempts</Label>
                  <Input type="number" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Inactivity Session Timeout (Minutes)</Label>
                  <Input type="number" value={sessionTimeoutMins} onChange={(e) => setSessionTimeoutMins(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Branch IP CIDR Whitelist</Label>
                  <Input value={ipWhitelisting} onChange={(e) => setIpWhitelisting(e.target.value)} className="h-10 rounded-xl font-mono text-xs" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" id="mfa" checked={mfaEnforced} onChange={(e) => setMfaEnforced(e.target.checked)} className="size-4" />
                <label htmlFor="mfa" className="text-xs font-semibold cursor-pointer">
                  Mandatory Multi-Factor Authentication (MFA) for Manager & Admin roles
                </label>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <FileText className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">Document Vault & OCR Configuration</h3>
                  <p className="text-xs text-muted-foreground">Supported file formats, max file sizes, OCR language models, and retention policies.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Maximum File Size Upload (MB)</Label>
                  <Input type="number" value={maxFileSizeMB} onChange={(e) => setMaxFileSizeMB(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Primary OCR Language Model</Label>
                  <Input value={ocrLanguage} onChange={(e) => setOcrLanguage(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Document Retention Period (Years)</Label>
                  <Input type="number" value={retentionYears} onChange={(e) => setRetentionYears(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="dup" checked={duplicateDetection} onChange={(e) => setDuplicateDetection(e.target.checked)} className="size-4" />
                  <label htmlFor="dup" className="text-xs font-semibold cursor-pointer">
                    Enable SHA-256 Duplicate Document Hash Detection
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "database" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <Database className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">Supabase PostgreSQL Database & Backup Status</h3>
                  <p className="text-xs text-muted-foreground">Monitor pooler connections, automated backups, and schema synchronization.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-2xl border border-success/30 bg-success/5 space-y-1">
                  <p className="text-xs font-semibold text-success">Supabase Session Pooler (Port 5432)</p>
                  <p className="font-mono text-xs text-foreground">aws-0-ap-south-1.pooler.supabase.com</p>
                  <span className="inline-block rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">CONNECTED & ACTIVE</span>
                </div>

                <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-1">
                  <p className="text-xs font-semibold text-primary">Supabase Transaction Pooler (Port 6543)</p>
                  <p className="font-mono text-xs text-foreground">pgbouncer=true (IPv4 Only)</p>
                  <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">CONNECTED & ACTIVE</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border/60 bg-muted/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Automated Daily Database Backups</p>
                  <p className="text-[11px] text-muted-foreground">Last successful backup: Today at 03:00 AM IST (Point-in-time recovery ready)</p>
                </div>
                <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">HEALTHY</span>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <SettingsIcon className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">Branch & Regional System Parameters</h3>
                  <p className="text-xs text-muted-foreground">Set branch name, operating hours, time zones, and maintenance modes.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Official Branch Designation</Label>
                <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="h-10 rounded-xl" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Operating Business Hours</Label>
                  <Input value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">System Time Zone</Label>
                  <Input value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className="h-10 rounded-xl" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="maint" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="size-4" />
                <label htmlFor="maint" className="text-xs font-semibold text-destructive cursor-pointer">
                  Enable Scheduled Maintenance Mode (Restricts non-manager logins)
                </label>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <Link2 className="size-6 text-primary" />
                <div>
                  <h3 className="font-display text-base font-semibold">Core Banking & AI API Gateway Status</h3>
                  <p className="text-xs text-muted-foreground">Status of external microservices, OCR engines, and email gateways.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-success" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Groq Llama-3.3 70B Multi-Key API Gateway</p>
                      <p className="text-[11px] text-muted-foreground">5 Load-Balanced API keys active</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">OPERATIONAL</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-success" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">SNSIHub Production Webhook OCR Agent</p>
                      <p className="text-[11px] text-muted-foreground">https://api.agents.snsihub.ai/webhook/1ebf3266-d339-4133-946d-5c80698b7095</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">OPERATIONAL</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-success" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Gmail SMTP Security Dispatcher</p>
                      <p className="text-[11px] text-muted-foreground">Port 587 TLS Auth Configured</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">OPERATIONAL</span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="h-11 rounded-xl bg-brand text-white shadow-glow" disabled={saving}>
            <Save className="size-4 mr-2" />
            {saving ? "Saving System Configuration..." : "Save Enterprise Settings"}
          </Button>
        </form>
      </div>
    </PortalShell>
  );
}

import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Command as CommandIcon,
  FileSearch,
  FileText,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Users,
  Vault,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/aurora-background";
import { cn } from "@/lib/utils";

import { CustomerTranslator } from "@/components/customer-translator";

export type Role = "customer" | "employee" | "manager";

type NavItem = { label: string; to?: string; icon: LucideIcon; badge?: string };

const navs: Record<Role, { group: string; items: NavItem[] }[]> = {
  customer: [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", to: "/customer", icon: LayoutDashboard },
        { label: "Document Vault", to: "/customer/vault", icon: Vault, badge: "New" },
        { label: "AI Assistant", to: "/customer/assistant", icon: Bot, badge: "AI" },
      ],
    },
    {
      group: "Services",
      items: [
        { label: "Applications", to: "/customer/applications", icon: ClipboardList },
        { label: "Smart Form Filling", to: "/customer/applications?tab=smart-form", icon: FileText },
        { label: "Appointments", to: "/customer/applications?tab=appointments", icon: CalendarClock },
        { label: "Application History", to: "/customer/applications?tab=history", icon: Activity },
      ],
    },
    {
      group: "Account",
      items: [
        { label: "Notifications", to: "/customer/notifications", icon: Bell, badge: "3" },
        { label: "Security & Devices", to: "/customer/settings", icon: ShieldCheck },
        { label: "Help Center", to: "/customer/help", icon: LifeBuoy },
      ],
    },
  ],
  employee: [
    {
      group: "Work",
      items: [
        { label: "Dashboard", to: "/employee", icon: LayoutDashboard },
        { label: "Customer Directory", to: "/employee/customers", icon: Users },
        { label: "Pending Applications", to: "/employee/applications", icon: ClipboardList, badge: "18" },
        { label: "Document Review", to: "/employee/documents", icon: FileSearch },
        { label: "KYC Verification", to: "/employee/kyc", icon: ShieldCheck, badge: "AI" },
      ],
    },
    {
      group: "AI Tools",
      items: [
        { label: "AI Copilot", to: "/employee/assistant", icon: Bot, badge: "Copilot" },
        { label: "Risk Assessment", to: "/employee/risk", icon: ShieldAlert },
        { label: "AI Tools & Summary", to: "/employee/ai-tools", icon: Bot },
        { label: "OCR Extractor", to: "/employee/documents?tab=ocr", icon: FileText },
        { label: "Notifications", to: "/employee/notifications", icon: Bell },
      ],
    },
  ],
  manager: [
    {
      group: "Executive",
      items: [
        { label: "Executive Dashboard", to: "/manager", icon: Gauge },
        { label: "Customer Directory", to: "/manager/customers", icon: Users },
        { label: "Approval Queue", to: "/manager/approvals", icon: CheckCircle2, badge: "7" },
        { label: "Analytics & Reports", to: "/manager/analytics", icon: BarChart3 },
      ],
    },
    {
      group: "Governance",
      items: [
        { label: "Executive AI Assistant", to: "/manager/assistant", icon: Bot, badge: "AI" },
        { label: "Risk Oversight", to: "/manager/risk", icon: ShieldAlert },
        { label: "AI Tools & Summary", to: "/manager/ai-tools", icon: Bot },
        { label: "User & Role Mgmt", to: "/manager/users", icon: Users },
        { label: "Audit Logs", to: "/manager/audit-logs", icon: ShieldCheck },
        { label: "System Settings", to: "/manager/settings", icon: Briefcase },
      ],
    },
  ],
};

const roleMeta: Record<Role, { name: string; who: string; initials: string }> = {
  customer: { name: "Customer Portal", who: "Bharanidharan Saravanakumar", initials: "BS" },
  employee: { name: "Employee Portal", who: "Priya Verma · Ops", initials: "PV" },
  manager: { name: "Manager Portal", who: "Daniel Cole · VP Ops", initials: "DC" },
};

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("finpilot-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("finpilot-theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-9 shrink-0 place-items-center rounded-xl bg-brand shadow-glow", className)}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="white" strokeWidth={2.1} strokeLinecap="round">
        <path d="M4 16.5 9 11l3.5 3.5L20 6.5" />
        <path d="M15.5 6.5H20V11" />
      </svg>
    </span>
  );
}

export function PortalShell({
  role,
  title,
  subtitle,
  children,
}: {
  role: Role;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const meta = roleMeta[role];
  const groups = useMemo(() => navs[role], [role]);
  // Auth and navigation helpers
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <div className="flex min-h-screen">
        <motion.aside
          animate={{ width: collapsed ? 76 : 264 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-sidebar backdrop-blur-2xl lg:flex"
        >
          <Link to={`/${role}`} className="flex items-center gap-3 px-4 py-5 hover:opacity-90 transition-opacity">
            <BrandMark />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="min-w-0"
                >
                  <p className="truncate font-display text-sm font-semibold">FinPilot AI</p>
                  <p className="truncate text-[11px] text-muted-foreground">{meta.name}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <nav className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-3 pb-4">
            {groups.map((g) => (
              <div key={g.group}>
                {!collapsed && (
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                    {g.group}
                  </p>
                )}
                <ul className="space-y-1">
                  {g.items.map((item) => {
                    const currentSearch = typeof window !== "undefined" ? window.location.search : "";
                    let active = false;
                    if (item.to) {
                      const [targetPath, targetSearch] = item.to.split("?");
                      if (targetSearch) {
                        active = pathname === targetPath && currentSearch.includes(targetSearch);
                      } else {
                        active = pathname === item.to && (!currentSearch || currentSearch === "?tab=all");
                      }
                    }
                    const inner = (
                      <>
                        <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span className="ml-auto rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <motion.span
                            layoutId={`nav-${role}`}
                            className="absolute inset-0 -z-10 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                            transition={{ type: "spring", stiffness: 320, damping: 30 }}
                          />
                        )}
                      </>
                    );
                    const cls = cn(
                      "relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active && "font-medium text-primary",
                      collapsed && "justify-center px-0",
                    );
                    return (
                      <li key={item.label}>
                        {item.to ? (
                          <Link to={item.to} className={cls} title={item.label}>
                            {inner}
                          </Link>
                        ) : (
                          <button type="button" className={cls} title={item.label}>
                            {inner}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-border/60 p-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent"
            >
              {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <div className="lg:hidden">
                <BrandMark className="size-8" />
              </div>
              <button
                onClick={() => setPaletteOpen(true)}
                className="group flex h-10 flex-1 items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 md:max-w-md"
              >
                <Search className="size-4" />
                <span className="truncate">Search applications, customers, documents…</span>
                <kbd className="ml-auto hidden items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:flex">
                  <CommandIcon className="size-3" />K
                </kbd>
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                {role === "customer" && <CustomerTranslator />}
                <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-xl">
                  {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    aria-label="Notifications"
                    onClick={() => setNotifOpen((o) => !o)}
                  >
                    <Bell className="size-4" />
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
                  </Button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className="glass-strong absolute right-0 mt-2 w-80 rounded-2xl p-2"
                      >
                        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Notifications
                        </p>
                        {[
                          { t: "Driving License expires in 20 days", s: "Vault AI · now" },
                          { t: "APP-24817 moved to Underwriting", s: "Workflow · 18m" },
                          { t: "New consent request from Underwriting", s: "Security · 1h" },
                        ].map((n, i) => (
                          <motion.div
                            key={n.t}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="rounded-xl px-3 py-2 transition-colors hover:bg-accent"
                          >
                            <p className="text-sm">{n.t}</p>
                            <p className="text-[11px] text-muted-foreground">{n.s}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="ml-1 flex items-center gap-2 rounded-xl border border-border/70 bg-card/60 py-1 pl-1 pr-3">
                  <span className="grid size-7 place-items-center rounded-lg bg-brand text-[11px] font-semibold text-white">
                    {meta.initials}
                  </span>
                  <span className="hidden text-xs font-medium sm:block">{meta.who}</span>
                  {/* Logout button */}
                  <button
                    onClick={async () => {
                      await logout();
                      router.navigate({ to: "/" });
                    }}
                    className="ml-2 rounded-full bg-destructive/10 px-2 py-1 text-sm font-medium text-destructive hover:bg-destructive/20"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="mx-auto w-full max-w-[1720px] flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-8"
          >
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-widest text-primary">{meta.name}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </motion.main>
        </div>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search applications, customers, documents, reports…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Portals">
            <CommandItem asChild>
              <Link to="/customer">Customer Portal</Link>
            </CommandItem>
            <CommandItem asChild>
              <Link to="/customer/vault">Secure Document Vault</Link>
            </CommandItem>
            <CommandItem asChild>
              <Link to="/customer/assistant">AI Financial Assistant</Link>
            </CommandItem>
            <CommandItem asChild>
              <Link to="/employee">Employee Portal</Link>
            </CommandItem>
            <CommandItem asChild>
              <Link to="/manager">Manager Portal</Link>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Applications">
            <CommandItem>APP-24817 · Home Loan · Aarav Mehta</CommandItem>
            <CommandItem>APP-24816 · Business Loan · Isha Rao</CommandItem>
            <CommandItem>APP-24804 · Working Capital · Rohan Gupta</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Documents">
            <CommandItem>Aadhaar Card.pdf</CommandItem>
            <CommandItem>Form-16 FY 25-26.pdf</CommandItem>
            <CommandItem>Bank Statement - Q4.pdf</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  children,
  hover = true,
  delay = 0,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay }}
      className={cn(
        "glass rounded-2xl",
        hover && "transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-float",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(
    () =>
      spring.on("change", (v) =>
        setDisplay(v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })),
      ),
    [spring, decimals],
  );

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  delta,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: string;
  icon: LucideIcon;
  delay?: number;
}) {
  const positive = !delta?.startsWith("-");
  return (
    <GlassPanel delay={delay} className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold">
            <CountUp value={value} prefix={prefix} suffix={suffix} />
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </div>
      {delta && (
        <p className={cn("mt-3 text-xs font-medium", positive ? "text-success" : "text-destructive")}>
          {delta} <span className="text-muted-foreground">vs last month</span>
        </p>
      )}
      <div className="pointer-events-none absolute -bottom-16 -right-10 size-36 rounded-full bg-primary/10 blur-2xl" />
    </GlassPanel>
  );
}

export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-border" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          stroke="url(#ringGrad)"
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          strokeDasharray={c}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-lg font-semibold">
          <CountUp value={value} suffix="%" />
        </div>
        {label && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: string; children: ReactNode }) {
  const map: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/12 text-destructive",
    info: "bg-info/15 text-info",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        map[tone] ?? map.muted,
      )}
    >
      {children}
    </span>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const riseIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
} as const;

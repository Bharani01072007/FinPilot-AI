import { useEffect, useRef } from "react";

/**
 * Ambient AI background: aurora blobs (CSS) + neural particle mesh (canvas).
 * Canvas is DPR-aware, pauses off-screen, and respects reduced motion.
 */
export function AuroraBackground({ dense = false }: { dense?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let points: P[] = [];

    const seed = () => {
      const count = Math.min(
        dense ? 72 : 46,
        Math.round((window.innerWidth * window.innerHeight) / 26000),
      );
      points = Array.from({ length: Math.max(18, count) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.7,
      }));
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains("dark");
      const node = isDark ? "148, 180, 255" : "37, 99, 235";

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
        }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 150) {
            ctx.strokeStyle = `rgba(${node}, ${(1 - d / 150) * (isDark ? 0.16 : 0.12)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${node}, ${isDark ? 0.5 : 0.35})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [dense]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="animate-aurora absolute -left-[15%] -top-[20%] h-[60vw] w-[60vw] rounded-full bg-primary/25 blur-[120px]" />
      <div
        className="animate-aurora absolute -right-[10%] top-[5%] h-[50vw] w-[50vw] rounded-full bg-indigo/25 blur-[130px]"
        style={{ animationDelay: "-8s" }}
      />
      <div
        className="animate-aurora absolute bottom-[-25%] left-[20%] h-[55vw] w-[55vw] rounded-full bg-cyan/20 blur-[140px]"
        style={{ animationDelay: "-16s" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)",
        }}
      />
    </div>
  );
}

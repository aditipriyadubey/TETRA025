import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Reveal --------------------------------- */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },

      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-[900ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        shown ? "translate-y-0 opacity-100 blur-0" : "translate-y-6 opacity-0 blur-[2px]",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ----------------------------------- Pill ---------------------------------- */

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5",
        "text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ SectionHeading ----------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <Pill>{eyebrow}</Pill> : null}
      <h2 className="display mt-6 text-4xl text-balance text-gradient sm:text-5xl">{title}</h2>
      {subtitle ? (
        <p className="mt-5 text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------- Buttons --------------------------------- */

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full",
        "bg-foreground px-6 py-3 text-sm font-medium text-background",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_oklch(1_0_0/0.5)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border-strong",
        "bg-card/50 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Waveform --------------------------------- */

export function Waveform({
  active = true,
  bars = 44,
  className,
  height = 46,
}: {
  active?: boolean;
  bars?: number;
  className?: string;
  height?: number;
}) {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active || !mounted) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 110);
    return () => window.clearInterval(id);
  }, [active, mounted]);

  const live = active && mounted;

  return (
    <div
      className={cn("flex items-center gap-[3px]", className)}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const seed = Math.sin(i * 1.7 + tick * 0.6) * 0.5 + 0.5;
        const envelope = Math.sin((i / bars) * Math.PI) * 0.85 + 0.15;
        const h = live ? Math.max(3, Math.round(seed * envelope * height)) : 3;
        return (
          <span
            key={i}
            className="w-[3px] rounded-full transition-[height,background-color] duration-150 ease-out"
            style={{
              height: h,
              background: live
                ? `color-mix(in oklab, var(--primary) ${Math.round(40 + seed * 60)}%, var(--emerald))`
                : "oklch(1 0 0 / 14%)",
            }}
          />
        );
      })}
    </div>
  );
}


/* ------------------------------- Typing text ------------------------------- */

export function useTypedText(text: string, speed = 18, enabled = true) {
  const [out, setOut] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setOut(text);
      return;
    }
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, enabled]);

  return out;
}

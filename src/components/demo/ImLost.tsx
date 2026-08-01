import { useEffect, useState } from "react";
import { Check, LifeBuoy, Loader2, RefreshCw, X } from "lucide-react";
import { LOST_RECAP } from "@/lib/mock-data";

export function ImLost({ variant = "floating" }: { variant?: "floating" | "inline" }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    if (!open) return;
    setPhase("loading");
    const id = window.setTimeout(() => setPhase("ready"), 1400);
    return () => window.clearTimeout(id);
  }, [open]);

  const trigger = (
    <button
      onClick={() => setOpen(true)}
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-destructive/25 bg-destructive/10 px-4 py-3 text-[13px] font-medium text-foreground backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-destructive/50 hover:shadow-[0_18px_44px_-20px_oklch(0.62_0.15_22/0.8)]"
    >
      <span className="absolute inset-0 animate-pulse-ring rounded-full border border-destructive/30" />
      <LifeBuoy className="size-4 text-destructive" />
      I'm Lost
    </button>
  );

  return (
    <>
      {variant === "floating" ? (
        <div className="fixed bottom-6 left-5 z-40">{trigger}</div>
      ) : (
        trigger
      )}

      {open ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="glass animate-rise relative w-full max-w-lg overflow-hidden rounded-3xl shadow-[var(--shadow-glow)]">
            <div className="pointer-events-none absolute -top-24 -left-16 size-56 rounded-full bg-destructive/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4 border-b border-border px-7 py-5">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-2.5 py-1 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  <LifeBuoy className="size-3 text-destructive" />
                  Rescue
                </span>
                <h3 className="display mt-3 text-2xl">I missed the last 5 minutes.</h3>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Window {LOST_RECAP.window}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full border border-border p-2 text-muted-foreground transition-all hover:rotate-90 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative px-7 py-6">
              {phase === "loading" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    Rewinding the transcript and rebuilding context…
                  </div>
                  {[90, 70, 80, 55].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 rounded-full"
                      style={{
                        width: `${w}%`,
                        background:
                          "linear-gradient(90deg, oklch(1 0 0 / 6%) 25%, oklch(1 0 0 / 14%) 37%, oklch(1 0 0 / 6%) 63%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer-x 1.4s linear infinite",
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="animate-rise">
                  <p className="text-[13.5px] leading-relaxed text-foreground/85">
                    {LOST_RECAP.summary}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {LOST_RECAP.points.map((p, i) => (
                      <li
                        key={p}
                        className="animate-rise flex gap-3 rounded-2xl border border-border bg-elevated/60 px-4 py-3 text-[13px] leading-relaxed text-foreground/85"
                        style={{ animationDelay: `${i * 90}ms` }}
                      >
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald" />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3">
                    <p className="text-[12.5px] text-emerald/90">{LOST_RECAP.next}</p>
                    <button
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[12.5px] font-medium text-background transition-transform hover:-translate-y-0.5"
                    >
                      Rejoin lecture
                    </button>
                  </div>

                  <button
                    onClick={() => setPhase("loading")}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <RefreshCw className="size-3" />
                    Recap again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

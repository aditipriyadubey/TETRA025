import { useState } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { MEMORY } from "@/lib/mock-data";

export function MemoryPanel() {
  const [active, setActive] = useState(MEMORY.length - 1);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="surface relative overflow-hidden p-6">
        <div className="pointer-events-none absolute top-0 bottom-0 left-[46px] w-px bg-gradient-to-b from-transparent via-border-strong to-transparent" />
        <ol className="space-y-3">
          {MEMORY.map((l, i) => {
            const isActive = i === active;
            return (
              <li key={l.id}>
                <button
                  onClick={() => setActive(i)}
                  className={`group flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-400 ${
                    isActive
                      ? "border-primary/35 bg-primary/[0.07] shadow-[var(--shadow-glow)]"
                      : "border-transparent hover:border-border hover:bg-elevated/60"
                  }`}
                >
                  <span
                    className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border font-mono text-[11px] transition-colors duration-400 ${
                      l.status === "current"
                        ? "border-emerald/40 bg-emerald/10 text-emerald"
                        : isActive
                          ? "border-primary/40 bg-card text-primary"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {l.id}
                    {l.status === "current" ? (
                      <span className="absolute inset-0 animate-pulse-ring rounded-xl border border-emerald/40" />
                    ) : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-medium">{l.title}</span>
                      {l.status === "current" ? (
                        <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[9.5px] tracking-wider text-emerald uppercase">
                          Live
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10.5px] text-muted-foreground">
                      {l.date} · {l.concepts.length} concepts
                    </span>
                  </span>

                  <ChevronRight
                    className={`size-4 shrink-0 transition-all duration-300 ${
                      isActive
                        ? "translate-x-0 text-primary"
                        : "-translate-x-1 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="surface relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-24 -right-20 size-56 rounded-full bg-emerald/10 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <Brain className="size-4 text-emerald" strokeWidth={1.8} />
          <h4 className="text-[13px] font-medium tracking-tight">What the AI carries forward</h4>
        </div>

        {(() => {
          const l = MEMORY[active];
          if (!l) return null;
          return (
            <div key={l.id} className="animate-rise relative mt-6">
              <p className="display text-2xl">{l.title}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{l.date}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {l.concepts.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-border bg-elevated px-3 py-1.5 text-[11.5px] text-foreground/80"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-elevated/60 p-4">
                <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  Memory link
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">{l.carried}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

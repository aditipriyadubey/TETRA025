import { Languages, Lightbulb, Sparkles } from "lucide-react";
import {
  ANALOGIES,
  EXPLANATIONS,
  LANGUAGES,
  type Difficulty,
  type LanguageCode,
} from "@/lib/mock-data";
import { useTypedText } from "@/components/kit";

export function ExplanationPanel({
  language,
  difficulty,
  live,
}: {
  language: LanguageCode;
  difficulty: Difficulty;
  live: boolean;
}) {
  const text = EXPLANATIONS[difficulty][language];
  const typed = useTypedText(text, 12, live);
  const lang = LANGUAGES.find((l) => l.code === language);

  return (
    <div className="surface relative flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]" />

      <header className="relative flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-emerald" strokeWidth={1.8} />
          <h3 className="text-[13px] font-medium tracking-tight">AI Explanation</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1.5">
          <Languages className="size-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{lang?.native}</span>
          <span className="text-[11px] text-muted-foreground/40">·</span>
          <span className="text-[11px] text-primary">{difficulty}</span>
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto px-6 py-8">
        <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Now explaining
        </p>
        <h4 className="display mt-3 text-3xl">Quantum Superposition</h4>

        <p
          key={`${language}-${difficulty}`}
          className="animate-rise mt-7 text-[16px] leading-[1.85] text-pretty text-foreground/90"
        >
          {typed}
          {live && typed.length < text.length ? (
            <span className="animate-caret text-emerald">▍</span>
          ) : null}
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-elevated/60 p-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-3.5 text-emerald" />
            <span className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Smart analogy
            </span>
          </div>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/80 italic">
            {ANALOGIES[difficulty]}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { k: "Comprehension", v: "92%" },
            { k: "Pace", v: "Matched" },
            { k: "Terms decoded", v: "6" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-border bg-card/60 px-3 py-3">
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{s.k}</p>
              <p className="mt-1 font-mono text-sm text-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

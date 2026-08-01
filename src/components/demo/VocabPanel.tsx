import { useState } from "react";
import { Bookmark, Volume2 } from "lucide-react";
import { VOCABULARY } from "@/lib/mock-data";

export function VocabPanel() {
  const [saved, setSaved] = useState<string[]>(["Coherence"]);

  const toggle = (word: string) =>
    setSaved((s) => (s.includes(word) ? s.filter((w) => w !== word) : [...s, word]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {VOCABULARY.map((v) => {
        const isSaved = saved.includes(v.word);
        return (
          <article
            key={v.word}
            className="surface card-hover group relative overflow-hidden p-5"
          >
            <div className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full bg-emerald/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <h4 className="text-[17px] font-medium tracking-tight">{v.word}</h4>
                <button className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground transition-colors hover:text-primary">
                  <Volume2 className="size-3" />
                  {v.pronunciation}
                </button>
              </div>
              <button
                onClick={() => toggle(v.word)}
                aria-label={isSaved ? "Remove bookmark" : "Bookmark word"}
                className={`rounded-full border p-2 transition-all duration-300 ${
                  isSaved
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                <Bookmark className={`size-3.5 ${isSaved ? "fill-current" : ""}`} />
              </button>
            </div>

            <p className="relative mt-4 text-[13px] leading-relaxed text-foreground/85">
              {v.meaning}
            </p>
            <p className="relative mt-3 border-l border-border pl-3 text-[12.5px] leading-relaxed text-muted-foreground italic">
              {v.example}
            </p>

            <div className="relative mt-4 flex items-center justify-between">
              <span className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                {v.level}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {isSaved ? "saved" : "tap to save"}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

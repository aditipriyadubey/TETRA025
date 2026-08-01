import { BookMarked, Tag } from "lucide-react";
import type { GlossaryEntry } from "@/lib/api";

interface GlossaryPanelProps {
  glossary: GlossaryEntry[];
  keywords: string[];
}

export function GlossaryPanel({ glossary, keywords }: GlossaryPanelProps) {
  return (
    <div className="surface flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookMarked className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium tracking-tight">Technical Glossary & Keywords</h3>
            <p className="text-[11px] text-muted-foreground">Auto-extracted terms, definitions & simple intuition</p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 space-y-4 pt-3 pr-1">
        {/* Keywords Badges */}
        {keywords.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-muted-foreground">
              <Tag className="size-3 text-primary" />
              <span>Lecture Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Glossary Terms List */}
        {glossary.length > 0 ? (
          <div className="space-y-3">
            <div className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground">
              Technical Terms ({glossary.length})
            </div>
            {glossary.map((entry, index) => (
              <div
                key={index}
                className="animate-rise rounded-2xl border border-border/50 bg-background/50 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground">{entry.term}</h4>
                  <span className="text-[10px] font-mono bg-elevated px-2 py-0.5 rounded-full text-muted-foreground">
                    Jargon
                  </span>
                </div>
                {entry.definition && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground/80 font-medium">Definition: </strong>
                    {entry.definition}
                  </p>
                )}
                {entry.simple_explanation && (
                  <div className="rounded-xl bg-emerald/5 border border-emerald/15 p-2.5 text-xs text-emerald-300 leading-relaxed">
                    <strong className="font-medium text-emerald-400">Simple Intuition: </strong>
                    {entry.simple_explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground/60">
            <BookMarked className="size-8 mb-2 stroke-1" />
            <p className="text-xs">Technical terms will be automatically extracted and defined here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { BookMarked, Brain, Layers, MessageCircleQuestion, NotebookPen } from "lucide-react";
import { DICTIONARY } from "@/lib/mock-data";
import { useDictionary } from "./dictionary";
import { NotesPanel } from "./NotesPanel";
import { VocabPanel } from "./VocabPanel";
import { MemoryPanel } from "./MemoryPanel";
import { AskAI } from "./AskAI";

const TABS = [
  { id: "ask", label: "Ask AI", icon: MessageCircleQuestion },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "vocab", label: "Vocab", icon: Layers },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "dict", label: "Dictionary", icon: BookMarked },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CompanionPanel() {
  const [tab, setTab] = useState<TabId>("ask");
  const { open } = useDictionary();

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="glass flex gap-1 overflow-x-auto rounded-2xl p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] whitespace-nowrap transition-all duration-300 ${
                active
                  ? "bg-elevated text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`size-3.5 ${active ? "text-primary" : ""}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} className="animate-rise min-h-0 flex-1 overflow-y-auto">
        {tab === "ask" ? <AskAI variant="inline" /> : null}
        {tab === "notes" ? <NotesPanel compact /> : null}
        {tab === "vocab" ? <VocabPanel /> : null}
        {tab === "memory" ? <MemoryPanel /> : null}
        {tab === "dict" ? (
          <div className="surface p-5">
            <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Technical dictionary
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Terms detected in this lecture. Tap one to open the full card.
            </p>
            <div className="mt-5 space-y-2">
              {Object.values(DICTIONARY).map((d) => (
                <button
                  key={d.term}
                  onClick={() => open(d.term)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-elevated/50 px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35"
                >
                  <span>
                    <span className="block text-[13.5px] font-medium">{d.term}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                      {d.simple}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground transition-colors group-hover:text-primary">
                    {d.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

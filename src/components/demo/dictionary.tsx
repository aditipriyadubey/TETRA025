import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { BookMarked, Volume2, X } from "lucide-react";
import { DICTIONARY, type DictionaryEntry } from "@/lib/mock-data";

type Ctx = { open: (term: string) => void };
const DictionaryContext = createContext<Ctx>({ open: () => {} });

export function useDictionary() {
  return useContext(DictionaryContext);
}

export function lookup(term: string): DictionaryEntry | undefined {
  return DICTIONARY[term.toLowerCase()];
}

export function DictionaryProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);

  const open = useCallback((term: string) => {
    const found = lookup(term);
    if (found) setEntry(found);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <DictionaryContext.Provider value={value}>
      {children}
      <DictionaryDialog entry={entry} onClose={() => setEntry(null)} />
    </DictionaryContext.Provider>
  );
}

/** Renders text with known technical terms as clickable, glowing chips. */
export function TermText({ text, terms = [] }: { text: string; terms?: string[] }) {
  const { open } = useDictionary();
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isTerm = terms.some((t) => t.toLowerCase() === part.toLowerCase()) && lookup(part);
        if (!isTerm) return <span key={i}>{part}</span>;
        return (
          <button
            key={i}
            onClick={() => open(part)}
            className="mx-[1px] cursor-pointer rounded-md border-b border-dashed border-primary/50 px-0.5 text-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
          >
            {part}
          </button>
        );
      })}
    </>
  );
}

function DictionaryDialog({
  entry,
  onClose,
}: {
  entry: DictionaryEntry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="glass animate-rise relative w-full max-w-lg overflow-hidden rounded-3xl shadow-[var(--shadow-glow)]">
        <div className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 py-1 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                <BookMarked className="size-3 text-emerald" />
                {entry.category}
              </span>
              <h3 className="display mt-4 text-3xl">{entry.term}</h3>
              <button className="mt-2 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary">
                <Volume2 className="size-3.5" />
                {entry.pronunciation}
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-border p-2 text-muted-foreground transition-all hover:rotate-90 hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-7 space-y-5">
            <Block label="Definition" body={entry.definition} />
            <Block label="Simple explanation" body={entry.simple} tone="emerald" />
            <Block label="Real life analogy" body={entry.analogy} tone="primary" />

            <div>
              <Label>Examples</Label>
              <ul className="mt-2 space-y-1.5">
                {entry.examples.map((ex) => (
                  <li
                    key={ex}
                    className="rounded-xl border border-border bg-elevated/60 px-3 py-2 font-mono text-[12px] text-muted-foreground"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Label>Related terms</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.related.map((r) => (
                  <RelatedChip key={r} term={r} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedChip({ term }: { term: string }) {
  const { open } = useDictionary();
  const known = Boolean(lookup(term));
  return (
    <button
      onClick={() => known && open(term)}
      className={`rounded-full border border-border px-3 py-1.5 text-xs transition-all duration-300 ${
        known
          ? "cursor-pointer text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          : "cursor-default text-muted-foreground"
      }`}
    >
      {term}
    </button>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function Block({
  label,
  body,
  tone,
}: {
  label: string;
  body: string;
  tone?: "primary" | "emerald";
}) {
  return (
    <div>
      <Label>{label}</Label>
      <p
        className={`mt-1.5 text-[13.5px] leading-relaxed ${
          tone === "emerald"
            ? "text-emerald/90"
            : tone === "primary"
              ? "text-primary/90"
              : "text-foreground/85"
        }`}
      >
        {body}
      </p>
    </div>
  );
}

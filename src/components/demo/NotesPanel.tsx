import { useState } from "react";
import { Download, FileText, Quote, Sigma } from "lucide-react";
import { NOTES } from "@/lib/mock-data";
import { toast } from "sonner";

export function NotesPanel({ compact = false }: { compact?: boolean }) {
  const [exporting, setExporting] = useState(false);

  const exportPdf = () => {
    setExporting(true);
    window.setTimeout(() => {
      setExporting(false);
      toast.success("Notes exported", {
        description: "quantum-superposition-notes.pdf saved to your device.",
      });
    }, 1400);
  };

  return (
    <div className="surface relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 31px, oklch(1 0 0 / 4%) 31px 32px)",
        }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-12 w-px bg-primary/15" />

      <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <FileText className="size-4 text-primary" strokeWidth={1.8} />
          <h3 className="text-[13px] font-medium tracking-tight">AI Notes</h3>
        </div>
        <button
          onClick={exportPdf}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-3.5 py-1.5 text-[11.5px] transition-all duration-300 hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          <Download className={`size-3.5 ${exporting ? "animate-bounce" : ""}`} />
          {exporting ? "Preparing…" : "Export PDF"}
        </button>
      </header>

      <div
        className={`relative overflow-y-auto px-6 py-7 pl-20 ${compact ? "max-h-[520px]" : "max-h-[620px]"}`}
      >
        <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {NOTES.course}
        </p>
        <h4 className="display mt-2 text-3xl">{NOTES.title}</h4>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{NOTES.date}</p>

        <Section title="Key points">
          <ul className="space-y-2.5">
            {NOTES.keyPoints.map((p) => (
              <li key={p} className="flex gap-3 text-[13.5px] leading-relaxed text-foreground/85">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald" />
                {p}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Formulas">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {NOTES.formulas.map((f) => (
              <div
                key={f.expr}
                className="group rounded-2xl border border-border bg-elevated/70 p-4 transition-colors duration-300 hover:border-primary/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sigma className="size-3" />
                  <span className="text-[9.5px] tracking-[0.16em] uppercase">Formula</span>
                </div>
                <p className="mt-2 font-mono text-[14px] text-primary">{f.expr}</p>
                <p className="mt-1.5 text-[11.5px] text-muted-foreground">{f.note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Definitions">
          <div className="space-y-3">
            {NOTES.definitions.map((d) => (
              <div key={d.term} className="rounded-2xl border border-border bg-card/60 p-4">
                <p className="text-[13px] font-medium">{d.term}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{d.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Examples">
          <ul className="space-y-2">
            {NOTES.examples.map((e) => (
              <li
                key={e}
                className="rounded-xl border border-border bg-elevated/50 px-4 py-3 text-[13px] text-muted-foreground"
              >
                {e}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Summary">
          <div className="relative rounded-2xl border border-emerald/20 bg-emerald/5 p-5">
            <Quote className="absolute top-4 right-4 size-4 text-emerald/40" />
            <p className="text-[13.5px] leading-relaxed text-foreground/85">{NOTES.summary}</p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <p className="mb-3 text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </section>
  );
}

import { NotebookPen, Sparkles } from "lucide-react";
import { TTSButton } from "./TTSButton";

interface NotesPanelProps {
  notes: string;
  summary?: string;
  isProcessing?: boolean;
}

export function NotesPanel({ notes, summary, isProcessing = false }: NotesPanelProps) {
  return (
    <div className="surface flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
            <NotebookPen className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium tracking-tight">AI Lecture Notes</h3>
            <p className="text-[11px] text-muted-foreground">Auto-generated structured notes & running summary</p>
          </div>
        </div>

        {notes && <TTSButton text={notes} />}
      </div>

      <div className="overflow-y-auto flex-1 space-y-4 pt-3 pr-1">
        {summary && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              <span>Running Summary</span>
            </div>
            <p className="text-xs leading-relaxed text-foreground/90">{summary}</p>
          </div>
        )}

        {notes ? (
          <div className="rounded-2xl border border-border/50 bg-background/40 p-4 space-y-2">
            <div className="text-xs font-mono tracking-wider uppercase text-muted-foreground mb-2">
              Key Takeaways & Concept Notes
            </div>
            <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed space-y-2 whitespace-pre-wrap">
              {notes}
            </div>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground/60">
            <NotebookPen className="size-8 mb-2 stroke-1" />
            <p className="text-xs">Notes will automatically appear here as the lecture is processed.</p>
            {isProcessing && <p className="text-[11px] text-emerald animate-pulse mt-1">Generating study notes...</p>}
          </div>
        )}
      </div>
    </div>
  );
}

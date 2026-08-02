import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, Loader2, X, Compass } from "lucide-react";

interface ImLostButtonProps {
  onImLost: (currentDifficulty: string) => Promise<string | null>;
  currentDifficulty: string;
}

export function ImLostButton({ onImLost, currentDifficulty }: ImLostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTrigger = async () => {
    setIsOpen(true);
    setLoading(true);
    setExplanation(null);

    const result = await onImLost(currentDifficulty);
    setExplanation(result);
    setLoading(false);
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="animate-rise glass max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-destructive/30 relative my-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <Compass className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-medium tracking-tight">Rescue Explanation</h3>
              <p className="text-xs text-muted-foreground">Simplifying ONLY the current section</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <Loader2 className="size-8 animate-spin text-destructive" />
            <p className="text-xs text-muted-foreground">
              Stepping down complexity & building section rescue...
            </p>
          </div>
        ) : explanation ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4 text-xs leading-relaxed space-y-3 whitespace-pre-wrap">
              {explanation}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground">
            Unable to generate rescue explanation at this moment. Ensure audio transcript has been captured.
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full bg-foreground px-5 py-2 text-xs font-medium text-background transition-all hover:opacity-90"
          >
            Got It! Back to Class
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={handleTrigger}
        className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive transition-all duration-300 hover:bg-destructive/20 hover:border-destructive/60 hover:-translate-y-0.5 shadow-sm"
      >
        <HelpCircle className="size-4 animate-bounce" />
        <span>I'm Lost</span>
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}

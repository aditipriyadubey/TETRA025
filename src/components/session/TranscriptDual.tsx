import { useRef, useEffect } from "react";
import { Mic, Languages } from "lucide-react";
import { TTSButton } from "./TTSButton";

interface TranscriptDualProps {
  originalTranscript: string[];
  translatedTranscript: string[];
  targetLanguage: string;
  isRecording?: boolean;
  isProcessing?: boolean;
}

export function TranscriptDual({
  originalTranscript,
  translatedTranscript,
  targetLanguage,
  isRecording = false,
  isProcessing = false,
}: TranscriptDualProps) {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as transcript updates
  useEffect(() => {
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    }
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = rightScrollRef.current.scrollHeight;
    }
  }, [originalTranscript, translatedTranscript]);

  const fullTranslatedText = translatedTranscript.join(" ");

  return (
    <div className="surface flex h-full flex-col overflow-hidden p-4 sm:p-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mic className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium tracking-tight">Live Classroom Dual Transcript</h3>
            <p className="text-[11px] text-muted-foreground">Original vs Translated ({targetLanguage})</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fullTranslatedText && (
            <TTSButton text={fullTranslatedText} language={targetLanguage} />
          )}

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] ${
              isRecording
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-elevated/50 text-muted-foreground"
            }`}
          >
            <span className="relative flex size-1.5">
              {isRecording && (
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/60" />
              )}
              <span
                className={`relative size-1.5 rounded-full ${
                  isRecording ? "bg-destructive" : "bg-muted-foreground/40"
                }`}
              />
            </span>
            {isRecording ? "Live Mic" : "Idle"}
          </span>
        </div>
      </div>

      {/* Side by Side Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 flex-1 pt-3">
        {/* Left Side: Original Transcript */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-border/50 bg-background/40 p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
            <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
              <Mic className="size-3 text-primary" />
              Original Speech (Whisper STT)
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">EN</span>
          </div>

          <div ref={leftScrollRef} className="overflow-y-auto flex-1 space-y-2.5 pr-1">
            {originalTranscript.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground/60">
                <p className="text-xs">Awaiting spoken lecture or audio input...</p>
                {isProcessing && <p className="text-[11px] text-primary mt-1 animate-pulse">Processing audio chunk with Groq Whisper...</p>}
              </div>
            ) : (
              originalTranscript.map((chunk, index) => (
                <div key={index} className="animate-rise rounded-xl bg-elevated/40 p-3 text-xs leading-relaxed text-foreground">
                  <span className="text-[10px] font-mono text-muted-foreground/70 block mb-1">
                    Chunk #{index + 1}
                  </span>
                  {chunk}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Translated Transcript */}
        <div className="flex flex-col min-h-0 rounded-2xl border border-border/50 bg-background/40 p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
            <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
              <Languages className="size-3 text-emerald" />
              Translated Transcript
            </span>
            <span className="text-[10px] font-medium text-emerald font-mono uppercase">{targetLanguage}</span>
          </div>

          <div ref={rightScrollRef} className="overflow-y-auto flex-1 space-y-2.5 pr-1">
            {translatedTranscript.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground/60">
                <p className="text-xs">Translation & AI notes will generate when recording is stopped.</p>
              </div>
            ) : (
              translatedTranscript.map((chunk, index) => (
                <div key={index} className="animate-rise rounded-xl bg-primary/5 border border-primary/10 p-3 text-xs leading-relaxed text-foreground">
                  <span className="text-[10px] font-mono text-primary/70 block mb-1">
                    {targetLanguage} · Chunk #{index + 1}
                  </span>
                  {chunk}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { AudioLines } from "lucide-react";
import { TRANSCRIPT } from "@/lib/mock-data";
import { TermText } from "./dictionary";

export function TranscriptPanel({ listening }: { listening: boolean }) {
  const [count, setCount] = useState(2);
  const [typed, setTyped] = useState<string>("");
  const scroller = useRef<HTMLDivElement>(null);

  const activeLine = TRANSCRIPT[Math.min(count, TRANSCRIPT.length - 1)];

  // Type the active line, then advance (looping through the lecture).
  useEffect(() => {
    if (!listening || !activeLine) return;
    setTyped("");
    let i = 0;
    const typer = window.setInterval(() => {
      i += 1;
      setTyped(activeLine.text.slice(0, i));
      if (i >= activeLine.text.length) {
        window.clearInterval(typer);
        window.setTimeout(() => {
          setCount((c) => (c + 1 >= TRANSCRIPT.length ? 2 : c + 1));
        }, 1600);
      }
    }, 22);
    return () => window.clearInterval(typer);
  }, [listening, activeLine]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [typed, count]);

  const settled = TRANSCRIPT.slice(0, count);

  return (
    <div className="surface flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <AudioLines className="size-4 text-primary" strokeWidth={1.8} />
          <h3 className="text-[13px] font-medium tracking-tight">Live Transcript</h3>
        </div>
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          <span
            className={`size-1.5 rounded-full ${listening ? "bg-emerald" : "bg-muted-foreground"}`}
          />
          {listening ? "Recording" : "Paused"}
        </span>
      </header>

      <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {settled.map((line) => (
          <Line key={line.id} line={line} />
        ))}

        {activeLine ? (
          <div className="animate-rise">
            <Meta speaker={activeLine.speaker} time={activeLine.time} />
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/90">
              <TermText text={typed} terms={activeLine.terms ?? []} />
              {listening ? <span className="animate-caret text-primary">▍</span> : null}
            </p>
          </div>
        ) : null}
      </div>

      <footer className="border-t border-border px-5 py-3">
        <p className="font-mono text-[10.5px] text-muted-foreground">
          {settled.length + 1} segments · terms auto-detected · tap any underlined word
        </p>
      </footer>
    </div>
  );
}

function Line({ line }: { line: (typeof TRANSCRIPT)[number] }) {
  return (
    <div className="group">
      <Meta speaker={line.speaker} time={line.time} />
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
        <TermText text={line.text} terms={line.terms ?? []} />
      </p>
    </div>
  );
}

function Meta({ speaker, time }: { speaker: string; time: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-[11px] font-medium ${speaker === "Professor" ? "text-primary" : "text-emerald"}`}
      >
        {speaker}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">{time}</span>
    </div>
  );
}

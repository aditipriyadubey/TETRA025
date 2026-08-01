import { useRef } from "react";
import { Mic, Pause, Play, Upload } from "lucide-react";
import { toast } from "sonner";
import { Waveform } from "@/components/kit";

export function ControlBar({
  listening,
  setListening,
}: {
  listening: boolean;
  setListening: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-5 rounded-3xl px-5 py-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setListening(!listening)}
          aria-label={listening ? "Stop recording" : "Start recording"}
          className={`relative flex size-12 items-center justify-center rounded-full transition-all duration-300 ${
            listening
              ? "bg-destructive/15 text-destructive"
              : "bg-foreground text-background hover:-translate-y-0.5"
          }`}
        >
          {listening ? (
            <>
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/25" />
              <Mic className="relative size-5" />
            </>
          ) : (
            <Mic className="size-5" />
          )}
        </button>

        <div>
          <p className="text-[13px] font-medium tracking-tight">
            {listening ? "Listening to PHY-341" : "Microphone paused"}
          </p>
          <p className="font-mono text-[10.5px] text-muted-foreground">
            {listening ? "00:52:14 · 48 kHz · low latency" : "Tap the mic to resume capture"}
          </p>
        </div>
      </div>

      <Waveform active={listening} bars={40} height={34} className="hidden md:flex" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setListening(!listening)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-4 py-2.5 text-[12.5px] transition-all duration-300 hover:border-primary/40 hover:text-primary"
        >
          {listening ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {listening ? "Pause" : "Resume"}
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-4 py-2.5 text-[12.5px] transition-all duration-300 hover:border-emerald/40 hover:text-emerald"
        >
          <Upload className="size-3.5" />
          Upload Lecture
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => {
            const name = e.target.files?.[0]?.name ?? "lecture-recording.m4a";
            toast.success("Lecture queued", {
              description: `${name} · transcribing offline, notes ready in ~2 min.`,
            });
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

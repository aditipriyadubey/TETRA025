import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Upload,
  Mic,
  MicOff,
  FileVideo,
  Radio,
  Brain,
  Layers,
  NotebookPen,
  MessageCircleQuestion,
  BookMarked,
  X,
  Pause,
  Play,
  Square,
  Save,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { TopBar } from "@/components/demo/TopBar";
import { Waveform } from "@/components/kit";
import type { Difficulty, LanguageCode } from "@/lib/mock-data";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try Now — EduBridge AI" },
      {
        name: "description",
        content:
          "Upload a lecture video or record live audio. Connect your own backend, API and dataset to power real-time transcripts and AI explanations.",
      },
      { property: "og:title", content: "Try Now — EduBridge AI" },
      {
        property: "og:description",
        content: "Upload or record a lecture and connect your own AI backend for real-time classroom assistance.",
      },
    ],
  }),
  component: TryNow,
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type InputMode = "idle" | "upload" | "record";
type RecordingState = "idle" | "recording" | "paused";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TryNow() {
  const [mode, setMode] = useState<InputMode>("idle");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [difficulty, setDifficulty] = useState<Difficulty>("Grade 10");


  /* Upload state */
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  /* Recording state */
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  /* Save dialog state */
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFileName, setSaveFileName] = useState("");
  const pendingBlobRef = useRef<Blob | null>(null);


  /* ── Recording helpers ─────────────────────────────────────────────────── */

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        pendingBlobRef.current = blob;
        setSaveFileName(`lecture-${new Date().toISOString().slice(0, 10)}`);
        setShowSaveDialog(true);
      };

      mediaRecorderRef.current = mr;
      mr.start(250);
      setRecordingState("recording");
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied", {
        description: "Please allow microphone access in your browser settings.",
      });
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecordingState("idle");
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSaveRecording = useCallback(() => {
    const blob = pendingBlobRef.current;
    if (!blob) return;
    const name = saveFileName.trim() || "recording";
    const file = new File([blob], `${name}.webm`, { type: "audio/webm" });
    setUploadedFile(file);
    setShowSaveDialog(false);
    pendingBlobRef.current = null;
    toast.success("Recording saved", {
      description: `${name}.webm · ${(blob.size / 1024).toFixed(0)} KB — ready to process.`,
    });
  }, [saveFileName]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isLiveSession = mode === "record" && (recordingState === "recording" || recordingState === "paused");

  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 pt-4 pb-28">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-30 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-[160px]" />

      <div className="relative mx-auto max-w-[1400px] space-y-4">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="glass flex items-center justify-between rounded-3xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
            <span className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-background">
                <GraduationCap className="size-4" strokeWidth={2.2} />
              </span>
              <span className="text-[14px] font-medium tracking-tight">
                EduBridge AI · Try Now
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 font-mono text-[10.5px] tracking-widest text-muted-foreground uppercase sm:flex">
              <span className={`size-1.5 rounded-full ${
                recordingState === "recording" ? "bg-destructive" :
                recordingState === "paused" ? "bg-yellow-500" :
                uploadedFile ? "bg-emerald" : "bg-muted-foreground/40"
              }`} />
              {recordingState === "recording" ? "Recording" :
               recordingState === "paused" ? "Paused" :
               uploadedFile ? "File loaded" : "Awaiting input"}
            </span>
          </div>
        </header>

        {/* ── TopBar (language / difficulty) ──────────────────────────── */}
        <TopBar
          language={language}
          setLanguage={setLanguage}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />

        {/* ── Input Mode Cards (only when idle) ──────────────────────── */}
        {mode === "idle" && !uploadedFile && (
          <div className="animate-rise grid gap-4 md:grid-cols-2">
            <InputCard
              onClick={() => setMode("upload")}
              icon={<FileVideo className="size-8 text-primary" strokeWidth={1.4} />}
              title="Upload Video / Audio"
              description="Drop a lecture recording to transcribe and analyze. Supports MP4, WebM, MP3, M4A, WAV and more."
              accent="primary"
            />
            <InputCard
              onClick={() => {
                setMode("record");
                // Don't auto-start — user clicks mic in the control bar
              }}
              icon={<Radio className="size-8 text-emerald" strokeWidth={1.4} />}
              title="Record Live Audio"
              description="Use your microphone to capture a live lecture. Real-time transcription when backend is connected."
              accent="emerald"
            />
          </div>
        )}

        {/* ── Upload Panel ────────────────────────────────────────────── */}
        {mode === "upload" && !uploadedFile && <UploadZone onFile={(f) => setUploadedFile(f)} onCancel={() => setMode("idle")} />}

        {/* ── Live Recording: full demo layout ────────────────────────── */}
        {mode === "record" && !uploadedFile && (
          <>
            {/* 3-column results grid — shown immediately */}
            <div className="animate-rise grid gap-4 xl:grid-cols-[0.8fr_1.1fr_0.95fr]">
              <div className="h-[520px]">
                <EmptyPanel
                  icon={<Mic className="size-5" />}
                  title="Transcript"
                  description={
                    isLiveSession
                      ? "Live transcript will appear here as audio is processed by your speech-to-text API."
                      : "Start recording to begin capturing audio. Transcript will populate when connected to a backend."
                  }
                  hint={
                    isLiveSession
                      ? "Recording — awaiting backend for live transcription"
                      : "Tap the mic to start recording"
                  }
                  status={isLiveSession ? "live" : "waiting"}
                />
              </div>
              <div className="h-[520px]">
                <EmptyPanel
                  icon={<Brain className="size-5" />}
                  title="AI Explanation"
                  description={`Adaptive explanations in ${language.toUpperCase()} at ${difficulty} level will render here as the lecture progresses.`}
                  hint={
                    isLiveSession
                      ? "Recording — awaiting model for explanations"
                      : "Start recording to generate explanations"
                  }
                  status={isLiveSession ? "live" : "waiting"}
                />
              </div>
              <div className="h-[520px]">
                <CompanionPlaceholder isLive={isLiveSession} />
              </div>
            </div>

            {/* Control bar — like the demo */}
            <LiveControlBar
              recordingState={recordingState}
              recordingTime={recordingTime}
              formatTime={formatTime}
              onStart={startRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
              onBack={() => {
                if (recordingState !== "idle") stopRecording();
                setMode("idle");
              }}
            />
          </>
        )}

        {/* ── Upload results (file loaded) ────────────────────────────── */}
        {uploadedFile && (
          <>
            <div className="animate-rise glass flex items-center justify-between rounded-2xl px-5 py-3">
              <div className="flex items-center gap-3">
                <FileVideo className="size-4 text-primary" />
                <div>
                  <p className="text-[13px] font-medium">{uploadedFile.name}</p>
                  <p className="font-mono text-[10.5px] text-muted-foreground">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · {uploadedFile.type || "unknown type"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setMode("idle");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                <X className="size-3" />
                Remove
              </button>
            </div>

            <div className="animate-rise grid gap-4 xl:grid-cols-[0.8fr_1.1fr_0.95fr]" style={{ animationDelay: "80ms" }}>
              <div className="h-[520px]">
                <EmptyPanel
                  icon={<Mic className="size-5" />}
                  title="Transcript"
                  description="Transcribed text will appear here once connected to a speech-to-text API."
                  hint="Awaiting backend processing"
                  status="waiting"
                />
              </div>
              <div className="h-[520px]">
                <EmptyPanel
                  icon={<Brain className="size-5" />}
                  title="AI Explanation"
                  description={`Adaptive explanations in ${language.toUpperCase()} at ${difficulty} level will render here.`}
                  hint="Awaiting model for explanations"
                  status="waiting"
                />
              </div>
              <div className="h-[520px]">
                <CompanionPlaceholder isLive={false} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Save Recording Dialog ──────────────────────────────────────── */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="animate-rise glass mx-4 w-full max-w-md rounded-3xl p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Save className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="text-[16px] font-medium">Save Recording</h3>
                <p className="text-[12px] text-muted-foreground">
                  {pendingBlobRef.current
                    ? `${(pendingBlobRef.current.size / 1024).toFixed(0)} KB captured`
                    : "Enter a name for your audio file"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                <FileVideo className="size-3.5" />
                File name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  placeholder="my-lecture"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveRecording(); }}
                  className="flex-1 rounded-xl border border-border bg-elevated/50 px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
                <span className="text-[13px] text-muted-foreground">.webm</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  pendingBlobRef.current = null;
                }}
                className="rounded-full border border-border px-4 py-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Discard
              </button>
              <button
                onClick={handleSaveRecording}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-[12px] font-medium text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_oklch(1_0_0/0.6)]"
              >
                <Save className="size-3.5" />
                Save Recording
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ConfigField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-elevated/50 px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
    </div>
  );
}

function InputCard({
  onClick,
  icon,
  title,
  description,
  accent,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "primary" | "emerald";
}) {
  return (
    <button
      onClick={onClick}
      className="group surface relative flex flex-col items-center gap-4 overflow-hidden p-10 text-center transition-all duration-500 card-hover"
    >
      <div
        className={`pointer-events-none absolute -bottom-20 left-1/2 size-48 -translate-x-1/2 rounded-full blur-[100px] transition-opacity duration-500 ${
          accent === "primary" ? "bg-primary/12" : "bg-emerald/12"
        } group-hover:opacity-100 opacity-40`}
      />
      <div className="relative">{icon}</div>
      <h3 className="relative text-lg font-medium tracking-tight">{title}</h3>
      <p className="relative max-w-xs text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </button>
  );
}

function UploadZone({ onFile, onCancel }: { onFile: (f: File) => void; onCancel: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onFile(file);
        toast.success("File loaded", { description: `${file.name} ready to process.` });
      }
    },
    [onFile],
  );

  return (
    <div className="animate-rise space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`surface group cursor-pointer flex flex-col items-center justify-center gap-4 py-20 transition-all duration-300 ${
          dragActive ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"
        }`}
      >
        <Upload
          className={`size-10 transition-all duration-300 ${
            dragActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
          }`}
          strokeWidth={1.4}
        />
        <div className="text-center">
          <p className="text-[14px] font-medium">
            {dragActive ? "Drop your file here" : "Drag & drop your lecture file"}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            or click to browse · MP4, WebM, MP3, M4A, WAV
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onFile(file);
              toast.success("File loaded", { description: `${file.name} ready to process.` });
            }
            e.target.value = "";
          }}
        />
      </div>
      <div className="flex justify-center">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to options
        </button>
      </div>
    </div>
  );
}

/* ── Live Control Bar (like demo ControlBar) ─────────────────────────────── */

function LiveControlBar({
  recordingState,
  recordingTime,
  formatTime,
  onStart,
  onPause,
  onResume,
  onStop,
  onBack,
}: {
  recordingState: RecordingState;
  recordingTime: number;
  formatTime: (s: number) => string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onBack: () => void;
}) {
  const isActive = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isIdle = recordingState === "idle";

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-5 rounded-3xl px-5 py-4">
      {/* Mic button */}
      <div className="flex items-center gap-4">
        <button
          onClick={isIdle ? onStart : isActive ? onPause : onResume}
          aria-label={isActive ? "Pause recording" : isIdle ? "Start recording" : "Resume recording"}
          className={`relative flex size-12 items-center justify-center rounded-full transition-all duration-300 ${
            isActive
              ? "bg-destructive/15 text-destructive"
              : isPaused
                ? "bg-yellow-500/15 text-yellow-500"
                : "bg-foreground text-background hover:-translate-y-0.5"
          }`}
        >
          {isActive && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/25" />
          )}
          {isActive ? (
            <Mic className="relative size-5" />
          ) : isPaused ? (
            <Pause className="size-5" />
          ) : (
            <Mic className="size-5" />
          )}
        </button>

        <div>
          <p className="text-[13px] font-medium tracking-tight">
            {isActive ? "Recording live audio" : isPaused ? "Recording paused" : "Microphone ready"}
          </p>
          <p className="font-mono text-[10.5px] text-muted-foreground">
            {isActive
              ? `${formatTime(recordingTime)} · capturing`
              : isPaused
                ? `${formatTime(recordingTime)} · paused — tap to resume`
                : "Tap the mic to start recording"}
          </p>
        </div>
      </div>

      {/* Waveform */}
      <Waveform active={isActive} bars={40} height={34} className="hidden md:flex" />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {!isIdle && (
          <>
            <button
              onClick={isActive ? onPause : onResume}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-4 py-2.5 text-[12.5px] transition-all duration-300 hover:border-primary/40 hover:text-primary"
            >
              {isActive ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {isActive ? "Pause" : "Resume"}
            </button>
            <button
              onClick={onStop}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-[12.5px] text-destructive transition-all duration-300 hover:border-destructive/50 hover:bg-destructive/20"
            >
              <Square className="size-3.5" />
              Stop
            </button>
          </>
        )}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-4 py-2.5 text-[12.5px] transition-all duration-300 hover:border-border-strong hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
      </div>
    </div>
  );
}

/* ── Empty Panel ─────────────────────────────────────────────────────────── */

function EmptyPanel({
  icon,
  title,
  description,
  hint,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  hint: string;
  status: "ready" | "waiting" | "live";
}) {
  return (
    <div className="surface flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className={`flex size-14 items-center justify-center rounded-2xl ${
        status === "live" ? "bg-destructive/10" : "bg-elevated"
      }`}>
        <span className={status === "live" ? "text-destructive" : "text-muted-foreground"}>{icon}</span>
      </div>
      <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
      <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      <span
        className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] ${
          status === "live"
            ? "border-destructive/30 bg-destructive/8 text-destructive"
            : status === "ready"
              ? "border-emerald/30 bg-emerald/8 text-emerald"
              : "border-border bg-elevated/50 text-muted-foreground"
        }`}
      >
        <span className="relative flex size-1.5">
          {status === "live" && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/60" />
          )}
          <span
            className={`relative size-1.5 rounded-full ${
              status === "live" ? "bg-destructive" :
              status === "ready" ? "bg-emerald" : "bg-muted-foreground/40"
            }`}
          />
        </span>
        {hint}
      </span>
    </div>
  );
}

/* ── Companion Placeholder ───────────────────────────────────────────────── */

function CompanionPlaceholder({ isLive }: { isLive: boolean }) {
  const TABS = [
    { id: "ask", label: "Ask AI", icon: MessageCircleQuestion },
    { id: "notes", label: "Notes", icon: NotebookPen },
    { id: "vocab", label: "Vocab", icon: Layers },
    { id: "memory", label: "Memory", icon: Brain },
    { id: "dict", label: "Dictionary", icon: BookMarked },
  ] as const;

  type TabId = (typeof TABS)[number]["id"];
  const [tab, setTab] = useState<TabId>("ask");

  const panelMeta: Record<TabId, { title: string; desc: string }> = {
    ask: { title: "Ask AI", desc: "Type a question about the lecture. Responses will appear once a language model is connected." },
    notes: { title: "AI Notes", desc: "Auto-generated notes, key points, formulas and summaries will populate here after processing." },
    vocab: { title: "Vocabulary", desc: "Detected terms, definitions and difficulty levels will build up as the transcript is analyzed." },
    memory: { title: "Context Memory", desc: "Cross-lecture concept tracking will appear here as more sessions are processed." },
    dict: { title: "Dictionary", desc: "Technical terms detected in the lecture will be listed with definitions, analogies and examples." },
  };

  const meta = panelMeta[tab];

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

      <div key={tab} className="animate-rise flex min-h-0 flex-1 items-center justify-center">
        <EmptyPanel
          icon={(() => {
            const TabIcon = TABS.find((t) => t.id === tab)!.icon;
            return <TabIcon className="size-5" />;
          })()}
          title={meta.title}
          description={meta.desc}
          hint={
            isLive
              ? "Recording — awaiting backend data"
              : "Awaiting input to enable this feature"
          }
          status={isLive ? "live" : "waiting"}
        />
      </div>
    </div>
  );
}

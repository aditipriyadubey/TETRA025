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
  Settings2,
  Brain,
  Layers,
  NotebookPen,
  MessageCircleQuestion,
  BookMarked,
  Server,
  Key,
  Database,
  X,
  CheckCircle2,
  AlertCircle,
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
/*  Input Mode                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

type InputMode = "idle" | "upload" | "record";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TryNow() {
  const [mode, setMode] = useState<InputMode>("idle");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [difficulty, setDifficulty] = useState<Difficulty>("Grade 10");
  const [configOpen, setConfigOpen] = useState(false);

  /* API configuration state */
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [datasetSource, setDatasetSource] = useState("");
  const [modelName, setModelName] = useState("");

  /* Upload state */
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  /* Recording state */
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const hasInput = uploadedFile !== null || isRecording || mode === "record";
  const hasConfig = apiEndpoint.trim().length > 0;

  /* ── Recording helpers ─────────────────────────────────────────────────── */

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        setUploadedFile(file);
        toast.success("Recording saved", {
          description: `${(blob.size / 1024).toFixed(0)} KB captured — ready to process.`,
        });
      };

      mediaRecorderRef.current = mr;
      mr.start(250);
      setIsRecording(true);
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

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300 ${
                configOpen
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : hasConfig
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings2 className="size-3.5" />
              {hasConfig ? "Configured" : "API Config"}
            </button>
            <span className="hidden items-center gap-2 font-mono text-[10.5px] tracking-widest text-muted-foreground uppercase sm:flex">
              <span className={`size-1.5 rounded-full ${hasInput ? "bg-emerald" : "bg-muted-foreground/40"}`} />
              {isRecording ? "Recording" : uploadedFile ? "File loaded" : "Awaiting input"}
            </span>
          </div>
        </header>

        {/* ── API Configuration Panel ────────────────────────────────── */}
        {configOpen && (
          <div className="animate-rise glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <h3 className="text-[14px] font-medium">Backend Configuration</h3>
              </div>
              <button
                onClick={() => setConfigOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Connect your own API, model and dataset to power transcription and AI explanations.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ConfigField
                icon={<Server className="size-4" />}
                label="API Endpoint"
                placeholder="https://your-api.example.com/v1"
                value={apiEndpoint}
                onChange={setApiEndpoint}
              />
              <ConfigField
                icon={<Key className="size-4" />}
                label="API Key"
                placeholder="sk-..."
                value={apiKey}
                onChange={setApiKey}
                type="password"
              />
              <ConfigField
                icon={<Brain className="size-4" />}
                label="Model Name"
                placeholder="e.g. whisper-large-v3, gpt-4o"
                value={modelName}
                onChange={setModelName}
              />
              <ConfigField
                icon={<Database className="size-4" />}
                label="Dataset Source"
                placeholder="e.g. PostgreSQL URI, S3 bucket"
                value={datasetSource}
                onChange={setDatasetSource}
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              {hasConfig ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald">
                  <CheckCircle2 className="size-3.5" />
                  Endpoint configured — ready to connect
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AlertCircle className="size-3.5" />
                  Enter an API endpoint to enable processing
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── TopBar (language / difficulty) ──────────────────────────── */}
        <TopBar
          language={language}
          setLanguage={setLanguage}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />

        {/* ── Input Mode Cards ────────────────────────────────────────── */}
        {mode === "idle" && !uploadedFile && (
          <div className="animate-rise grid gap-4 md:grid-cols-2">
            {/* Upload Card */}
            <InputCard
              active={false}
              onClick={() => setMode("upload")}
              icon={<FileVideo className="size-8 text-primary" strokeWidth={1.4} />}
              title="Upload Video / Audio"
              description="Drop a lecture recording to transcribe and analyze. Supports MP4, WebM, MP3, M4A, WAV and more."
              accent="primary"
            />

            {/* Record Card */}
            <InputCard
              active={false}
              onClick={() => setMode("record")}
              icon={<Radio className="size-8 text-emerald" strokeWidth={1.4} />}
              title="Record Live Audio"
              description="Use your microphone to capture a live lecture. Real-time transcription when backend is connected."
              accent="emerald"
            />
          </div>
        )}

        {/* ── Upload Panel ────────────────────────────────────────────── */}
        {mode === "upload" && !uploadedFile && <UploadZone onFile={(f) => setUploadedFile(f)} onCancel={() => setMode("idle")} />}

        {/* ── Record Panel ────────────────────────────────────────────── */}
        {mode === "record" && !uploadedFile && (
          <RecordPanel
            isRecording={isRecording}
            recordingTime={recordingTime}
            formatTime={formatTime}
            onStart={startRecording}
            onStop={stopRecording}
            onCancel={() => {
              if (isRecording) stopRecording();
              setMode("idle");
            }}
          />
        )}

        {/* ── Results Area (empty panels) ─────────────────────────────── */}
        {uploadedFile && (
          <>
            {/* File info bar */}
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

            {/* 3-column results grid */}
            <div className="animate-rise grid gap-4 xl:grid-cols-[0.8fr_1.1fr_0.95fr]" style={{ animationDelay: "80ms" }}>
              <div className="h-[520px]">
                <EmptyPanel
                  icon={<Mic className="size-5" />}
                  title="Transcript"
                  description="Transcribed text will appear here once connected to a speech-to-text API."
                  hint={hasConfig ? "Endpoint configured — awaiting processing" : "Configure an API endpoint to begin"}
                  status={hasConfig ? "ready" : "waiting"}
                />
              </div>
              <div className="h-[520px]">
                <EmptyPanel
                  icon={<Brain className="size-5" />}
                  title="AI Explanation"
                  description={`Adaptive explanations in ${language.toUpperCase()} at ${difficulty} level will render here.`}
                  hint={hasConfig ? "Model connected — send transcript to generate" : "Connect a language model to power explanations"}
                  status={hasConfig ? "ready" : "waiting"}
                />
              </div>
              <div className="h-[520px]">
                <CompanionPlaceholder hasConfig={hasConfig} />
              </div>
            </div>
          </>
        )}
      </div>

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
  active,
  onClick,
  icon,
  title,
  description,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "primary" | "emerald";
}) {
  return (
    <button
      onClick={onClick}
      className={`group surface relative flex flex-col items-center gap-4 overflow-hidden p-10 text-center transition-all duration-500 card-hover ${
        active ? `border-${accent}/40 shadow-[var(--shadow-glow)]` : ""
      }`}
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

function RecordPanel({
  isRecording,
  recordingTime,
  formatTime,
  onStart,
  onStop,
  onCancel,
}: {
  isRecording: boolean;
  recordingTime: number;
  formatTime: (s: number) => string;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-rise space-y-3">
      <div className="surface flex flex-col items-center gap-6 py-16">
        {/* Mic button */}
        <button
          onClick={isRecording ? onStop : onStart}
          className={`relative flex size-24 items-center justify-center rounded-full transition-all duration-500 ${
            isRecording
              ? "bg-destructive/15 text-destructive"
              : "bg-foreground text-background hover:-translate-y-1 hover:shadow-[0_20px_44px_-18px_oklch(1_0_0/0.55)]"
          }`}
        >
          {isRecording && (
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/25" />
          )}
          {isRecording ? (
            <MicOff className="relative size-8" />
          ) : (
            <Mic className="size-8" />
          )}
        </button>

        {/* Status */}
        <div className="text-center">
          <p className="text-[15px] font-medium">
            {isRecording ? "Recording in progress…" : "Ready to record"}
          </p>
          {isRecording ? (
            <p className="mt-1 font-mono text-[13px] text-destructive">
              {formatTime(recordingTime)}
            </p>
          ) : (
            <p className="mt-1 text-[12px] text-muted-foreground">
              Tap the microphone to start capturing audio
            </p>
          )}
        </div>

        {/* Waveform */}
        <Waveform active={isRecording} bars={60} height={44} />

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <button
              onClick={onStop}
              className="inline-flex items-center gap-2 rounded-full bg-destructive/15 px-5 py-2.5 text-[13px] font-medium text-destructive transition-all duration-300 hover:bg-destructive/25"
            >
              <MicOff className="size-3.5" />
              Stop Recording
            </button>
          )}
        </div>
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
  status: "ready" | "waiting";
}) {
  return (
    <div className="surface flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-elevated">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
      <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      <span
        className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] ${
          status === "ready"
            ? "border-emerald/30 bg-emerald/8 text-emerald"
            : "border-border bg-elevated/50 text-muted-foreground"
        }`}
      >
        <span
          className={`size-1.5 rounded-full ${status === "ready" ? "bg-emerald" : "bg-muted-foreground/40"}`}
        />
        {hint}
      </span>
    </div>
  );
}

function CompanionPlaceholder({ hasConfig }: { hasConfig: boolean }) {
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
      {/* Tab bar */}
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

      {/* Empty state */}
      <div key={tab} className="animate-rise flex min-h-0 flex-1 items-center justify-center">
        <EmptyPanel
          icon={(() => {
            const TabIcon = TABS.find((t) => t.id === tab)!.icon;
            return <TabIcon className="size-5" />;
          })()}
          title={meta.title}
          description={meta.desc}
          hint={hasConfig ? "Backend connected — awaiting data" : "Connect a backend to enable this feature"}
          status={hasConfig ? "ready" : "waiting"}
        />
      </div>
    </div>
  );
}

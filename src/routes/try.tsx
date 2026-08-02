import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Upload,
  Mic,
  FileVideo,
  Radio,
  NotebookPen,
  MessageCircleQuestion,
  BookMarked,
  X,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { TopBar, type Difficulty } from "@/components/demo/TopBar";
import { Waveform } from "@/components/kit";
import { useSessionBackend } from "@/lib/useSessionBackend";
import { ConsentDialog } from "@/components/session/ConsentDialog";
import { TranscriptDual } from "@/components/session/TranscriptDual";
import { NotesPanel } from "@/components/session/NotesPanel";
import { GlossaryPanel } from "@/components/session/GlossaryPanel";
import { ChatPanel } from "@/components/session/ChatPanel";
import { ImLostButton } from "@/components/session/ImLostButton";
import type { SupportedLanguage } from "@/ai/constants";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Classroom Companion — EduBridge AI" },
      {
        name: "description",
        content:
          "Real-time AI learning companion for live lectures: multilingual transcription, adaptive study notes, technical glossary, and lecture-grounded assistance.",
      },
      { property: "og:title", content: "Classroom Companion — EduBridge AI" },
    ],
  }),
  component: TryNow,
});

type InputMode = "idle" | "upload" | "record";
type RecordingState = "idle" | "recording" | "paused";

function TryNow() {
  const [mode, setMode] = useState<InputMode>("idle");
  const [language, setLanguage] = useState<SupportedLanguage>("English");
  const [difficulty, setDifficulty] = useState<Difficulty>("Grade 10");
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunkIntervalRef = useRef<number | null>(null);
  const recordingStateRef = useRef<RecordingState>("idle");

  const [activeTab, setActiveTab] = useState<"notes" | "glossary" | "ask">("notes");

  const session = useSessionBackend();

  const languageRef = useRef(language);
  const difficultyRef = useRef(difficulty);
  const processChunkRef = useRef(session.processAudioChunk);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    processChunkRef.current = session.processAudioChunk;
  }, [session.processAudioChunk]);

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const startSegmentRecorder = useCallback(() => {
    if (!streamRef.current?.active) return;
    if (recordingStateRef.current !== "recording") return;

    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    let selectedMime = "";
    for (const t of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
        selectedMime = t;
        break;
      }
    }

    try {
      const mr = new MediaRecorder(
        streamRef.current,
        selectedMime ? { mimeType: selectedMime } : undefined,
      );
      mediaRecorderRef.current = mr;

      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mr.onstop = () => {
        if (chunks.length === 0) return;

        const mime = mr.mimeType || selectedMime || "audio/webm";
        const validChunkBlob = new Blob(chunks, { type: mime });
        if (validChunkBlob.size <= 500) return;

        void processChunkRef.current(
          validChunkBlob,
          languageRef.current,
          difficultyRef.current,
        );
      };

      mr.start();
    } catch (err) {
      console.error("Error starting segment recorder:", err);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current?.active) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      setRecordingState("recording");
      recordingStateRef.current = "recording";
      setRecordingTime(0);

      void session.startSession("transcript", languageRef.current);

      startSegmentRecorder();

      if (chunkIntervalRef.current) window.clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = window.setInterval(() => {
        if (
          recordingStateRef.current === "recording" &&
          mediaRecorderRef.current?.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
          startSegmentRecorder();
        }
      }, 5000);

      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied", {
        description: "Please allow microphone access in your browser settings.",
      });
    }
  }, [session, startSegmentRecorder]);

  const pauseRecording = useCallback(() => {
    recordingStateRef.current = "paused";

    if (chunkIntervalRef.current) {
      window.clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    setRecordingState("paused");
    toast.info("Recording paused");
  }, []);

  const resumeRecording = useCallback(() => {
    if (!streamRef.current?.active) return;

    setRecordingState("recording");
    recordingStateRef.current = "recording";

    startSegmentRecorder();

    if (chunkIntervalRef.current) window.clearInterval(chunkIntervalRef.current);
    chunkIntervalRef.current = window.setInterval(() => {
      if (
        recordingStateRef.current === "recording" &&
        mediaRecorderRef.current?.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        startSegmentRecorder();
      }
    }, 5000);

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);

    toast.info("Recording resumed");
  }, [startSegmentRecorder]);

  const stopRecording = useCallback(() => {
    recordingStateRef.current = "idle";

    if (chunkIntervalRef.current) {
      window.clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setRecordingState("idle");
    toast.success("Recording stopped. Transcript preserved.");
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      toast.info("Processing uploaded lecture file...");

      if (file.type.startsWith("text/")) {
        const text = await file.text();
        await session.processTextSegment(text, language, difficulty);
        toast.success("File processed successfully!");
      } else {
        await session.processAudioChunk(file, language, difficulty);
        toast.success("Lecture file transcribed!");
      }
    },
    [session, language, difficulty],
  );

  useEffect(() => {
    return () => {
      if (chunkIntervalRef.current) window.clearInterval(chunkIntervalRef.current);
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isLiveSession =
    mode === "record" &&
    (recordingState === "recording" || recordingState === "paused");

  const showClassroomGrid =
    mode === "record" || isLiveSession || uploadedFile !== null || session.transcript.length > 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 pt-4 pb-28">
      <ConsentDialog onConsent={() => setConsentConfirmed(true)} />

      <div className="pointer-events-none fixed inset-0 grid-bg opacity-30 [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-[160px]" />

      <div className="relative mx-auto max-w-[1400px] space-y-4">
        <header className="glass flex items-center justify-between rounded-3xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Home
            </Link>
            <span className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-background">
                <GraduationCap className="size-4" strokeWidth={2.2} />
              </span>
              <span className="text-[14px] font-medium tracking-tight">
                EduBridge AI · Classroom Companion
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ImLostButton
              onImLost={() => session.handleImLost(difficulty)}
              currentDifficulty={difficulty}
            />

            <span className="hidden items-center gap-2 font-mono text-[10.5px] tracking-widest text-muted-foreground uppercase sm:flex">
              <span
                className={`size-1.5 rounded-full ${
                  recordingState === "recording"
                    ? "bg-destructive animate-pulse"
                    : recordingState === "paused"
                      ? "bg-yellow-500"
                      : uploadedFile
                        ? "bg-emerald"
                        : "bg-muted-foreground/40"
                }`}
              />
              {recordingState === "recording"
                ? "Live Recording"
                : recordingState === "paused"
                  ? "Paused"
                  : uploadedFile
                    ? "File Loaded"
                    : "Ready"}
            </span>
          </div>
        </header>

        <TopBar
          language={language}
          setLanguage={setLanguage}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />

        {mode === "idle" && !uploadedFile && (
          <div className="animate-rise grid gap-4 md:grid-cols-2">
            <InputCard
              onClick={() => setMode("upload")}
              icon={<FileVideo className="size-8 text-primary" strokeWidth={1.4} />}
              title="Upload Lecture Audio / Video"
              description="Drop or select a recorded lecture file. Transcribes with Groq Whisper STT."
              accent="primary"
            />
            <InputCard
              onClick={() => setMode("record")}
              icon={<Radio className="size-8 text-emerald" strokeWidth={1.4} />}
              title="Record Live Classroom Audio"
              description="Use your microphone during class. Continuous Groq Whisper STT live transcription."
              accent="emerald"
            />
          </div>
        )}

        {mode === "upload" && !uploadedFile && (
          <UploadZone onFile={handleFileUpload} onCancel={() => setMode("idle")} />
        )}

        {uploadedFile && (
          <div className="animate-rise glass flex items-center justify-between rounded-2xl px-5 py-3">
            <div className="flex items-center gap-3">
              <FileVideo className="size-4 text-primary" />
              <div>
                <p className="text-[13px] font-medium">{uploadedFile.name}</p>
                <p className="font-mono text-[10.5px] text-muted-foreground">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                  {uploadedFile.type || "Audio File"}
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
              Clear
            </button>
          </div>
        )}

        {showClassroomGrid && (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] min-h-[580px]">
            <div className="h-[580px]">
              <TranscriptDual
                originalTranscript={session.transcript}
                translatedTranscript={session.translatedTranscript}
                targetLanguage={language}
                isRecording={recordingState === "recording"}
                isProcessing={session.isTranscribing}
              />
            </div>

            <div className="flex h-[580px] flex-col gap-3">
              <div className="glass flex gap-1 rounded-2xl p-1.5">
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${
                    activeTab === "notes"
                      ? "bg-elevated text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <NotebookPen className="size-3.5 text-emerald" />
                  Notes & Summary
                </button>

                <button
                  onClick={() => setActiveTab("glossary")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${
                    activeTab === "glossary"
                      ? "bg-elevated text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookMarked className="size-3.5 text-primary" />
                  Glossary ({session.glossary.length})
                </button>

                <button
                  onClick={() => setActiveTab("ask")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${
                    activeTab === "ask"
                      ? "bg-elevated text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageCircleQuestion className="size-3.5 text-indigo-400" />
                  Ask AI
                </button>
              </div>

              <div className="flex-1 min-h-0">
                {activeTab === "notes" && (
                  <NotesPanel
                    notes={session.notes}
                    summary={session.runningSummary}
                    isProcessing={session.isProcessing}
                  />
                )}
                {activeTab === "glossary" && (
                  <GlossaryPanel glossary={session.glossary} keywords={session.keywords} />
                )}
                {activeTab === "ask" && (
                  <ChatPanel
                    chatHistory={session.chatHistory}
                    onSendMessage={session.sendAskQuestion}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {mode === "record" && (
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
        )}
      </div>

      <Toaster />
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
      <p className="relative max-w-xs text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>
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
            or click to browse · Audio, Video, or Text file
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,video/*,text/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onFile(file);
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
              ? `${formatTime(recordingTime)} · streaming live transcript with Groq Whisper STT`
              : isPaused
                ? `${formatTime(recordingTime)} · paused — transcript preserved`
                : "Tap Start Recording to begin live classroom transcription"}
          </p>
        </div>
      </div>

      <Waveform active={isActive} bars={40} height={34} className="hidden md:flex" />

      <div className="flex items-center gap-2">
        {isIdle ? (
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[12.5px] font-medium text-background transition-all duration-300 hover:opacity-90"
          >
            <Mic className="size-3.5" />
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={isActive ? onPause : onResume}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-4 py-2.5 text-[12.5px] font-medium transition-all duration-300 hover:border-primary/40 hover:text-primary"
            >
              {isActive ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {isActive ? "Pause Recording" : "Resume Recording"}
            </button>
            <button
              onClick={onStop}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-[12.5px] font-medium text-destructive transition-all duration-300 hover:border-destructive/50 hover:bg-destructive/20"
            >
              <Square className="size-3.5" />
              Stop Recording
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

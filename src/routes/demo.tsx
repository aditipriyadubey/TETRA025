import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { DictionaryProvider } from "@/components/demo/dictionary";
import { TopBar } from "@/components/demo/TopBar";
import { TranscriptPanel } from "@/components/demo/TranscriptPanel";
import { ExplanationPanel } from "@/components/demo/ExplanationPanel";
import { CompanionPanel } from "@/components/demo/CompanionPanel";
import { ControlBar } from "@/components/demo/ControlBar";
import { ImLost } from "@/components/demo/ImLost";
import type { Difficulty, LanguageCode } from "@/lib/mock-data";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live Classroom Demo — EduBridge AI" },
      {
        name: "description",
        content:
          "Experience a live lecture with real-time transcript, translated AI explanations, notes, vocabulary and an I'm Lost rescue button.",
      },
      { property: "og:title", content: "Live Classroom Demo — EduBridge AI" },
      {
        property: "og:description",
        content: "Transcript, translation, difficulty slider and AI companion in one classroom UI.",
      },
    ],
  }),
  component: Demo,
});

function Demo() {
  const [language, setLanguage] = useState<LanguageCode>("hi");
  const [difficulty, setDifficulty] = useState<Difficulty>("Grade 10");
  const [listening, setListening] = useState(true);

  return (
    <DictionaryProvider>
      <div className="relative min-h-screen overflow-x-hidden px-4 pt-4 pb-28">
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
                Back
              </Link>
              <span className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-background">
                  <GraduationCap className="size-4" strokeWidth={2.2} />
                </span>
                <span className="text-[14px] font-medium tracking-tight">
                  PHY-341 · Quantum Mechanics
                </span>
              </span>
            </div>
            <span className="hidden items-center gap-2 font-mono text-[10.5px] tracking-widest text-muted-foreground uppercase sm:flex">
              <span className="size-1.5 rounded-full bg-emerald" />
              Session live · Lecture 4
            </span>
          </header>

          <TopBar
            language={language}
            setLanguage={setLanguage}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
          />

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.1fr_0.95fr]">
            <div className="h-[620px]">
              <TranscriptPanel listening={listening} />
            </div>
            <div className="h-[620px]">
              <ExplanationPanel language={language} difficulty={difficulty} live={listening} />
            </div>
            <div className="h-[620px]">
              <CompanionPanel />
            </div>
          </div>

          <ControlBar listening={listening} setListening={setListening} />
        </div>

        <ImLost />
        <Toaster />
      </div>
    </DictionaryProvider>
  );
}

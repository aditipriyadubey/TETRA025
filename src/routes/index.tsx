import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BookMarked } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Reveal, SectionHeading } from "@/components/kit";
import { DictionaryProvider, useDictionary } from "@/components/demo/dictionary";
import { NotesPanel } from "@/components/demo/NotesPanel";
import { VocabPanel } from "@/components/demo/VocabPanel";
import { MemoryPanel } from "@/components/demo/MemoryPanel";
import { AskAI } from "@/components/demo/AskAI";
import { ImLost } from "@/components/demo/ImLost";
import { TopBar } from "@/components/demo/TopBar";
import { ExplanationPanel } from "@/components/demo/ExplanationPanel";
import { TranscriptPanel } from "@/components/demo/TranscriptPanel";
import type { Difficulty, LanguageCode } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduBridge AI — Understand Every Lecture, In Your Language" },
      {
        name: "description",
        content:
          "EduBridge AI is a live classroom companion: real-time transcript, translation, difficulty-adaptive explanations, AI notes, vocabulary and context memory.",
      },
      { property: "og:title", content: "EduBridge AI — Understand Every Lecture" },
      {
        property: "og:description",
        content:
          "Real-time transcripts, translation and AI explanations tuned to your level — for live lectures.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <DictionaryProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <Nav />
        <main>
          <Hero />
          <HowItWorks />
          <Features />
          <DemoPreview />
          <DictionarySection />
          <NotesSection />
          <VocabSection />
          <MemorySection />
          <AskAndLostSection />
          <CTA />
        </main>
        <Footer />
        <Toaster />
      </div>
    </DictionaryProvider>
  );
}

function Shell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-16">{children}</div>
        </Reveal>
      </div>
    </section>
  );
}

function DemoPreview() {
  const [language, setLanguage] = useState<LanguageCode>("hi");
  const [difficulty, setDifficulty] = useState<Difficulty>("Grade 8");

  return (
    <Shell
      id="demo"
      eyebrow="Student demo"
      title="The classroom, rebuilt around understanding"
      subtitle="Move the difficulty slider or switch language — the explanation rewrites itself instantly."
    >
      <div className="space-y-4">
        <TopBar
          language={language}
          setLanguage={setLanguage}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1fr]">
          <div className="h-[440px]">
            <TranscriptPanel listening />
          </div>
          <div className="h-[440px]">
            <ExplanationPanel language={language} difficulty={difficulty} live />
          </div>
        </div>
        <div className="flex justify-center pt-4">
          <Link
            to="/demo"
            className="group inline-flex items-center gap-2 rounded-full border border-border-strong bg-card/60 px-6 py-3 text-sm font-medium backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
          >
            Open the full classroom
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function DictionarySection() {
  const { open } = useDictionary();
  return (
    <Shell
      eyebrow="Technical dictionary"
      title="One tap turns jargon into intuition"
      subtitle="Definition, plain-language explanation, real-life analogy, pronunciation, examples and related terms."
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        {["Photosynthesis", "Quantum Superposition", "Entropy", "Decoherence", "Qubit"].map(
          (term) => (
            <button
              key={term}
              onClick={() => open(term)}
              className="surface card-hover inline-flex items-center gap-2.5 px-5 py-4 text-[14px]"
            >
              <BookMarked className="size-4 text-emerald" strokeWidth={1.7} />
              {term}
            </button>
          ),
        )}
      </div>
      <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
        Try clicking “Photosynthesis”.
      </p>
    </Shell>
  );
}

function NotesSection() {
  return (
    <Shell
      id="notes"
      eyebrow="AI Notes"
      title="Notes you'd never have time to write"
      subtitle="Key points, formula blocks, definitions, worked examples and a summary — formatted, exportable."
    >
      <NotesPanel compact />
    </Shell>
  );
}

function VocabSection() {
  return (
    <Shell
      eyebrow="Vocabulary builder"
      title="Every unfamiliar word becomes a card"
      subtitle="Meaning, example, pronunciation and difficulty. Bookmark the ones worth revisiting."
    >
      <VocabPanel />
    </Shell>
  );
}

function MemorySection() {
  return (
    <Shell
      id="memory"
      eyebrow="Context memory"
      title="It remembers Lecture 1 while explaining Lecture 12"
      subtitle="Concepts carry forward, so today's explanation is built on what you already understood."
    >
      <MemoryPanel />
    </Shell>
  );
}

function AskAndLostSection() {
  return (
    <Shell
      eyebrow="Ask AI · I'm Lost"
      title="Two ways to never fall behind again"
      subtitle="Ask a question without interrupting the class — or admit you're lost and get caught up in seconds."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <AskAI variant="inline" />
        <div className="surface relative flex flex-col items-start justify-center overflow-hidden p-8">
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-destructive/10 blur-3xl" />
          <h3 className="display relative text-3xl">The most important button.</h3>
          <p className="relative mt-4 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
            When a lecture runs away from you, there's no polite way to stop it. One tap rewinds the
            last five minutes, summarises what you missed and drops you back exactly where the class
            is now.
          </p>
          <div className="relative mt-8">
            <ImLost variant="inline" />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function CTA() {
  return (
    <section className="relative px-6 py-32">
      <div className="pointer-events-none absolute inset-0 grid-bg [mask-image:radial-gradient(50%_60%_at_50%_50%,black,transparent)] opacity-40" />
      <Reveal>
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="display text-[clamp(2.2rem,5vw,3.6rem)] text-balance text-gradient">
            Sit in the next lecture without fear.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            EduBridge AI runs quietly beside you — listening, translating, simplifying and
            remembering.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              to="/demo"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-18px_oklch(1_0_0/0.55)]"
            >
              Start Demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mic, Sparkles, Languages, BookMarked, HelpCircle, Bot } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Reveal, SectionHeading } from "@/components/kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduBridge AI — Understand Every Lecture, In Your Language" },
      {
        name: "description",
        content:
          "EduBridge AI is a live classroom companion: Groq Whisper speech-to-text, unified AI translation, adaptive notes, technical glossary, and lecture-grounded assistance.",
      },
      { property: "og:title", content: "EduBridge AI — Understand Every Lecture" },
      {
        property: "og:description",
        content:
          "Real-time transcripts, translation and AI study notes tuned to your level — for live lectures.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <ArchitectureSection />
        <CTA />
      </main>
      <Footer />
      <Toaster />
    </div>
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

function ArchitectureSection() {
  return (
    <Shell
      id="architecture"
      eyebrow="Production AI Pipeline"
      title="Built for speed, accuracy & privacy"
      subtitle="One unified inference step after speech recognition replaces multi-API complexity."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="surface p-6 space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mic className="size-5" />
          </div>
          <h3 className="text-base font-semibold">1. Groq Whisper STT</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ultra-fast speech-to-text transcription powered by Whisper-large-v3-turbo. Audio processed in-memory only.
          </p>
        </div>

        <div className="surface p-6 space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
            <Sparkles className="size-5" />
          </div>
          <h3 className="text-base font-semibold">2. Single-Step Gemini AI</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ONE structured JSON inference step returns translation, auto-notes, glossary definitions, keywords & summary.
          </p>
        </div>

        <div className="surface p-6 space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Bot className="size-5" />
          </div>
          <h3 className="text-base font-semibold">3. Lecture-Grounded Chat</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ask AI questions answered strictly from transcript and notes context — preventing hallucinations.
          </p>
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          to="/try"
          className="group inline-flex items-center gap-2 rounded-full border border-border-strong bg-card/60 px-6 py-3 text-sm font-medium backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
        >
          Open Classroom Companion
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
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
            EduBridge AI runs quietly beside you — listening, translating, simplifying and summarizing.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/try"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-18px_oklch(1_0_0/0.55)]"
            >
              Try Now
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card/60 px-7 py-3.5 text-sm font-medium backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

import {
  AudioLines,
  SlidersHorizontal,
  Languages,
  NotebookPen,
  BookMarked,
  Layers,
  MessageCircleQuestion,
  Brain,
  LifeBuoy,
  Lightbulb,
  WifiOff,
  Upload,
} from "lucide-react";
import { Reveal, SectionHeading } from "@/components/kit";

const FEATURES = [
  {
    icon: AudioLines,
    title: "Live Transcript",
    body: "Word-by-word capture with speaker labels and timestamps.",
  },
  {
    icon: SlidersHorizontal,
    title: "Difficulty Slider",
    body: "Rewrite any explanation from Grade 5 to Expert in one drag.",
  },
  {
    icon: Languages,
    title: "Smart Translation",
    body: "Concept-aware translation that keeps technical terms intact.",
  },
  {
    icon: NotebookPen,
    title: "AI Notes",
    body: "Structured notes with formulas, definitions and a summary.",
  },
  {
    icon: BookMarked,
    title: "Technical Dictionary",
    body: "Tap any term for a definition, analogy and pronunciation.",
  },
  {
    icon: Layers,
    title: "Vocabulary Builder",
    body: "Every new word becomes a reviewable, bookmarkable card.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Ask AI",
    body: "Ask anything mid-lecture without interrupting the class.",
  },
  {
    icon: Brain,
    title: "Context Memory",
    body: "It remembers Lecture 1 when explaining Lecture 12.",
  },
  {
    icon: LifeBuoy,
    title: "I'm Lost Button",
    body: "One tap recaps the last five minutes and reconnects you.",
  },
  {
    icon: Lightbulb,
    title: "Smart Analogies",
    body: "Abstract ideas grounded in things you already understand.",
  },
  {
    icon: WifiOff,
    title: "Offline Recording",
    body: "Capture now, process later — no signal required.",
  },
  {
    icon: Upload,
    title: "Lecture Upload",
    body: "Drop yesterday's recording and get the full companion.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-6 py-32">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[420px] max-w-4xl rounded-full bg-primary/5 blur-[160px]" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="Core features"
            title="Everything a struggling student wishes existed"
            subtitle="Twelve capabilities, one quiet interface that never gets in the way of the lecture."
          />
        </Reveal>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 80 + Math.floor(i / 3) * 40}>
                <article className="surface card-hover group relative h-full overflow-hidden p-6">
                  <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative flex size-11 items-center justify-center rounded-xl border border-border bg-elevated transition-colors duration-500 group-hover:border-primary/30">
                    <Icon
                      className="size-[18px] text-muted-foreground transition-colors duration-500 group-hover:text-primary"
                      strokeWidth={1.7}
                    />
                  </span>
                  <h3 className="relative mt-5 text-[15px] font-medium tracking-tight">
                    {f.title}
                  </h3>
                  <p className="relative mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

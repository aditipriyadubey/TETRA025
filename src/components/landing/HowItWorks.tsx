import { Mic, FileText, Languages, SlidersHorizontal, Sparkles, GraduationCap } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/kit";

const STEPS = [
  {
    icon: Mic,
    title: "Lecture",
    body: "Live microphone or an uploaded recording. Nothing to configure.",
    tone: "primary",
  },
  {
    icon: FileText,
    title: "Transcript",
    body: "Speech becomes clean, punctuated text with technical terms detected.",
    tone: "primary",
  },
  {
    icon: Languages,
    title: "Translation",
    body: "Meaning-preserving translation into Hindi, Gujarati, Japanese, Korean or English.",
    tone: "emerald",
  },
  {
    icon: SlidersHorizontal,
    title: "Difficulty Engine",
    body: "The same idea, rewritten from Grade 5 to Expert — instantly.",
    tone: "emerald",
  },
  {
    icon: Sparkles,
    title: "AI Companion",
    body: "Notes, analogies, dictionary and answers grounded in your past lectures.",
    tone: "primary",
  },
  {
    icon: GraduationCap,
    title: "Learning",
    body: "You leave the room understanding, not transcribing.",
    tone: "emerald",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Six steps between confusion and clarity"
            subtitle="Every stage runs while the professor is still speaking."
          />
        </Reveal>

        <div className="relative mt-20">
          <div className="absolute top-0 bottom-0 left-[27px] w-px bg-gradient-to-b from-transparent via-border-strong to-transparent md:left-1/2" />

          <ol className="space-y-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const right = i % 2 === 1;
              return (
                <li key={s.title}>
                  <Reveal delay={i * 90}>
                    <div
                      className={`group relative flex items-start gap-6 md:w-1/2 ${
                        right ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right"
                      }`}
                    >
                      <span
                        className={`relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-[var(--shadow-glow)] ${
                          right ? "" : "md:order-2"
                        }`}
                      >
                        <Icon
                          className={`size-5 ${s.tone === "emerald" ? "text-emerald" : "text-primary"}`}
                          strokeWidth={1.7}
                        />
                        <span className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                      </span>

                      <div className={right ? "" : "md:order-1 md:flex-1"}>
                        <div
                          className={`flex items-center gap-3 ${right ? "" : "md:justify-end"}`}
                        >
                          <span className="font-mono text-[11px] text-muted-foreground">
                            0{i + 1}
                          </span>
                          <h3 className="text-lg font-medium tracking-tight">{s.title}</h3>
                        </div>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                          {s.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

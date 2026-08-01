import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Radio } from "lucide-react";
import { Pill, Waveform } from "@/components/kit";

function Particles() {
  const [seeds] = useState(() =>
    Array.from({ length: 26 }, (_, i) => ({
      left: (i * 37.5) % 100,
      top: (i * 53.7) % 100,
      size: 1 + ((i * 7) % 3) * 0.6,
      dur: 9 + ((i * 13) % 11),
      delay: (i * 0.7) % 9,
      emerald: i % 4 === 0,
    })),
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {seeds.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full opacity-0"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: s.emerald ? "var(--emerald)" : "var(--primary)",
            boxShadow: `0 0 8px ${s.emerald ? "var(--emerald)" : "var(--primary)"}`,
            animation: `drift ${s.dur}s linear ${s.delay}s infinite, float-y ${s.dur / 2}s ease-in-out infinite`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

const LIVE_LINES = [
  "Professor: Today we'll discuss Quantum Superposition…",
  "AI: A particle can hold several possibilities at once.",
  "Professor: Recall that a classical bit is strictly 0 or 1.",
  "AI: A qubit refuses that constraint — it blends both.",
];

function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const full = LIVE_LINES[index] ?? "";
    setTyped("");
    let i = 0;
    const typer = window.setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(typer);
        window.setTimeout(() => setIndex((n) => (n + 1) % LIVE_LINES.length), 2200);
      }
    }, 26);
    return () => window.clearInterval(typer);
  }, [index]);

  const isAi = (LIVE_LINES[index] ?? "").startsWith("AI");

  return (
    <div className="glass mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl px-4 py-3">
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald/60" />
        <span className="relative size-2.5 rounded-full bg-emerald" />
      </span>
      <p
        className={`truncate font-mono text-[12.5px] ${isAi ? "text-primary" : "text-muted-foreground"}`}
      >
        {typed}
        <span className="animate-caret">▍</span>
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 pt-32 pb-24">
      {/* animated glowing grid */}
      <div className="pointer-events-none absolute inset-0 grid-bg [mask-image:radial-gradient(70%_60%_at_50%_35%,black,transparent)] opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-[12%] bottom-[12%] size-[320px] rounded-full bg-emerald/8 blur-[130px]" />
      <Particles />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="animate-rise">
          <Pill>
            <Radio className="size-3 text-emerald" />
            Live classroom companion
          </Pill>
        </div>

        <h1
          className="display animate-rise mt-8 text-[clamp(2.6rem,7vw,5.2rem)] text-balance text-gradient"
          style={{ animationDelay: "80ms" }}
        >
          Understand every lecture.
          <br />
          <span className="italic">In your own language.</span>
          <br />
          At your own level.
        </h1>

        <p
          className="animate-rise mt-8 max-w-xl text-[15.5px] leading-relaxed text-pretty text-muted-foreground"
          style={{ animationDelay: "160ms" }}
        >
          EduBridge AI listens to your class in real time, transcribes it, translates it, and
          re-explains it at the exact difficulty you need — with notes, vocabulary and memory of
          everything you've learned so far.
        </p>

        <div
          className="animate-rise mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            to="/demo"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-18px_oklch(1_0_0/0.55)]"
          >
            Start Demo
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card/50 px-6 py-3.5 text-sm font-medium backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
          >
            <Play className="size-3.5 text-primary" />
            Watch Flow
          </a>
        </div>

        <div className="animate-rise mt-16 w-full" style={{ animationDelay: "320ms" }}>
          <LiveTicker />
          <div className="mt-8 flex justify-center">
            <Waveform className="opacity-80" bars={64} height={40} />
          </div>
        </div>
      </div>
    </section>
  );
}

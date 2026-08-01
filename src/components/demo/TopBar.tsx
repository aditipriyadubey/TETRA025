import { DIFFICULTIES, LANGUAGES, type Difficulty, type LanguageCode } from "@/lib/mock-data";

export function TopBar({
  language,
  setLanguage,
  difficulty,
  setDifficulty,
}: {
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
}) {
  const index = DIFFICULTIES.indexOf(difficulty);

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-6 rounded-3xl px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          Language
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300 ${
                language === l.code
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-[280px] flex-1 items-center gap-4">
        <span className="text-[10px] tracking-[0.16em] whitespace-nowrap text-muted-foreground uppercase">
          Difficulty
        </span>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={DIFFICULTIES.length - 1}
            step={1}
            value={index}
            onChange={(e) => setDifficulty(DIFFICULTIES[Number(e.target.value)] ?? DIFFICULTIES[0])}
            aria-label="Explanation difficulty"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_35%,transparent)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110"
            style={{
              background: `linear-gradient(90deg, var(--primary) 0%, var(--emerald) ${
                (index / (DIFFICULTIES.length - 1)) * 100
              }%, oklch(1 0 0 / 10%) ${(index / (DIFFICULTIES.length - 1)) * 100}%)`,
            }}
          />
          <div className="mt-2 flex justify-between">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`text-[10.5px] transition-colors duration-300 ${
                  d === difficulty ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

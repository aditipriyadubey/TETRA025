import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

const LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Notes", href: "/#notes" },
  { label: "Memory", href: "/#memory" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav className="glass flex w-full max-w-5xl items-center justify-between rounded-full py-2.5 pr-2.5 pl-5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-background">
            <GraduationCap className="size-4" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-medium tracking-tight">EduBridge AI</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          to="/demo"
          className="rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-all duration-300 hover:opacity-90 hover:shadow-[0_14px_34px_-16px_oklch(1_0_0/0.6)]"
        >
          Start Demo
        </Link>
      </nav>
    </header>
  );
}

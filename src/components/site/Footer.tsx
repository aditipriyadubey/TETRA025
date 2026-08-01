import { Link } from "@tanstack/react-router";
import { Github, GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-background">
            <GraduationCap className="size-4" strokeWidth={2.2} />
          </span>
          <span className="text-sm font-medium tracking-tight">EduBridge AI</span>
          <span className="ml-2 text-xs text-muted-foreground">
            An AI learning companion for live classrooms
          </span>
        </div>

        <nav className="flex items-center gap-6 text-[13px] text-muted-foreground">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Github className="size-3.5" /> GitHub
          </a>
          <Link to="/demo" className="transition-colors hover:text-foreground">
            Demo
          </Link>
          <a href="/#features" className="transition-colors hover:text-foreground">
            Team
          </a>
          <a href="/#features" className="transition-colors hover:text-foreground">
            License
          </a>
        </nav>
      </div>
    </footer>
  );
}

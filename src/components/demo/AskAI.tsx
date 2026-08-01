import { useEffect, useRef, useState } from "react";
import { ArrowUp, MessageCircleQuestion, Sparkles, X } from "lucide-react";
import { AI_REPLIES, CHAT_SEED, type ChatMessage } from "@/lib/mock-data";

const SUGGESTIONS = [
  "Why is entropy increasing?",
  "Explain this like I'm 10",
  "How does this link to Lecture 2?",
];

export function AskAI({
  variant = "floating",
  open: controlledOpen,
  onOpenChange,
}: {
  variant?: "floating" | "inline";
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(variant === "inline");
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };

  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_SEED);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    const id = Date.now();
    setMessages((m) => [...m, { id, role: "user", text: value }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)] ?? AI_REPLIES[0]!;
      setMessages((m) => [
        ...m,
        { id: id + 1, role: "ai", text: reply, context: "Grounded in your lecture history" },
      ]);
      setThinking(false);
    }, 1100);
  };

  const panel = (
    <div
      className={`flex flex-col overflow-hidden ${
        variant === "floating"
          ? "glass animate-rise h-[540px] w-[min(92vw,400px)] rounded-3xl shadow-[var(--shadow-glow)]"
          : "surface h-[560px]"
      }`}
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[image:var(--gradient-accent)] text-background">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <p className="text-[13px] font-medium tracking-tight">Ask AI</p>
            <p className="font-mono text-[10px] text-muted-foreground">context: 4 lectures</p>
          </div>
        </div>
        {variant === "floating" ? (
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="rounded-full border border-border p-1.5 text-muted-foreground transition-all hover:rotate-90 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </header>

      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`animate-rise flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={m.role === "user" ? "max-w-[80%]" : "max-w-[92%]"}>
              {m.role === "user" ? (
                <p className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[13px] leading-relaxed text-primary-foreground">
                  {m.text}
                </p>
              ) : (
                <>
                  <p className="text-[13.5px] leading-relaxed text-foreground/90">{m.text}</p>
                  {m.context ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 py-1 text-[10px] text-muted-foreground">
                      <span className="size-1 rounded-full bg-emerald" />
                      {m.context}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ))}

        {thinking ? (
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </span>
            Thinking with your lecture context…
          </div>
        ) : null}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-elevated/60 px-2.5 py-1 text-[10.5px] text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 rounded-2xl border border-border bg-elevated px-3 py-2 transition-colors focus-within:border-primary/40"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this lecture…"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Send"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-30"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );

  if (variant === "inline") return panel;

  return (
    <div className="fixed right-5 bottom-24 z-40 flex flex-col items-end gap-3 sm:bottom-28">
      {open ? panel : null}
      <button
        onClick={() => setOpen(!open)}
        className="glass group flex items-center gap-2 rounded-full px-4 py-3 text-[13px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
      >
        <MessageCircleQuestion className="size-4 text-primary" />
        {open ? "Hide AI" : "Ask AI"}
      </button>
    </div>
  );
}

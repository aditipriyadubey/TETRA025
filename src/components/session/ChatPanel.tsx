import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import type { ChatTurn } from "@/lib/api";

interface ChatPanelProps {
  chatHistory: ChatTurn[];
  onSendMessage: (question: string, onChunk: (chunk: string) => void) => Promise<string | null>;
}

export function ChatPanel({ chatHistory, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isStreaming) return;

    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    await onSendMessage(q, (chunk) => {
      setStreamingText((prev) => prev + chunk);
    });

    setIsStreaming(false);
    setStreamingText("");
  };

  return (
    <div className="surface flex h-full flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium tracking-tight">Lecture-Grounded Chat</h3>
            <p className="text-[11px] text-muted-foreground">Answers grounded strictly in lecture context</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="overflow-y-auto flex-1 space-y-3 pt-3 pr-1">
        {chatHistory.length === 0 && !isStreaming ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground/60 p-4">
            <Bot className="size-8 mb-2 stroke-1" />
            <p className="text-xs">Ask any question about what the professor explained.</p>
            <p className="text-[11px] text-muted-foreground mt-1">Answers use transcript, notes, and glossary as context.</p>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {msg.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-border/60 bg-elevated/50 text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Currently Streaming Message */}
            {isStreaming && (
              <div className="flex items-start gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium">
                  <Bot className="size-3.5" />
                </div>
                <div className="max-w-[85%] rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                  {streamingText ? (
                    streamingText
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      Thinking from lecture context...
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2 pt-2 border-t border-border/40">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this lecture..."
          disabled={isStreaming}
          className="flex-1 rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background transition-all hover:-translate-y-0.5 disabled:opacity-40"
        >
          {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>
    </div>
  );
}

import { useState, useCallback } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

interface TTSButtonProps {
  text: string;
  language?: string;
  className?: string;
}

export function TTSButton({ text, language = "English", className = "" }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSpeak = useCallback(async () => {
    if (!text || text.trim() === "") return;

    if (isPlaying) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const langMap: Record<string, string> = {
        English: "en-US",
        Hindi: "hi-IN",
        Gujarati: "gu-IN",
        French: "fr-FR",
        en: "en-US",
        hi: "hi-IN",
        gu: "gu-IN",
        fr: "fr-FR",
      };

      utterance.lang = langMap[language] || "en-US";
      utterance.onend = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      setIsLoading(false);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsLoading(false);
    }
  }, [text, language, isPlaying]);

  return (
    <button
      onClick={handleSpeak}
      disabled={isLoading || !text}
      title={isPlaying ? "Stop Read Aloud" : "Read Aloud"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground disabled:opacity-40 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isPlaying ? (
        <>
          <VolumeX className="size-3.5 text-destructive" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="size-3.5 text-primary" />
          <span>Listen</span>
        </>
      )}
    </button>
  );
}

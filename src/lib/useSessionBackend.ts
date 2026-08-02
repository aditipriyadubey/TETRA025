// src/lib/useSessionBackend.ts
//
// EduBridge AI — Frontend / Backend Session Integration Hook

import { useState, useCallback, useRef, useEffect } from "react";
import {
  transcribeAudio,
  processTranscript,
  requestImLostExplanation,
  askAI,
  type ChatTurn,
  type GlossaryEntry,
} from "./api";
import {
  createSession,
  saveTranscriptChunk,
  saveChatMessage,
  type PersistenceMode,
} from "./db";

export interface SessionState {
  sessionId: string | null;
  persistenceMode: PersistenceMode;
  transcript: string[];
  liveTranscript: string[];
  translatedTranscript: string[];
  runningSummary: string;
  notes: string;
  glossary: GlossaryEntry[];
  keywords: string[];
  chatHistory: ChatTurn[];
  isProcessing: boolean;
  isTranscribing: boolean;
  error: string | null;
}

export function useSessionBackend() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>("transcript");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [translatedTranscript, setTranslatedTranscript] = useState<string[]>([]);
  const [runningSummary, setRunningSummary] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const chunkIndexRef = useRef<number>(0);

  const startSession = useCallback(
    async (mode: PersistenceMode = "transcript", language: string = "English") => {
      setError(null);
      const res = await createSession({
        persistenceMode: mode,
        language,
      });

      if (res.ok) {
        setSessionId(res.data.session_id);
        setPersistenceMode(mode);
        setTranscript([]);
        setTranslatedTranscript([]);
        setRunningSummary("");
        setNotes("");
        setGlossary([]);
        setKeywords([]);
        setChatHistory([]);
        chunkIndexRef.current = 0;
        return res.data.session_id;
      } else {
        setError(res.error.message);
        return null;
      }

      setError(res.error.message);
      return null;
    },
    [],
  );

  /**
   * Ensure an active session exists without wiping out existing transcript state
   */
  const ensureSession = useCallback(
    async (mode: PersistenceMode = "transcript", language: string = "English") => {
      if (sessionIdRef.current) return sessionIdRef.current;
      
      const res = await createSession({ persistenceMode: mode, language });
      if (res.ok) {
        const newId = res.data.session_id;
        sessionIdRef.current = newId;
        setSessionId(newId);
        setPersistenceMode(mode);
        return newId;
      }
      return null;
    },
    [],
  );

  const beginTranscribing = useCallback(() => {
    transcribingCountRef.current += 1;
    setIsTranscribing(true);
  }, []);

  const endTranscribing = useCallback(() => {
    transcribingCountRef.current = Math.max(0, transcribingCountRef.current - 1);
    if (transcribingCountRef.current === 0) {
      setIsTranscribing(false);
    }
  }, []);

  const processAudioChunk = useCallback(
    async (
      audioBlob: Blob,
      targetLanguage: string = "English",
      _difficulty: string = "Grade 10",
    ) => {
      if (!audioBlob || audioBlob.size === 0) return;

      beginTranscribing();
      setError(null);

      try {
        const sttRes = await transcribeAudio(audioBlob);
        if (!sttRes.ok) {
          setError(sttRes.error.error);
          return;
        }

        const newText = sttRes.data.text.trim();
        if (!newText) return;

        setTranscript((prev) => [...prev, newText]);

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await startSession(persistenceMode, targetLanguage);
      }

          if (currentSessionId) {
            await saveTranscriptChunk({
              sessionId: currentSessionId,
              chunkIndex: currentChunkIndex,
              text: newText,
              translatedText: newText,
              mode: persistenceMode,
            });
          }
        })();
      } finally {
        endTranscribing();
      }
    },
    [beginTranscribing, endTranscribing, persistenceMode, startSession],
  );

  const processTextSegment = useCallback(
    async (
      text: string,
      targetLanguage: string = "English",
      difficulty: string = "Grade 10",
    ) => {
      if (!text.trim()) return;
      setIsProcessing(true);
      setError(null);

      const currentChunkIndex = chunkIndexRef.current++;
      setTranscript((prev) => [...prev, text]);

      const currentSessionId = await ensureSession(persistenceMode, targetLanguage);

      const procRes = await processTranscript(
        text,
        targetLanguage,
        runningSummaryRef.current,
        notesRef.current,
        difficulty,
      );

      if (procRes.ok) {
        const { translated_text, notes: newNotes, summary, glossary: newGlossary, keywords: newKeywords } = procRes.data;
        const translatedLine = translated_text || text;
        setTranslatedTranscript((prev) => [...prev, translatedLine]);

        if (currentSessionId) {
          await saveTranscriptChunk({
            sessionId: currentSessionId,
            chunkIndex: currentChunkIndex,
            text,
            translatedText: translatedLine,
            mode: persistenceMode,
          });
        }

        if (summary) setRunningSummary(summary);
        if (newNotes) {
          setNotes((prev) => (prev ? `${prev}\n${newNotes}` : newNotes));
          if (currentSessionId) {
            await saveNotes({
              sessionId: currentSessionId,
              contentMarkdown: notesRef.current ? `${notesRef.current}\n${newNotes}` : newNotes,
              mode: persistenceMode,
            });
          }
        }

        if (newGlossary && newGlossary.length > 0) {
          setGlossary((prev) => {
            const existingTerms = new Set(prev.map((g) => g.term.toLowerCase()));
            const uniqueNew = newGlossary.filter(
              (g) => !existingTerms.has(g.term.toLowerCase()),
            );
            return [...prev, ...uniqueNew];
          });
        }

        if (newKeywords && newKeywords.length > 0) {
          setKeywords((prev) => Array.from(newSetFrom(prev, newKeywords)));
        }
      } else {
        setTranslatedTranscript((prev) => [...prev, text]);
      }

      if (currentSessionId) {
        await saveTranscriptChunk({
          sessionId: currentSessionId,
          chunkIndex: currentChunkIndex,
          text,
          translatedText: text,
          mode: persistenceMode,
        });
      }

      setIsProcessing(false);
    },
    [persistenceMode, ensureSession],
  );

  /**
   * Handle "I'm Lost" rescue explanation request
   */
  const handleImLost = useCallback(
    async (currentDifficulty: string = "Grade 10"): Promise<string | null> => {
      const rollingBuffer = transcript.slice(-5).join(" ");
      if (!rollingBuffer) return "No lecture audio has been captured yet to rescue!";

      const res = await requestImLostExplanation(rollingBuffer, currentDifficulty);

      if (res.ok) {
        return res.data.explanation;
      } else {
        setError(res.error.error);
        return null;
      }
    },
    [transcript],
  );

  /**
   * Send a question to Ask AI and stream the lecture-grounded response.
   */
  const sendAskQuestion = useCallback(
    async (question: string): Promise<boolean> => {
      if (!question.trim()) return false;
      const activeSessionId = sessionIdRef.current ?? (await ensureSession(persistenceMode));
      if (!activeSessionId) return false;

      // Add user message to chat history
      const userMessage: ChatTurn = { role: "user", content: question };
      setChatHistory((prev) => [...prev, userMessage]);

      if (activeSessionId) {
        await saveChatMessage({
          sessionId: activeSessionId,
          role: "user",
          content: question,
          mode: persistenceMode,
        });
      }

      const rollingBuffer = transcript.slice(-5).join(" ");
      const glossaryText = glossary.map((g) => `${g.term}: ${g.definition}`).join("; ");
      const keywordsText = keywords.join(", ");

      const result = await askAI(
        activeSessionId,
        question,
        runningSummary,
        rollingBuffer,
        [...chatHistory, userMessage],
        notes,
        glossaryText,
        keywordsText,
      );

      if (!result.ok) {
        setError(result.error.error);
        return false;
      }

      // Add empty assistant turn to be filled by stream
      setChatHistory((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = result.stream.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        fullContent += text;

        setChatHistory((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = { role: "assistant", content: fullContent };
          }
          return updated;
        });
      }

      // Save complete assistant message to DB
      if (activeSessionId && fullContent) {
        await saveChatMessage({
          sessionId: activeSessionId,
          role: "assistant",
          content: fullContent,
          mode: persistenceMode,
        });
      }

      return true;
    },
    [sessionId, chatHistory, runningSummary, transcript, notes, glossary, keywords, persistenceMode],
  );

  /**
   * Request "I'm Lost" rescue explanation.
   */
  const handleImLost = useCallback(
    async (currentDifficulty: string): Promise<string | null> => {
      setError(null);
      const rollingBuffer = transcript.slice(-5).join(" ");

      const res = await requestImLostExplanation(rollingBuffer, currentDifficulty);
      if (res.ok) {
        return res.data.explanation;
      } else {
        setError(res.error.error);
        return null;
      }
    },
    [transcript],
  );

  return {
    sessionId,
    persistenceMode,
    transcript,
    liveTranscript: transcript,
    translatedTranscript,
    runningSummary,
    notes,
    glossary,
    keywords,
    chatHistory,
    isProcessing,
    isTranscribing,
    error,
    startSession,
    processAudioChunk,
    processTextSegment,
    handleImLost,
    sendAskQuestion,
  };
}

function newSetFrom(existing: string[], incoming: string[]): Set<string> {
  return new Set([...existing, ...incoming]);
}

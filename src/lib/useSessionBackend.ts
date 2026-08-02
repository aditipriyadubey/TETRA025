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

  const sessionIdRef = useRef<string | null>(null);
  const runningSummaryRef = useRef<string>("");
  const notesRef = useRef<string>("");
  const transcribingCountRef = useRef<number>(0);
  const chunkIndexRef = useRef<number>(0);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    runningSummaryRef.current = runningSummary;
  }, [runningSummary]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const startSession = useCallback(
    async (mode: PersistenceMode = "transcript", language: string = "English") => {
      setError(null);
      const res = await createSession({ persistenceMode: mode, language });

      if (res.ok) {
        const nextSessionId = res.data.session_id;
        sessionIdRef.current = nextSessionId;
        setSessionId(nextSessionId);
        setPersistenceMode(mode);
        setTranscript([]);
        setTranslatedTranscript([]);
        setRunningSummary("");
        setNotes("");
        setGlossary([]);
        setKeywords([]);
        setChatHistory([]);
        chunkIndexRef.current = 0;
        runningSummaryRef.current = "";
        notesRef.current = "";
        return nextSessionId;
      }

      setError(res.error.message);
      return null;
    },
    [],
  );

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

        const normalizedTargetLanguage = String(targetLanguage ?? "English").trim() || "English";
        const newText = sttRes.data.text.trim();
        if (!newText) return;

        const currentChunkIndex = chunkIndexRef.current++;
        setTranscript((prev) => [...prev, newText]);

        const procRes = await processTranscript(
          newText,
          normalizedTargetLanguage,
          runningSummaryRef.current,
          notesRef.current,
          _difficulty,
        );

        const translatedLine = procRes.ok && procRes.data.translated_text
          ? procRes.data.translated_text
          : newText;
        setTranslatedTranscript((prev) => [...prev, translatedLine]);

        let currentSessionId = sessionIdRef.current ?? sessionId;
        if (!currentSessionId) {
          currentSessionId = await startSession(persistenceMode, targetLanguage);
        }

        if (currentSessionId) {
          await saveTranscriptChunk({
            sessionId: currentSessionId,
            chunkIndex: currentChunkIndex,
            text: newText,
            translatedText: translatedLine,
            mode: persistenceMode,
          });
        }
      } finally {
        endTranscribing();
      }
    },
    [beginTranscribing, endTranscribing, persistenceMode, sessionId, startSession],
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

      const normalizedTargetLanguage = String(targetLanguage ?? "English").trim() || "English";
      const currentChunkIndex = chunkIndexRef.current++;
      setTranscript((prev) => [...prev, text]);

      const currentSessionId = await ensureSession(persistenceMode, normalizedTargetLanguage);
      const procRes = await processTranscript(
        text,
        normalizedTargetLanguage,
        runningSummaryRef.current,
        notesRef.current,
        difficulty,
      );

      if (procRes.ok) {
        const translatedLine = procRes.data.translated_text || text;
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
      } else {
        setTranslatedTranscript((prev) => [...prev, text]);
        if (currentSessionId) {
          await saveTranscriptChunk({
            sessionId: currentSessionId,
            chunkIndex: currentChunkIndex,
            text,
            translatedText: text,
            mode: persistenceMode,
          });
        }
      }

      setIsProcessing(false);
    },
    [ensureSession, persistenceMode],
  );

  const handleImLost = useCallback(
    async (currentDifficulty: string = "Grade 10"): Promise<string | null> => {
      const rollingBuffer = transcript.slice(-5).join(" ");
      if (!rollingBuffer) return "No lecture audio has been captured yet to rescue!";

      const res = await requestImLostExplanation(rollingBuffer, currentDifficulty);
      if (res.ok) {
        return res.data.explanation;
      }

      setError(res.error.error);
      return null;
    },
    [transcript],
  );

  const sendAskQuestion = useCallback(
    async (question: string): Promise<boolean> => {
      if (!question.trim()) return false;

      const activeSessionId = sessionIdRef.current ?? (await ensureSession(persistenceMode));
      if (!activeSessionId) return false;

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
    [chatHistory, ensureSession, glossary, keywords, notes, persistenceMode, runningSummary, transcript],
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

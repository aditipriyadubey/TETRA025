// src/lib/useSessionBackend.ts
//
// EduBridge AI — Frontend / Backend Session Integration Hook
//
// Connects frontend interactive UI with Supabase Edge Functions:
//   - Anonymous session creation & lifecycle
//   - Real-time audio transcription (/stt-proxy)
//   - Unified AI processing (/process → translation, notes, summary, glossary, keywords in ONE call)
//   - "I'm Lost" rescue explanation (/im-lost)
//   - Streamed Ask AI chat (/ask) grounded in lecture context

import { useState, useCallback, useRef } from "react";
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
  saveNotes,
  saveVocabularyTerm,
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
  const [error, setError] = useState<string | null>(null);

  const chunkIndexRef = useRef<number>(0);

  /**
   * Start a new backend session.
   */
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
    },
    [],
  );

  /**
   * Process an audio chunk (Blob):
   * 1. Transcribe via Groq Whisper (/stt-proxy)
   * 2. Append to rolling live transcript & persist chunk
   *
   * Note: Gemini processing (notes, summary, glossary, translation) is omitted
   * during live recording to ensure low latency and zero quota exhaustion.
   */
  const processAudioChunk = useCallback(
    async (
      audioBlob: Blob,
      targetLanguage: string = "English",
      _difficulty: string = "Grade 10",
    ) => {
      if (!audioBlob || audioBlob.size === 0) return;
      setIsProcessing(true);
      setError(null);

      // 1. Transcribe audio using Groq Whisper STT
      const sttRes = await transcribeAudio(audioBlob);
      if (!sttRes.ok) {
        setIsProcessing(false);
        setError(sttRes.error.error);
        return;
      }

      const newText = sttRes.data.text;
      if (!newText.trim()) {
        setIsProcessing(false);
        return;
      }

      const currentChunkIndex = chunkIndexRef.current++;
      setTranscript((prev) => [...prev, newText]);

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await startSession(persistenceMode, targetLanguage);
      }

      // Save transcript chunk to DB
      if (currentSessionId) {
        await saveTranscriptChunk({
          sessionId: currentSessionId,
          chunkIndex: currentChunkIndex,
          text: newText,
          translatedText: newText,
          mode: persistenceMode,
        });
      }

      setIsProcessing(false);
    },
    [sessionId, persistenceMode, startSession],
  );

  /**
   * Directly process a raw text segment (for lecture text uploads)
   */
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

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await startSession(persistenceMode, targetLanguage);
      }

      const procRes = await processTranscript(
        text,
        targetLanguage,
        runningSummary,
        notes,
        difficulty,
      );

      if (procRes.ok) {
        const { translated_text, notes: newNotes, summary, glossary: newGlossary, keywords: newKeywords } = procRes.data;
        const translatedLine = translated_text || text;
        setTranslatedTranscript((prev) => [...prev, translatedLine]);

        if (summary) setRunningSummary(summary);

        if (newNotes) {
          setNotes((prev) => (prev ? `${prev}\n${newNotes}` : newNotes));
        }

        if (newGlossary && newGlossary.length > 0) {
          setGlossary((prev) => {
            const existingTerms = new Set(prev.map((g) => g.term.toLowerCase()));
            const uniqueNew = newGlossary.filter((g) => !existingTerms.has(g.term.toLowerCase()));
            return [...prev, ...uniqueNew];
          });
        }

        if (newKeywords && newKeywords.length > 0) {
          setKeywords((prev) => Array.from(new Set([...prev, ...newKeywords])));
        }
      } else {
        setTranslatedTranscript((prev) => [...prev, text]);
      }

      setIsProcessing(false);
    },
    [sessionId, persistenceMode, runningSummary, notes, startSession],
  );

  /**
   * Send a question to Ask AI and stream the lecture-grounded response.
   */
  const sendAskQuestion = useCallback(
    async (
      question: string,
      onChunk?: (chunk: string) => void,
    ): Promise<string | null> => {
      if (!question.trim()) return null;
      setError(null);

      const activeSessionId = sessionId ?? crypto.randomUUID();
      const updatedHistory: ChatTurn[] = [
        ...chatHistory,
        { role: "user", content: question },
      ];
      setChatHistory(updatedHistory);

      await saveChatMessage({
        sessionId: activeSessionId,
        role: "user",
        content: question,
        mode: persistenceMode,
      });

      const rollingBuffer = transcript.slice(-5).join(" ");
      const glossaryString = glossary.map((g) => `${g.term}: ${g.definition}`).join("\n");
      const keywordsString = keywords.join(", ");

      const askRes = await askAI(
        activeSessionId,
        question,
        runningSummary,
        rollingBuffer,
        chatHistory,
        notes,
        glossaryString,
        keywordsString,
      );

      if (!askRes.ok) {
        setError(askRes.error.error);
        return null;
      }

      const reader = askRes.stream.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(value, { stream: true });
        fullAnswer += textChunk;
        if (onChunk) onChunk(textChunk);
      }

      const finalHistory: ChatTurn[] = [
        ...updatedHistory,
        { role: "assistant", content: fullAnswer },
      ];
      setChatHistory(finalHistory);

      await saveChatMessage({
        sessionId: activeSessionId,
        role: "assistant",
        content: fullAnswer,
        mode: persistenceMode,
      });

      return fullAnswer;
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
    error,
    startSession,
    processAudioChunk,
    processTextSegment,
    sendAskQuestion,
    handleImLost,
  };
}

// src/lib/useSessionBackend.ts
//
// EduBridge AI — Frontend / Backend Session Integration Hook
//
// Connects frontend interactive UI with Supabase Edge Functions and
// database persistence:
//   - Anonymous session creation & lifecycle
//   - Real-time audio transcription (/stt-proxy + saveTranscriptChunk)
//   - Language translation (/translate)
//   - Technical term extraction (/terms + saveVocabularyTerm)
//   - Incremental notes generation (/notes + saveNotes)
//   - Context summary updates (/context-summary)
//   - Dictionary lookup (/dictionary)
//   - "I'm Lost" rescue explanation (/im-lost)
//   - Streamed Ask AI chat (/ask + saveChatMessage)
//   - Session finish & quiz generation (/finish)
//
// OWNERSHIP:
//   Developer 3 — Backend & Integration Layer.
//   Preserves UI design system, handles API errors gracefully,
//   and enforces persistence modes & audio privacy rules.

import { useState, useCallback, useRef } from "react";
import {
  transcribeAudio,
  translateText,
  extractTerms,
  generateNotes,
  updateContextSummary,
  lookupDictionary,
  requestImLostExplanation,
  askAI,
  finishSession,
  type ChatTurn,
  type DictionaryResponse,
  type FinishResponse,
  type TechnicalTerm,
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
  translatedTranscript: string[];
  runningSummary: string;
  notes: string;
  terms: TechnicalTerm[];
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
  const [terms, setTerms] = useState<TechnicalTerm[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const chunkIndexRef = useRef<number>(0);
  const frictionTermsRef = useRef<Set<string>>(new Set());
  const frictionLostTimestampsRef = useRef<number[]>([]);

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
        setTerms([]);
        setChatHistory([]);
        chunkIndexRef.current = 0;
        frictionTermsRef.current.clear();
        frictionLostTimestampsRef.current = [];
        return res.data.session_id;
      } else {
        setError(res.error.message);
        return null;
      }
    },
    [],
  );

  /**
   * Process an audio chunk (Blob): transcribe, translate, extract terms, update notes & summary.
   */
  const processAudioChunk = useCallback(
    async (audioBlob: Blob, targetLanguage: string = "English", difficulty: string = "Grade 10") => {
      if (!audioBlob || audioBlob.size === 0) return;
      setIsProcessing(true);
      setError(null);

      // 1. Transcribe audio
      const sttRes = await transcribeAudio(audioBlob);
      if (!sttRes.ok) {
        // Fall back gracefully if AI/STT is not yet implemented on backend
        setIsProcessing(false);
        if (sttRes.error.code !== "STT_NOT_IMPLEMENTED") {
          setError(sttRes.error.error);
        }
        return;
      }

      const newText = sttRes.data.text;
      const currentChunkIndex = chunkIndexRef.current++;
      setTranscript((prev) => [...prev, newText]);

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await startSession(persistenceMode, targetLanguage);
      }

      // Persist transcript chunk if session exists
      if (currentSessionId) {
        await saveTranscriptChunk({
          sessionId: currentSessionId,
          chunkIndex: currentChunkIndex,
          text: newText,
          mode: persistenceMode,
        });
      }

      // 2. Translate text if target language is not English
      if (targetLanguage.toLowerCase() !== "english") {
        const transRes = await translateText(newText, targetLanguage);
        if (transRes.ok) {
          setTranslatedTranscript((prev) => [...prev, transRes.data.translated_text]);
        }
      }

      // 3. Extract technical terms
      const termsRes = await extractTerms(newText);
      if (termsRes.ok && termsRes.data.terms.length > 0) {
        setTerms((prev) => [...prev, ...termsRes.data.terms]);
        if (currentSessionId) {
          for (const t of termsRes.data.terms) {
            await saveVocabularyTerm({
              sessionId: currentSessionId,
              term: t.term,
              mode: persistenceMode,
            });
          }
        }
      }

      // 4. Update running summary
      const summaryRes = await updateContextSummary(runningSummary, newText);
      if (summaryRes.ok) {
        setRunningSummary(summaryRes.data.running_summary);
      }

      // 5. Generate notes delta
      if (currentSessionId) {
        const notesRes = await generateNotes(currentSessionId, newText, notes, difficulty);
        if (notesRes.ok) {
          const updatedNotes = notes ? `${notes}\n${notesRes.data.notes_delta}` : notesRes.data.notes_delta;
          setNotes(updatedNotes);
          await saveNotes({
            sessionId: currentSessionId,
            contentMarkdown: updatedNotes,
            mode: persistenceMode,
          });
        }
      }

      setIsProcessing(false);
    },
    [sessionId, persistenceMode, runningSummary, notes, startSession],
  );

  /**
   * Send a question to Ask AI and stream the response.
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

      // Persist user question
      await saveChatMessage({
        sessionId: activeSessionId,
        role: "user",
        content: question,
        mode: persistenceMode,
      });

      const rollingBuffer = transcript.slice(-5).join(" ");
      const askRes = await askAI(
        activeSessionId,
        question,
        runningSummary,
        rollingBuffer,
        chatHistory,
      );

      if (!askRes.ok) {
        if (askRes.error.code !== "AI_NOT_IMPLEMENTED") {
          setError(askRes.error.error);
        }
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

      // Persist assistant response
      await saveChatMessage({
        sessionId: activeSessionId,
        role: "assistant",
        content: fullAnswer,
        mode: persistenceMode,
      });

      return fullAnswer;
    },
    [sessionId, chatHistory, runningSummary, transcript, persistenceMode],
  );

  /**
   * Request "I'm Lost" rescue explanation.
   */
  const handleImLost = useCallback(
    async (currentDifficulty: string): Promise<string | null> => {
      setError(null);
      frictionLostTimestampsRef.current.push(Date.now());
      const rollingBuffer = transcript.slice(-5).join(" ");

      const res = await requestImLostExplanation(rollingBuffer, currentDifficulty);
      if (res.ok) {
        return res.data.explanation;
      } else {
        if (res.error.code !== "AI_NOT_IMPLEMENTED") {
          setError(res.error.error);
        }
        return null;
      }
    },
    [transcript],
  );

  /**
   * Lookup dictionary term definition.
   */
  const handleDictionaryLookup = useCallback(
    async (
      term: string,
      sentenceContext: string,
      difficulty: string,
      targetLanguage: string,
    ): Promise<DictionaryResponse | null> => {
      setError(null);
      frictionTermsRef.current.add(term);

      const res = await lookupDictionary(term, sentenceContext, difficulty, targetLanguage);
      if (res.ok) {
        return res.data;
      } else {
        if (res.error.code !== "AI_NOT_IMPLEMENTED") {
          setError(res.error.error);
        }
        return null;
      }
    },
    [],
  );

  /**
   * Complete session and fetch summary + personalized quiz.
   */
  const handleFinishSession = useCallback(async (): Promise<FinishResponse | null> => {
    if (!sessionId) return null;
    setError(null);

    const fullTranscriptText = transcript.join("\n");
    const frictionPoints = {
      dictionary_terms_clicked: Array.from(frictionTermsRef.current),
      im_lost_timestamps: frictionLostTimestampsRef.current,
    };

    const res = await finishSession(
      sessionId,
      fullTranscriptText,
      runningSummary,
      frictionPoints,
    );

    if (res.ok) {
      return res.data;
    } else {
      if (res.error.code !== "AI_NOT_IMPLEMENTED") {
        setError(res.error.error);
      }
      return null;
    }
  }, [sessionId, transcript, runningSummary]);

  return {
    sessionId,
    persistenceMode,
    transcript,
    translatedTranscript,
    runningSummary,
    notes,
    terms,
    chatHistory,
    isProcessing,
    error,
    startSession,
    processAudioChunk,
    sendAskQuestion,
    handleImLost,
    handleDictionaryLookup,
    handleFinishSession,
  };
}

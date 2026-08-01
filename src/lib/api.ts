// src/lib/api.ts
//
// EduBridge AI — Typed API Wrappers for Supabase Edge Functions
//
// Each function corresponds to exactly one Edge Function endpoint.
// These wrappers handle:
//   - request typing
//   - response typing
//   - difficulty mapping (frontend labels → backend enum)
//   - Supabase function invocation or raw fetch
//   - error normalisation
//
// OWNERSHIP:
//   Developer 3 owns this file.
//   This file depends on HTTP contracts, NOT on AI prompt logic.
//   Do NOT import from src/ai/*.

import { supabase } from "./supabaseClient";

// ─── Difficulty Mapping ──────────────────────────────────────────
//
// Frontend uses display labels: "Grade 5", "Grade 8", "Grade 10", "College", "Expert"
// Edge Functions use enum values: "child", "high_school", "college", "expert"

/**
 * Backend difficulty enum — matches Edge Function validation.
 */
type BackendDifficulty = "child" | "high_school" | "college" | "expert";

/**
 * Frontend difficulty labels — matches mock-data.ts `Difficulty` type.
 */
type FrontendDifficulty = "Grade 5" | "Grade 8" | "Grade 10" | "College" | "Expert";

const DIFFICULTY_MAP: Record<FrontendDifficulty, BackendDifficulty> = {
  "Grade 5": "child",
  "Grade 8": "child",
  "Grade 10": "high_school",
  College: "college",
  Expert: "expert",
};

/**
 * Map a frontend difficulty label to the backend enum value.
 * Falls back to "college" for unknown values.
 */
export function mapDifficulty(frontendDifficulty: string): BackendDifficulty {
  return (
    DIFFICULTY_MAP[frontendDifficulty as FrontendDifficulty] ?? "college"
  );
}

// ─── Shared Types ────────────────────────────────────────────────

/** Consistent error shape returned by all Edge Functions. */
export interface ApiError {
  error: string;
  code: string;
}

/** Wrapper result — either success data or an error. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

// ─── Helper ──────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Invoke a JSON Edge Function via the Supabase client.
 * Handles the `{ data, error }` response and normalises it.
 */
async function invokeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<ApiResult<T>> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    // Supabase client wraps HTTP errors
    return {
      ok: false,
      error: {
        error: error.message ?? "Unknown error",
        code: "INVOCATION_ERROR",
      },
    };
  }

  return { ok: true, data: data as T };
}

// ═════════════════════════════════════════════════════════════════
//  1. POST /stt-proxy — Speech-to-Text
// ═════════════════════════════════════════════════════════════════

export interface SttResponse {
  text: string;
  chunk_id: string;
  timestamp: number;
}

/**
 * Send an audio chunk for speech-to-text transcription.
 *
 * Uses raw fetch (not supabase.functions.invoke) because
 * /stt-proxy requires multipart/form-data with a File/Blob.
 *
 * PRIVACY: The audio Blob is sent in-memory only.
 * It is never persisted, logged, or cached by this function.
 */
export async function transcribeAudio(
  audio: Blob,
): Promise<ApiResult<SttResponse>> {
  const formData = new FormData();
  formData.append("audio", audio);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/stt-proxy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      // Do NOT set Content-Type — browser sets it with multipart boundary
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json as ApiError };
    }

    return { ok: true, data: json as SttResponse };
  } catch (err) {
    return {
      ok: false,
      error: {
        error: err instanceof Error ? err.message : "Network error",
        code: "NETWORK_ERROR",
      },
    };
  }
}

// ═════════════════════════════════════════════════════════════════
//  2. POST /translate — Translation
// ═════════════════════════════════════════════════════════════════

export interface TranslateResponse {
  translated_text: string;
}

/**
 * Translate a transcript chunk into the target language.
 * Translation is difficulty-independent by design.
 */
export async function translateText(
  text: string,
  targetLanguage: string,
): Promise<ApiResult<TranslateResponse>> {
  return invokeFunction<TranslateResponse>("translate", {
    text,
    target_language: targetLanguage,
  });
}

// ═════════════════════════════════════════════════════════════════
//  3. POST /terms — Technical Term Extraction
// ═════════════════════════════════════════════════════════════════

export interface TechnicalTerm {
  term: string;
  start_index: number;
  end_index: number;
}

export interface TermsResponse {
  terms: TechnicalTerm[];
}

/**
 * Extract technical terms (with character positions) from a transcript chunk.
 */
export async function extractTerms(
  text: string,
): Promise<ApiResult<TermsResponse>> {
  return invokeFunction<TermsResponse>("terms", { text });
}

// ═════════════════════════════════════════════════════════════════
//  4. POST /notes — Notes Generation
// ═════════════════════════════════════════════════════════════════

export interface NotesResponse {
  notes_delta: string;
}

/**
 * Generate new note bullets from the latest transcript.
 * Returns ONLY the delta — client appends to existing notes.
 *
 * @param difficulty - Frontend difficulty label (auto-mapped to backend enum)
 */
export async function generateNotes(
  sessionId: string,
  newTranscript: string,
  existingNotes: string,
  difficulty: string,
): Promise<ApiResult<NotesResponse>> {
  return invokeFunction<NotesResponse>("notes", {
    session_id: sessionId,
    new_transcript: newTranscript,
    existing_notes: existingNotes,
    difficulty: mapDifficulty(difficulty),
  });
}

// ═════════════════════════════════════════════════════════════════
//  5. POST /context-summary — Running Summary Update
// ═════════════════════════════════════════════════════════════════

export interface ContextSummaryResponse {
  running_summary: string;
}

/**
 * Fold new transcript content into the existing running summary.
 * Does NOT re-summarize from scratch — incremental only.
 *
 * @param existingSummary - May be empty string for the first cycle
 */
export async function updateContextSummary(
  existingSummary: string,
  newTranscript: string,
): Promise<ApiResult<ContextSummaryResponse>> {
  return invokeFunction<ContextSummaryResponse>("context-summary", {
    existing_summary: existingSummary,
    new_transcript: newTranscript,
  });
}

// ═════════════════════════════════════════════════════════════════
//  6. POST /dictionary — Dictionary Lookup
// ═════════════════════════════════════════════════════════════════

export interface DictionaryResponse {
  definition: string;
  pronunciation_ipa: string;
  translation: string;
  simple_explanation: string;
  analogy: string;
}

/**
 * Look up a technical term with context-aware definitions.
 *
 * @param difficulty - Frontend difficulty label (auto-mapped to backend enum)
 */
export async function lookupDictionary(
  term: string,
  sentenceContext: string,
  difficulty: string,
  targetLanguage: string,
): Promise<ApiResult<DictionaryResponse>> {
  return invokeFunction<DictionaryResponse>("dictionary", {
    term,
    sentence_context: sentenceContext,
    difficulty: mapDifficulty(difficulty),
    target_language: targetLanguage,
  });
}

// ═════════════════════════════════════════════════════════════════
//  7. POST /im-lost — "I'm Lost" Rescue
// ═════════════════════════════════════════════════════════════════

export interface ImLostResponse {
  explanation: string;
}

/**
 * Request a simplified rescue explanation for recent content.
 * Server-side difficulty step-down per Section 5.5.
 *
 * @param currentDifficulty - Frontend difficulty label (auto-mapped to backend enum)
 */
export async function requestImLostExplanation(
  rollingBuffer: string,
  currentDifficulty: string,
): Promise<ApiResult<ImLostResponse>> {
  return invokeFunction<ImLostResponse>("im-lost", {
    rolling_buffer: rollingBuffer,
    current_difficulty: mapDifficulty(currentDifficulty),
  });
}

// ═════════════════════════════════════════════════════════════════
//  8. POST /ask — Ask AI (Streamed Response)
// ═════════════════════════════════════════════════════════════════

/**
 * A single chat turn — matches Edge Function + database schema.
 * Note: frontend mock-data uses "ai" but the backend uses "assistant".
 */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ask AI a question with full session context.
 *
 * Returns the raw Response object for streamed text consumption.
 * Uses raw fetch (not supabase.functions.invoke) because the
 * success response is STREAMED TEXT, not JSON.
 *
 * Usage:
 * ```ts
 * const res = await askAI(sessionId, question, summary, buffer, history);
 * if (!res.ok) { handleError(res.error); return; }
 *
 * const reader = res.stream.getReader();
 * const decoder = new TextDecoder();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   appendToUI(decoder.decode(value, { stream: true }));
 * }
 * ```
 */
export type AskAIResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; error: ApiError };

export async function askAI(
  sessionId: string,
  question: string,
  runningSummary: string,
  rollingBuffer: string,
  chatHistory: ChatTurn[],
): Promise<AskAIResult> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        question,
        running_summary: runningSummary,
        rolling_buffer: rollingBuffer,
        chat_history: chatHistory,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      return { ok: false, error: json as ApiError };
    }

    if (!res.body) {
      return {
        ok: false,
        error: {
          error: "Response body is null — streaming not supported.",
          code: "NO_STREAM",
        },
      };
    }

    return { ok: true, stream: res.body };
  } catch (err) {
    return {
      ok: false,
      error: {
        error: err instanceof Error ? err.message : "Network error",
        code: "NETWORK_ERROR",
      },
    };
  }
}

// ═════════════════════════════════════════════════════════════════
//  9. POST /finish — Session Finish
// ═════════════════════════════════════════════════════════════════

export type QuizQuestion =
  | {
      type: "mcq";
      question: string;
      options: string[];
      correct_answer: string;
      explanation: string;
    }
  | {
      type: "short_answer";
      question: string;
      correct_answer: string;
      explanation: string;
    };

export interface FrictionPoints {
  dictionary_terms_clicked: string[];
  im_lost_timestamps: number[];
}

export interface FinishResponse {
  summary: string;
  quiz: QuizQuestion[];
}

/**
 * Complete the session and generate a summary + personalized quiz.
 * Quiz is 5–8 questions weighted toward friction points.
 */
export async function finishSession(
  sessionId: string,
  fullTranscript: string,
  runningSummary: string,
  frictionPoints: FrictionPoints,
): Promise<ApiResult<FinishResponse>> {
  return invokeFunction<FinishResponse>("finish", {
    session_id: sessionId,
    full_transcript: fullTranscript,
    running_summary: runningSummary,
    friction_points: frictionPoints,
  });
}

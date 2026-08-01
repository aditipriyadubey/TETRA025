// src/lib/api.ts
//
// EduBridge AI — API Wrappers for Supabase Edge Functions
//
// NEW PIPELINE ARCHITECTURE:
//   1. POST /stt-proxy    — Groq Whisper speech-to-text (multipart)
//   2. POST /process      — ONE Gemini call → structured JSON
//   3. POST /ask          — Lecture-grounded chat (streamed)
//   4. POST /im-lost      — Section-specific rescue explanation
//
// This replaces the old 9-endpoint API-wrapper pattern.

import { supabase } from "./supabaseClient";

// ─── Difficulty Mapping ──────────────────────────────────────────

type BackendDifficulty = "child" | "high_school" | "college" | "expert";

type FrontendDifficulty = "Grade 5" | "Grade 8" | "Grade 10" | "College" | "Expert";

const DIFFICULTY_MAP: Record<FrontendDifficulty, BackendDifficulty> = {
  "Grade 5": "child",
  "Grade 8": "child",
  "Grade 10": "high_school",
  College: "college",
  Expert: "expert",
};

export function mapDifficulty(frontendDifficulty: string): BackendDifficulty {
  return (
    DIFFICULTY_MAP[frontendDifficulty as FrontendDifficulty] ?? "college"
  );
}

// ─── Shared Types ────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

// ─── Helper ──────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string;
const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string;


async function invokeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<ApiResult<T>> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
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
//  2. POST /process — Unified AI Processing (ONE Gemini call)
// ═════════════════════════════════════════════════════════════════

export interface GlossaryEntry {
  term: string;
  definition: string;
  simple_explanation: string;
}

export interface ProcessResponse {
  translated_text: string;
  notes: string;
  summary: string;
  glossary: GlossaryEntry[];
  keywords: string[];
}

/**
 * Process a transcript chunk through ONE Gemini call.
 * Returns: translated text, notes, summary, glossary, keywords.
 *
 * This is the CORE of the new pipeline — replaces 5 old endpoints.
 */
export async function processTranscript(
  transcript: string,
  targetLanguage: string,
  existingSummary: string,
  existingNotes: string,
  difficulty: string,
): Promise<ApiResult<ProcessResponse>> {
  return invokeFunction<ProcessResponse>("process", {
    transcript,
    target_language: targetLanguage,
    existing_summary: existingSummary,
    existing_notes: existingNotes,
    difficulty: mapDifficulty(difficulty),
  });
}

// ═════════════════════════════════════════════════════════════════
//  3. POST /im-lost — "I'm Lost" Rescue
// ═════════════════════════════════════════════════════════════════

export interface ImLostResponse {
  explanation: string;
}

/**
 * Request a simplified rescue explanation for recent content.
 * Server-side difficulty step-down is automatic.
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
//  4. POST /ask — Ask AI (Streamed, Lecture-Grounded)
// ═════════════════════════════════════════════════════════════════

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type AskAIResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; error: ApiError };

/**
 * Ask AI a question with full lecture context.
 * Returns a ReadableStream for streamed text consumption.
 *
 * Now includes notes, glossary, and keywords for lecture grounding.
 */
export async function askAI(
  sessionId: string,
  question: string,
  runningSummary: string,
  rollingBuffer: string,
  chatHistory: ChatTurn[],
  notes: string = "",
  glossary: string = "",
  keywords: string = "",
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
        notes,
        glossary,
        keywords,
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

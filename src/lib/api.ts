// src/lib/api.ts
//
// EduBridge AI — API Wrappers with Native Local Ollama & Groq Whisper Fallbacks
//
// PIPELINE ARCHITECTURE:
//   1. STT:     Groq Whisper STT (via /groq-api proxy)
//   2. Process: Local Ollama (llama3.1 via /ollama-api proxy) for notes, Hindi/multilingual translation, glossary, keywords
//   3. Rescue:  Local Ollama for "I'm Lost" step-down explanation
//   4. Ask AI:  Local Ollama for streamed Q&A chat

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
  return DIFFICULTY_MAP[frontendDifficulty as FrontendDifficulty] ?? "college";
}

// ─── Shared Types ────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

// ─── Environment & Proxies ────────────────────────────────────────

const RAW_URL = (import.meta.env["VITE_SUPABASE_URL"] as string) ?? "";
const SUPABASE_URL = RAW_URL.replace(/\/+$/, "");
const SUPABASE_ANON_KEY = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) ?? "";
const GROQ_API_KEY =
  (import.meta.env["GROQ_API_KEY"] as string) ||
  (import.meta.env["VITE_GROQ_API_KEY"] as string) ||
  "";

const GROQ_BASE = "/groq-api";
const OLLAMA_BASE = "/ollama-api";
const OLLAMA_MODEL = "llama3.1";

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
//  1. Speech-to-Text (Groq Whisper)
// ═════════════════════════════════════════════════════════════════

export interface SttResponse {
  text: string;
  chunk_id: string;
  timestamp: number;
}

/**
 * Transcribe browser audio via Groq Whisper STT.
 */
export async function transcribeAudio(
  audio: Blob,
): Promise<ApiResult<SttResponse>> {
  // 1. Try Supabase Edge Function
  try {
    const formData = new FormData();
    formData.append("audio", audio);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/stt-proxy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: formData,
    });
    if (res.ok) {
      const json = await res.json();
      return { ok: true, data: json as SttResponse };
    }
  } catch {
    // Edge function unavailable, fallback to direct Groq Whisper
  }

  // 2. Direct Groq Whisper via /groq-api proxy
  if (GROQ_API_KEY) {
    try {
      const mime = audio.type || "audio/webm";
      const ext = mime.includes("mp4") ? ".mp4" : mime.includes("ogg") ? ".ogg" : ".webm";
      const namedFile = new File([audio], `recording${ext}`, { type: mime });

      const groqForm = new FormData();
      groqForm.append("file", namedFile, `recording${ext}`);
      groqForm.append("model", "whisper-large-v3-turbo");
      groqForm.append("response_format", "json");

      const groqRes = await fetch(`${GROQ_BASE}/openai/v1/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: groqForm,
      });

      if (groqRes.ok) {
        const groqJson = await groqRes.json();
        const rawText = (groqJson.text ?? "").trim();
        
        // Filter out empty or single punctuation noise (e.g. ".")
        if (!rawText || rawText === "." || rawText === "...") {
          return {
            ok: true,
            data: {
              text: "",
              chunk_id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          };
        }

        return {
          ok: true,
          data: {
            text: rawText,
            chunk_id: crypto.randomUUID(),
            timestamp: Date.now(),
          },
        };
      }
    } catch (err) {
      return {
        ok: false,
        error: { error: err instanceof Error ? err.message : "STT error", code: "STT_ERROR" },
      };
    }
  }

  return {
    ok: false,
    error: { error: "STT unavailable. Check GROQ_API_KEY in .env.local.", code: "STT_UNAVAILABLE" },
  };
}

// ═════════════════════════════════════════════════════════════════
//  2. Unified AI Processing (Local Ollama llama3.1)
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

export async function processTranscript(
  transcript: string,
  targetLanguage: string,
  existingSummary: string,
  existingNotes: string,
  difficulty: string,
): Promise<ApiResult<ProcessResponse>> {
  const currentChunk = transcript.trim();
  if (!currentChunk) {
    return {
      ok: false,
      error: { error: "Empty transcript chunk.", code: "EMPTY_TRANSCRIPT" },
    };
  }

  const transcriptChunk = currentChunk.slice(0, 400);

  const edgeRes = await invokeFunction<ProcessResponse>("process", {
    transcript: transcriptChunk,
    target_language: targetLanguage,
    difficulty: mapDifficulty(difficulty),
  });

  if (edgeRes.ok && edgeRes.data.translated_text) {
    return edgeRes;
  }

  if (targetLanguage.trim().toLowerCase() === "english") {
    return {
      ok: true,
      data: {
        translated_text: transcriptChunk,
        notes: "",
        summary: "",
        glossary: [],
        keywords: [],
      },
    };
  }

  return {
    ok: true,
    data: {
      translated_text: transcriptChunk,
      notes: "",
      summary: "",
      glossary: [],
      keywords: [],
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  3. "I'm Lost" Rescue
// ═════════════════════════════════════════════════════════════════

export interface ImLostResponse {
  explanation: string;
}

export async function requestImLostExplanation(
  rollingBuffer: string,
  currentDifficulty: string,
): Promise<ApiResult<ImLostResponse>> {
  const edgeRes = await invokeFunction<ImLostResponse>("im-lost", {
    rolling_buffer: rollingBuffer,
    current_difficulty: mapDifficulty(currentDifficulty),
  });
  if (edgeRes.ok && edgeRes.data.explanation) return edgeRes;

  // Local Ollama fallback
  try {
    const prompt = `A student got lost during a lecture section: "${rollingBuffer}".
Target Difficulty: ${currentDifficulty}.
Explain this section in simple terms with a real-life analogy so the student can immediately catch up.`;

    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (ollamaRes.ok) {
      const json = await ollamaRes.json();
      const explanation = (json.response ?? "").trim();
      return {
        ok: true,
        data: {
          explanation: explanation || "Here is a quick rescue breakdown of the recent lecture section.",
        },
      };
    }
  } catch (err) {
    console.error("[ImLost] Local Ollama error:", err);
  }

  return {
    ok: false,
    error: { error: "Rescue explanation unavailable.", code: "RESCUE_UNAVAILABLE" },
  };
}

// ═════════════════════════════════════════════════════════════════
//  4. Ask AI (Streamed)
// ═════════════════════════════════════════════════════════════════

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type AskAIResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; error: ApiError };

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
  // 1. Try Edge Function
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
    if (res.ok && res.body) return { ok: true, stream: res.body };
  } catch {
    // fallback
  }

  // 2. Local Ollama streaming fallback
  try {
    const prompt = `You are EduBridge AI answering a student's question based on lecture context: "${rollingBuffer}". Question: "${question}"`;
    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: true,
      }),
    });

    if (ollamaRes.ok && ollamaRes.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const transformStream = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });
          const lines = text.split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                controller.enqueue(encoder.encode(parsed.response));
              }
            } catch {
              // skip
            }
          }
        },
      });

      return { ok: true, stream: ollamaRes.body.pipeThrough(transformStream) };
    }
  } catch (err) {
    return {
      ok: false,
      error: {
        error: err instanceof Error ? err.message : "Ollama stream error",
        code: "OLLAMA_STREAM_ERROR",
      },
    };
  }

  return {
    ok: false,
    error: {
      error: "Ask AI service unavailable.",
      code: "ASK_UNAVAILABLE",
    },
  };
}

// src/lib/api.ts
//
// EduBridge AI — API Wrappers for Supabase Edge Functions with Hybrid Local/Cloud Fallbacks
//
// PIPELINE ARCHITECTURE:
//   1. POST /stt-proxy    — Groq Whisper speech-to-text (with direct Groq API fallback)
//   2. POST /process      — Unified AI Processing (with direct local Ollama fallback)
//   3. POST /ask          — Lecture-grounded chat (with direct local Ollama streaming fallback)
//   4. POST /im-lost      — Section-specific rescue (with direct local Ollama fallback)

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

// ─── Environment & Fallbacks ──────────────────────────────────────

const RAW_URL = (import.meta.env["VITE_SUPABASE_URL"] as string) ?? "";
const SUPABASE_URL = RAW_URL.replace(/\/+$/, "");
const SUPABASE_ANON_KEY = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) ?? "";
const GROQ_API_KEY = (import.meta.env["GROQ_API_KEY"] as string) ?? "";
const OLLAMA_HOST = "http://localhost:11434";
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
//  1. POST /stt-proxy — Speech-to-Text
// ═════════════════════════════════════════════════════════════════

export interface SttResponse {
  text: string;
  chunk_id: string;
  timestamp: number;
}

/**
 * Send an audio chunk for speech-to-text transcription.
 * Tries Edge Function first, falls back directly to Groq Whisper API.
 */
export async function transcribeAudio(
  audio: Blob,
): Promise<ApiResult<SttResponse>> {
  const formData = new FormData();
  formData.append("audio", audio);

  // 1. Try Supabase Edge Function /stt-proxy
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/stt-proxy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      return { ok: true, data: json as SttResponse };
    }
  } catch {
    // Edge function unavailable, fallback to direct Groq Whisper API
  }

  // 2. Direct Groq Whisper API fallback if GROQ_API_KEY exists
  if (GROQ_API_KEY) {
    try {
      const mime = audio.type || "audio/webm";
      const ext = mime.includes("mp4") ? ".mp4" : ".webm";
      const namedFile = new File([audio], `recording${ext}`, { type: mime });

      const groqFormData = new FormData();
      groqFormData.append("file", namedFile);
      groqFormData.append("model", "whisper-large-v3-turbo");
      groqFormData.append("response_format", "json");

      const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: groqFormData,
      });

      if (groqRes.ok) {
        const groqJson = await groqRes.json();
        return {
          ok: true,
          data: {
            text: groqJson.text ?? "",
            chunk_id: crypto.randomUUID(),
            timestamp: Date.now(),
          },
        };
      }
    } catch (err) {
      return {
        ok: false,
        error: {
          error: err instanceof Error ? err.message : "Direct Groq error",
          code: "GROQ_ERROR",
        },
      };
    }
  }

  return {
    ok: false,
    error: {
      error: "STT service unavailable. Check Groq API key.",
      code: "STT_UNAVAILABLE",
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  2. POST /process — Unified AI Processing
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
 * Process a transcript chunk through local Ollama or Gemini Edge Function.
 */
export async function processTranscript(
  transcript: string,
  targetLanguage: string,
  existingSummary: string,
  existingNotes: string,
  difficulty: string,
): Promise<ApiResult<ProcessResponse>> {
  // 1. Try Supabase Edge Function /process
  const edgeRes = await invokeFunction<ProcessResponse>("process", {
    transcript,
    target_language: targetLanguage,
    existing_summary: existingSummary,
    existing_notes: existingNotes,
    difficulty: mapDifficulty(difficulty),
  });

  if (edgeRes.ok) return edgeRes;

  // 2. Direct Local Ollama Fallback (http://localhost:11434)
  try {
    const prompt = `You are an educational AI assistant processing a lecture transcript chunk.
Transcript: "${transcript}"
Target Language: ${targetLanguage}
Difficulty: ${difficulty}
Existing Summary: "${existingSummary}"

Return ONLY valid JSON with keys:
- "translated_text": string
- "notes": bullet point string
- "summary": string
- "glossary": array of { "term": string, "definition": string, "simple_explanation": string }
- "keywords": array of string keywords`;

    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
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
      const rawText = json.response ?? "";
      const braceStart = rawText.indexOf("{");
      const braceEnd = rawText.lastIndexOf("}");
      
      let parsedData: Partial<ProcessResponse> = {};
      if (braceStart !== -1 && braceEnd > braceStart) {
        try {
          parsedData = JSON.parse(rawText.slice(braceStart, braceEnd + 1));
        } catch {
          // fallback
        }
      }

      return {
        ok: true,
        data: {
          translated_text: parsedData.translated_text ?? transcript,
          notes: parsedData.notes ?? `- ${transcript}`,
          summary: parsedData.summary ?? transcript,
          glossary: parsedData.glossary ?? [],
          keywords: parsedData.keywords ?? [],
        },
      };
    }
  } catch {
    // Local Ollama unavailable
  }

  return {
    ok: false,
    error: {
      error: "AI processing unavailable. Check local Ollama or Edge Function.",
      code: "PROCESS_UNAVAILABLE",
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  3. POST /im-lost — "I'm Lost" Rescue
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

  if (edgeRes.ok) return edgeRes;

  // Direct Local Ollama Fallback
  try {
    const prompt = `A student clicked "I'm Lost". Explain this lecture transcript section simply: "${rollingBuffer}"`;
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
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
      return {
        ok: true,
        data: { explanation: json.response ?? "Simple explanation of recent content." },
      };
    }
  } catch {
    // fallback
  }

  return {
    ok: false,
    error: {
      error: "I'm Lost explanation unavailable.",
      code: "RESCUE_UNAVAILABLE",
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  4. POST /ask — Ask AI (Streamed)
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
  // 1. Try Supabase Edge Function /ask
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

    if (res.ok && res.body) {
      return { ok: true, stream: res.body };
    }
  } catch {
    // Edge function unavailable
  }

  // 2. Direct Local Ollama Streaming Fallback
  try {
    const prompt = `You are EduBridge AI answering a student's question based on lecture context: "${rollingBuffer}". Question: "${question}"`;
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
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

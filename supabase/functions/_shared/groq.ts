// supabase/functions/_shared/groq.ts
//
// EduBridge AI — Groq Whisper STT Helper for Edge Functions
//
// Provides a Deno-compatible helper to call Groq's Whisper API
// for speech-to-text transcription.
//
// DENO RUNTIME NOTE:
//   This file runs in Supabase's Deno Edge Function runtime.
//   It uses the standard Fetch API (available in Deno by default).
//
// SECURITY:
//   The API key is passed as a parameter from the calling Edge Function.
//   It must NEVER be logged, returned in responses, or hardcoded.
//
// PRIVACY — NON-NEGOTIABLE:
//   The audio File is passed in-memory only.
//   It is NEVER persisted, logged, cached, or written to storage.

// ─── Types ───────────────────────────────────────────────────────

interface GroqTranscriptionResponse {
  text: string;
}

interface GroqErrorResponse {
  error?: {
    message: string;
    type: string;
  };
}

// ─── Constants ───────────────────────────────────────────────────

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

// ─── STT Call ────────────────────────────────────────────────────

/**
 * Transcribe audio using Groq Whisper.
 *
 * @param audio - The in-memory File/Blob from the browser's MediaRecorder
 * @param apiKey - Groq API key (from Deno.env)
 * @returns The transcribed text string
 * @throws Error if the API call fails
 *
 * PRIVACY: The audio File is sent to Groq's API for processing
 * and is NEVER stored, logged, or cached by this function.
 * The File is garbage-collected when the request handler returns.
 */
export async function transcribeWithGroq(
  audio: File,
  apiKey: string,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", audio, audio.name || "audio.webm");
  formData.append("model", GROQ_MODEL);
  formData.append("response_format", "json");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // Do NOT set Content-Type — browser/Deno sets multipart boundary
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as GroqErrorResponse;
    const errorMsg =
      errorBody.error?.message ?? `Groq API error (${res.status})`;
    throw new Error(errorMsg);
  }

  const json = (await res.json()) as GroqTranscriptionResponse;

  if (!json.text) {
    throw new Error("Groq returned no transcription text.");
  }

  return json.text;
}

// supabase/functions/_shared/gemini.ts
//
// EduBridge AI — Gemini API Helper for Edge Functions
//
// Provides a Deno-compatible helper to call the Gemini REST API.
// Used by the AI Engineer to integrate model calls inside Edge Functions.
//
// DENO RUNTIME NOTE:
//   This file runs in Supabase's Deno Edge Function runtime.
//   It uses the standard Fetch API (available in Deno by default).
//   It must NOT import from src/ai/* or any Vite-bundled module.
//
// SECURITY:
//   The API key is passed as a parameter from the calling Edge Function,
//   which reads it from Deno.env.get("GEMINI_API_KEY").
//   The key must NEVER be logged, returned in responses, or hardcoded.

// ─── Types ───────────────────────────────────────────────────────

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiRequestBody {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

interface GeminiCandidate {
  content: {
    parts: { text: string }[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; code: number };
}

// ─── Constants ───────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";


// ─── Non-Streaming Call ──────────────────────────────────────────

/**
 * Call Gemini and return the full text response.
 * Used by most Edge Functions (translate, terms, notes, etc.).
 *
 * @param prompt - The user prompt text
 * @param apiKey - Gemini API key (from Deno.env)
 * @param options - Optional generation config overrides
 * @returns The generated text string
 * @throws Error if the API call fails or returns no content
 */
export async function callGemini(
  prompt: string,
  apiKey: string,
  options?: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  },
): Promise<string> {
  const messages: GeminiMessage[] = [];

  if (options?.systemInstruction) {
    messages.push({
      role: "user",
      parts: [{ text: options.systemInstruction }],
    });
    messages.push({
      role: "model",
      parts: [{ text: "Understood. I will follow these instructions." }],
    });
  }

  messages.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const body: GeminiRequestBody = {
    contents: messages,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    },
  };

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as GeminiResponse;

  if (json.error) {
    throw new Error(`Gemini API error: ${json.error.message}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no content.");
  }

  return text;
}

// ─── Streaming Call ──────────────────────────────────────────────

/**
 * Call Gemini and return a ReadableStream of text chunks.
 * Used by /ask for streamed responses.
 *
 * @param prompt - The user prompt text
 * @param apiKey - Gemini API key (from Deno.env)
 * @param options - Optional generation config overrides
 * @returns A ReadableStream<Uint8Array> suitable for Response body
 * @throws Error if the initial API call fails
 */
export async function streamGemini(
  prompt: string,
  apiKey: string,
  options?: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  },
): Promise<ReadableStream<Uint8Array>> {
  const messages: GeminiMessage[] = [];

  if (options?.systemInstruction) {
    messages.push({
      role: "user",
      parts: [{ text: options.systemInstruction }],
    });
    messages.push({
      role: "model",
      parts: [{ text: "Understood. I will follow these instructions." }],
    });
  }

  messages.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const body: GeminiRequestBody = {
    contents: messages,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    },
  };

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini streaming API error (${res.status}): ${errorText}`);
  }

  if (!res.body) {
    throw new Error("Gemini streaming returned no body.");
  }

  // Transform the SSE stream into plain text chunks
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      // Gemini SSE format: "data: {json}\n\n"
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.slice(6));
            const part = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (part) {
              controller.enqueue(encoder.encode(part));
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    },
  });

  return res.body.pipeThrough(transformStream);
}

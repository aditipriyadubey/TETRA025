// supabase/functions/_shared/groq_chat.ts
//
// EduBridge AI — Groq Chat API Helper for Edge Functions
//
// Provides Deno-compatible non-streaming and streaming helpers to call
// Groq's OpenAI-compatible Chat API (https://api.groq.com/openai/v1/chat/completions).
// Replaces Gemini completely across all Edge Functions.
//
// MODEL: llama-3.3-70b-versatile (default)
// SECURITY: API key read from GROQ_API_KEY environment secret.

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * Call Groq Chat API and return full text response (non-streaming).
 */
export async function callGroqChat(
  prompt: string,
  apiKey: string,
  options?: GroqChatOptions,
): Promise<string> {
  const messages: GroqMessage[] = [];

  if (options?.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const body = {
    model: options?.model ?? DEFAULT_MODEL,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxOutputTokens ?? 4096,
    stream: false,
  };

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq Chat API error (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq Chat API returned no content choices.");
  }

  return content;
}

/**
 * Call Groq Chat API and return a ReadableStream of plain text chunks (streaming).
 */
export async function streamGroqChat(
  prompt: string,
  apiKey: string,
  options?: GroqChatOptions,
): Promise<ReadableStream<Uint8Array>> {
  const messages: GroqMessage[] = [];

  if (options?.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const body = {
    model: options?.model ?? DEFAULT_MODEL,
    messages,
    temperature: options?.temperature ?? 0.5,
    max_tokens: options?.maxOutputTokens ?? 2048,
    stream: true,
  };

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq Chat streaming error (${res.status}): ${errorText}`);
  }

  if (!res.body) {
    throw new Error("Groq Chat streaming returned empty response body.");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            const deltaContent = parsed?.choices?.[0]?.delta?.content;
            if (deltaContent) {
              controller.enqueue(encoder.encode(deltaContent));
            }
          } catch {
            // Skip invalid JSON lines in SSE stream
          }
        }
      }
    },
  });

  return res.body.pipeThrough(transformStream);
}

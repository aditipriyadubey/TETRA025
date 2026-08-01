// supabase/functions/_shared/ollama.ts
//
// EduBridge AI — Direct Native Local Ollama Helper (0 Docker Required)
//
// Connects directly to native Windows Ollama running on http://localhost:11434
// Works in Deno, Node, and browser runtimes without requiring Docker.

const OLLAMA_HOST = "http://localhost:11434";
const OLLAMA_MODEL = "llama3.1";

interface OllamaOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callGemini(
  prompt: string,
  _unusedKey: string,
  options?: OllamaOptions,
): Promise<string> {
  const fullPrompt = options?.systemInstruction
    ? `${options.systemInstruction}\n\n${prompt}`
    : prompt;

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Ollama returned error (${res.status}): ${errText}. Is Ollama running on ${OLLAMA_HOST}?`,
    );
  }

  const json = (await res.json()) as { response?: string };

  if (!json.response) {
    throw new Error(`Ollama returned no content for model "${OLLAMA_MODEL}".`);
  }

  return json.response;
}

export async function streamGemini(
  prompt: string,
  _unusedKey: string,
  options?: OllamaOptions,
): Promise<ReadableStream<Uint8Array>> {
  const fullPrompt = options?.systemInstruction
    ? `${options.systemInstruction}\n\n${prompt}`
    : prompt;

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(
      `Ollama streaming failed (${res.status}). Is Ollama running on ${OLLAMA_HOST}?`,
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as { response?: string };
          if (parsed.response) {
            controller.enqueue(encoder.encode(parsed.response));
          }
        } catch {
          // skip incomplete JSON chunks
        }
      }
    },
  });

  return res.body.pipeThrough(transformStream);
}

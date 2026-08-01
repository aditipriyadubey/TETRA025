// supabase/functions/_shared/ollama.ts
//
// EduBridge AI — Local Ollama Helper (drop-in replacement for gemini.ts)
//
// Uses Supabase Edge Runtime's BUILT-IN Supabase.ai.Session API, which
// natively supports a self-managed Ollama server. No manual fetch/CORS
// handling needed — the runtime does it for you.
// Docs: https://supabase.com/docs/guides/functions/ai-models
//
// HOW THE SERVER ADDRESS IS RESOLVED:
//   Supabase.ai.Session reads the `AI_INFERENCE_API_HOST` secret
//   automatically. You do NOT pass a URL in code.
//
// LOCAL DEV SETUP:
//   1. ollama pull llama3.1        (or mistral, gemma2, etc.)
//   2. ollama serve                (usually already running in the background)
//   3. Add AI_INFERENCE_API_HOST=http://host.docker.internal:11434 to .env.local
//      -> On native Linux Docker, if host.docker.internal doesn't resolve,
//         use your docker0 bridge IP instead (commonly http://172.17.0.1:11434).
//   4. supabase functions serve --env-file .env.local
//
// PRODUCTION (only if you deploy your own Ollama/Llamafile server somewhere
// publicly reachable — your laptop being asleep is not a production server):
//   supabase secrets set AI_INFERENCE_API_HOST=https://your-ollama-host/
//   supabase functions deploy
//
// IMPORTANT: this file only works when invoked inside a Supabase Edge
// Function (Deno runtime with the `Supabase` global injected). It will not
// run in a plain Node/browser context.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Must exactly match a model you've pulled locally (`ollama list` to check).
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
  const session = new Supabase.ai.Session(OLLAMA_MODEL);

  const fullPrompt = options?.systemInstruction
    ? `${options.systemInstruction}\n\n${prompt}`
    : prompt;

  const output = (await session.run(fullPrompt, {
    stream: false,
    timeout: 60,
  })) as { response?: string };

  if (!output?.response) {
    throw new Error(
      "Ollama returned no content. Is `ollama serve` running and is " +
        `"${OLLAMA_MODEL}" pulled? Check AI_INFERENCE_API_HOST too.`,
    );
  }

  return output.response;
}

export async function streamGemini(
  prompt: string,
  _unusedKey: string,
  options?: OllamaOptions,
): Promise<ReadableStream<Uint8Array>> {
  const session = new Supabase.ai.Session(OLLAMA_MODEL);

  const fullPrompt = options?.systemInstruction
    ? `${options.systemInstruction}\n\n${prompt}`
    : prompt;

  const output = (await session.run(fullPrompt, {
    stream: true,
  })) as AsyncIterable<{ response?: string }>;

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of output) {
          if (chunk.response) controller.enqueue(encoder.encode(chunk.response));
        }
      } catch (err) {
        console.error("Ollama stream error:", err);
      } finally {
        controller.close();
      }
    },
  });
}

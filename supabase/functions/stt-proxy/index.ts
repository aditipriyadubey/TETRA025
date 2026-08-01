// supabase/functions/stt-proxy/index.ts
//
// EduBridge AI — Speech-to-Text Proxy Edge Function
//
// Accepts a browser-recorded audio chunk (multipart/form-data),
// validates it, and forwards it to Groq Whisper for transcription.
//
// PRIVACY — NON-NEGOTIABLE:
//   Audio exists ONLY in memory for the duration of this request.
//   It is NEVER persisted to database, storage, disk, cache, or logs.
//   The audio File is automatically garbage-collected when the
//   request handler returns.

// ─── Response Types ──────────────────────────────────────────────

interface SttSuccessResponse {
  text: string;
  chunk_id: string;
  timestamp: number;
}

interface SttErrorResponse {
  error: string;
  code: string;
}

// ─── CORS Configuration ─────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

function jsonResponse(
  status: number,
  body: SttSuccessResponse | SttErrorResponse,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

// ─── MIME → Extension Map ────────────────────────────────────────
// Groq Whisper requires a filename with a recognized audio extension.
// Without it, the API cannot determine the format and returns an error.

function getExtensionForMime(mime: string): string {
  const map: Record<string, string> = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".mp4",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/flac": ".flac",
    "audio/x-m4a": ".m4a",
    "audio/m4a": ".m4a",
    "video/webm": ".webm",
    "video/mp4": ".mp4",
  };
  // Strip codec params: "audio/webm; codecs=opus" → "audio/webm"
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  return map[base] ?? ".webm"; // Default to .webm (browser MediaRecorder default)
}

// ─── Request Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // ── 1. CORS preflight ────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── 2. Method guard ──────────────────────────────────────────
  if (req.method !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed. Use POST.",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  // ── 3. Content-Type guard ────────────────────────────────────
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonResponse(400, {
      error: "Content-Type must be multipart/form-data.",
      code: "INVALID_CONTENT_TYPE",
    });
  }

  // ── 4. Parse multipart form data ─────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (_err) {
    return jsonResponse(400, {
      error: "Failed to parse multipart form data.",
      code: "FORM_PARSE_ERROR",
    });
  }

  // ── 5. Validate "audio" field exists ─────────────────────────
  const audio = formData.get("audio");

  if (!audio) {
    return jsonResponse(400, {
      error: 'Missing required form field: "audio".',
      code: "MISSING_AUDIO_FIELD",
    });
  }

  // ── 6. Validate "audio" is a File/Blob upload ────────────────
  if (!(audio instanceof File)) {
    return jsonResponse(400, {
      error: '"audio" field must be a File/Blob upload, not a text value.',
      code: "INVALID_AUDIO_FIELD",
    });
  }

  // ── 7. Validate file is not empty ────────────────────────────
  if (audio.size === 0) {
    return jsonResponse(400, {
      error: "Audio file is empty (0 bytes).",
      code: "EMPTY_AUDIO",
    });
  }

  // ── 8. Prepare server-side identifiers ───────────────────────
  const chunkId = crypto.randomUUID();
  const timestamp = Date.now();

  // ── 9. Get API key ───────────────────────────────────────────
  const groqApiKey = Deno.env.get("GROQ_API_KEY");

  if (!groqApiKey) {
    return jsonResponse(500, {
      error: "GROQ_API_KEY is not configured.",
      code: "MISSING_API_KEY",
    });
  }

  // ── 10. Call Groq Whisper (with full error handling) ──────────
  try {
    const transcribedText = await callGroqWhisper(audio, groqApiKey);

    return jsonResponse(200, {
      text: transcribedText,
      chunk_id: chunkId,
      timestamp,
    } satisfies SttSuccessResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown STT error";
    console.error("stt-proxy error:", message);

    return jsonResponse(500, {
      error: message,
      code: "STT_ERROR",
    });
  }
});

// ─── Groq Whisper Integration ────────────────────────────────────

async function callGroqWhisper(
  audio: File,
  apiKey: string,
): Promise<string> {
  // FIX: Groq Whisper requires a filename with a recognized audio extension.
  // Browser MediaRecorder sends blobs with name "blob" (no extension).
  // Without a proper extension, Groq cannot determine the audio format
  // and returns 400 or 500.
  const mime = audio.type || "audio/webm";
  const ext = getExtensionForMime(mime);
  const fileName = `recording${ext}`;

  // Read the raw bytes and create a new File with the correct name + type
  const audioBytes = await audio.arrayBuffer();
  const namedFile = new File([audioBytes], fileName, { type: mime });

  const formData = new FormData();
  formData.append("file", namedFile, fileName);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "json");

  const response = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq Whisper error response:", response.status, errorText);
    throw new Error(
      `Groq Whisper ${response.status}: ${errorText.slice(0, 300)}`,
    );
  }

  const data = await response.json();
  return data.text ?? "";
}

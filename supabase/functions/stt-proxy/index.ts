// supabase/functions/stt-proxy/index.ts
//
// EduBridge AI — Speech-to-Text Proxy Edge Function (Scaffold)
//
// Accepts a browser-recorded audio chunk (multipart/form-data),
// validates it, and will forward it to the AI Engineer's Groq
// Whisper integration point.
//
// PRIVACY — NON-NEGOTIABLE:
//   Audio exists ONLY in memory for the duration of this request.
//   It is NEVER persisted to database, storage, disk, cache, or logs.
//   The audio File is automatically garbage-collected when the
//   request handler returns.

// ─── Response Types ──────────────────────────────────────────────

/**
 * Successful STT response — contract from Section 9.3.
 *
 * {
 *   text:      string   — transcribed text from the audio chunk
 *   chunk_id:  string   — server-generated UUID for this chunk
 *   timestamp: number   — server processing timestamp in ms (Date.now())
 * }
 */
interface SttSuccessResponse {
  text: string;
  chunk_id: string;
  timestamp: number;
}

/**
 * Consistent error response shape used by all error paths.
 */
interface SttErrorResponse {
  error: string;
  code: string;
}

// ─── CORS Configuration ─────────────────────────────────────────
// Allows browser-based clients to call this Edge Function directly.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

/** Build a JSON response with CORS headers attached. */
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

// ─── Request Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // ── 1. CORS preflight ────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── 2. Method guard — POST only ──────────────────────────────
  if (req.method !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed. Use POST.",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  // ── 3. Content-Type guard — multipart/form-data ──────────────
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

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Forward the in-memory `audio` File to Groq Whisper here.
  //
  //  The `audio` variable is a standard Web API File object
  //  containing the browser-recorded chunk (typically WebM/Opus,
  //  3–5 seconds from MediaRecorder).
  //
  //  Available variables:
  //    audio     — File object (in memory only)
  //    chunkId   — pre-generated UUID for this chunk
  //    timestamp — server timestamp in milliseconds
  //
  //  Expected usage:
  //
  //    const groqApiKey = Deno.env.get("GROQ_API_KEY");
  //    if (!groqApiKey) {
  //      return jsonResponse(500, {
  //        error: "GROQ_API_KEY is not configured.",
  //        code: "MISSING_API_KEY",
  //      });
  //    }
  //
  //    const transcribedText = await callGroqWhisper(audio, groqApiKey);
  //
  //    return jsonResponse(200, {
  //      text: transcribedText,
  //      chunk_id: chunkId,
  //      timestamp,
  //    } satisfies SttSuccessResponse);
  //
  //  PRIVACY RULES — NON-NEGOTIABLE:
  //    • Do NOT persist or log the audio.
  //    • Do NOT write audio to database, storage, or disk.
  //    • Do NOT include audio content in error messages.
  //    • The audio File is automatically garbage-collected
  //      when this request handler returns.
  //
  // ════════════════════════════════════════════════════════════════

  // Development placeholder — remove once Groq integration is live.
  void audio; // Explicitly acknowledge the variable to avoid lint warnings.

  return jsonResponse(501, {
    error:
      "Speech-to-text integration is not yet implemented. " +
      "The AI Engineer must connect Groq Whisper at the marked " +
      "integration point in supabase/functions/stt-proxy/index.ts.",
    code: "STT_NOT_IMPLEMENTED",
  });
});

// supabase/functions/translate/index.ts
//
// EduBridge AI — Translation Edge Function (Scaffold)
//
// Accepts a finalized transcript chunk and a target language.
// Returns the translated text.
//
// IMPORTANT:
//   Translation does NOT change based on the Difficulty Slider.
//   Difficulty controls the explanation layer, not raw translation.
//   This endpoint has no difficulty parameter by design.

// ─── Request / Response Types ────────────────────────────────────

interface TranslateRequest {
  text: string;
  target_language: string;
}

/** Successful response — Developer 3 contract. */
interface TranslateSuccessResponse {
  translated_text: string;
}

/** Consistent error response shape. */
interface TranslateErrorResponse {
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
  body: TranslateSuccessResponse | TranslateErrorResponse,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Request Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // ── 1. CORS preflight ──────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── 2. Method guard ────────────────────────────────────────
  if (req.method !== "POST") {
    return jsonResponse(405, {
      error: "Method not allowed. Use POST.",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  // ── 3. Content-Type guard ──────────────────────────────────
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(400, {
      error: "Content-Type must be application/json.",
      code: "INVALID_CONTENT_TYPE",
    });
  }

  // ── 4. Parse JSON body ─────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch (_err) {
    return jsonResponse(400, {
      error: "Failed to parse JSON request body.",
      code: "JSON_PARSE_ERROR",
    });
  }

  const { text, target_language } = body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof text !== "string" || text.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "text".',
      code: "INVALID_TEXT",
    });
  }

  if (typeof target_language !== "string" || target_language.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "target_language".',
      code: "INVALID_TARGET_LANGUAGE",
    });
  }

  // ── 6. Validated request ───────────────────────────────────
  const validatedRequest: TranslateRequest = {
    text: text as string,
    target_language: target_language as string,
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Translate `text` into `target_language` using Gemini 2.5 Flash.
  //
  //  Available:
  //    validatedRequest.text             — finalized transcript chunk
  //    validatedRequest.target_language  — target language code/name
  //
  //  Expected usage:
  //
  //    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  //    if (!geminiApiKey) {
  //      return jsonResponse(500, {
  //        error: "GEMINI_API_KEY is not configured.",
  //        code: "MISSING_API_KEY",
  //      });
  //    }
  //
  //    const translatedText = await translateWithGemini(
  //      validatedRequest.text,
  //      validatedRequest.target_language,
  //      geminiApiKey,
  //    );
  //
  //    return jsonResponse(200, {
  //      translated_text: translatedText,
  //    } satisfies TranslateSuccessResponse);
  //
  //  IMPORTANT:
  //    • This is a raw translation — no difficulty adjustment.
  //    • Do NOT expose the API key in responses or logs.
  //    • Do NOT write to the database from this function.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  return jsonResponse(501, {
    error:
      "Translation is not yet implemented. " +
      "The AI Engineer must connect Gemini 2.5 Flash at the marked " +
      "integration point in supabase/functions/translate/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

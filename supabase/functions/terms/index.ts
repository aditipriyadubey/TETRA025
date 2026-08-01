// supabase/functions/terms/index.ts
//
// EduBridge AI — Technical Term Extraction Edge Function (Scaffold)
//
// Accepts a finalized transcript chunk and returns the technical
// terms found within it, with exact character positions.

// ─── Request / Response Types ────────────────────────────────────

interface TermsRequest {
  text: string;
}

/**
 * A single extracted technical term with character-level positions
 * within the source text.  Shape specified by the SRD.
 */
interface TechnicalTerm {
  term: string;
  start_index: number;
  end_index: number;
}

/** Successful response — Developer 3 contract. */
interface TermsSuccessResponse {
  terms: TechnicalTerm[];
}

/** Consistent error response shape. */
interface TermsErrorResponse {
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
  body: TermsSuccessResponse | TermsErrorResponse,
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

  const { text } = body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof text !== "string" || text.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "text".',
      code: "INVALID_TEXT",
    });
  }

  // ── 6. Validated request ───────────────────────────────────
  const validatedRequest: TermsRequest = {
    text: text as string,
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Use Gemini to extract technical terms and return exact
  //  character positions within the supplied transcript chunk.
  //
  //  Available:
  //    validatedRequest.text — finalized transcript chunk
  //
  //  Expected return shape:
  //
  //    TechnicalTerm {
  //      term:        string  — the extracted term
  //      start_index: number  — character offset in `text` (0-based)
  //      end_index:   number  — character offset (exclusive)
  //    }
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
  //    const extractedTerms = await extractTermsWithGemini(
  //      validatedRequest.text, geminiApiKey
  //    );
  //
  //    return jsonResponse(200, {
  //      terms: extractedTerms,
  //    } satisfies TermsSuccessResponse);
  //
  //  IMPORTANT:
  //    • start_index and end_index must be exact character positions
  //      within the original `text` string.
  //    • Do NOT fabricate term spans.
  //    • Do NOT expose the API key in responses or logs.
  //    • Do NOT write to the database from this function.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  return jsonResponse(501, {
    error:
      "Technical term extraction is not yet implemented. " +
      "The AI Engineer must connect Gemini at the marked " +
      "integration point in supabase/functions/terms/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

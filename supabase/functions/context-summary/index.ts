// supabase/functions/context-summary/index.ts
//
// EduBridge AI — Context Summary Edge Function (Scaffold)
//
// Every 2–3 minutes the application folds NEW lecture content into
// the EXISTING running summary.
//
// IMPORTANT:
//   This must NOT re-summarize the entire lecture from scratch.
//   It must FOLD new content into the existing summary to keep
//   the result compact and incremental.

// ─── Request / Response Types ────────────────────────────────────

interface ContextSummaryRequest {
  existing_summary: string;
  new_transcript: string;
}

/** Successful response — Developer 3 contract. */
interface ContextSummarySuccessResponse {
  running_summary: string;
}

/** Consistent error response shape. */
interface ContextSummaryErrorResponse {
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
  body: ContextSummarySuccessResponse | ContextSummaryErrorResponse,
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

  const { existing_summary, new_transcript } =
    body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  // existing_summary: string (empty string is valid for the
  // first summary cycle when no summary exists yet).
  if (typeof existing_summary !== "string") {
    return jsonResponse(400, {
      error:
        'Missing or invalid required field: "existing_summary". ' +
        "Must be a string (empty string is valid for the first cycle).",
      code: "INVALID_EXISTING_SUMMARY",
    });
  }

  if (typeof new_transcript !== "string" || new_transcript.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "new_transcript".',
      code: "INVALID_NEW_TRANSCRIPT",
    });
  }

  // ── 6. Validated request ───────────────────────────────────
  const validatedRequest: ContextSummaryRequest = {
    existing_summary: existing_summary as string,
    new_transcript: new_transcript as string,
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Fold new_transcript into existing_summary using
  //  Gemini 2.5 Flash, keeping the resulting running summary
  //  compact.
  //
  //  Available:
  //    validatedRequest.existing_summary — accumulated summary so far
  //                                        (empty string on first call)
  //    validatedRequest.new_transcript   — latest transcript segment
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
  //    const updatedSummary = await foldSummaryWithGemini(
  //      validatedRequest.existing_summary,
  //      validatedRequest.new_transcript,
  //      geminiApiKey,
  //    );
  //
  //    return jsonResponse(200, {
  //      running_summary: updatedSummary,
  //    } satisfies ContextSummarySuccessResponse);
  //
  //  IMPORTANT:
  //    • FOLD new content into the existing summary — do NOT
  //      re-summarize the entire lecture from scratch.
  //    • Keep the summary compact (paragraph-length, not full
  //      transcript length).
  //    • Do NOT expose the API key in responses or logs.
  //    • Do NOT write to the database from this function.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  return jsonResponse(501, {
    error:
      "Context summary is not yet implemented. " +
      "The AI Engineer must connect Gemini 2.5 Flash at the marked " +
      "integration point in supabase/functions/context-summary/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

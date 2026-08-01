// supabase/functions/im-lost/index.ts
//
// EduBridge AI — "I'm Lost" Rescue Edge Function (Scaffold)
//
// Accepts the rolling transcript buffer and the student's current
// difficulty level.  Returns a simplified explanation to help the
// student catch up.
//
// IMPORTANT (Section 5.5):
//   The difficulty must eventually be auto-stepped-down SERVER-SIDE
//   before generating the explanation.  This ensures the rescue
//   explanation is always simpler than the student's current level.
//   This logic belongs to the AI Engineer.

// ─── Shared Types ────────────────────────────────────────────────

type Difficulty = "child" | "high_school" | "college" | "expert";

// ─── Request / Response Types ────────────────────────────────────

interface ImLostRequest {
  rolling_buffer: string;
  current_difficulty: Difficulty;
}

/** Successful response — Section 9.3 contract. */
interface ImLostSuccessResponse {
  explanation: string;
}

/** Consistent error response shape. */
interface ImLostErrorResponse {
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
  body: ImLostSuccessResponse | ImLostErrorResponse,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Validation Helpers ──────────────────────────────────────────

const VALID_DIFFICULTIES: ReadonlySet<string> = new Set<Difficulty>([
  "child",
  "high_school",
  "college",
  "expert",
]);

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

  const { rolling_buffer, current_difficulty } =
    body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof rolling_buffer !== "string") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "rolling_buffer".',
      code: "INVALID_ROLLING_BUFFER",
    });
  }

  if (
    typeof current_difficulty !== "string" ||
    !VALID_DIFFICULTIES.has(current_difficulty)
  ) {
    return jsonResponse(400, {
      error: `"current_difficulty" must be one of: ${[...VALID_DIFFICULTIES].join(", ")}.`,
      code: "INVALID_DIFFICULTY",
    });
  }

  // ── 6. Validated request ───────────────────────────────────
  const validatedRequest: ImLostRequest = {
    rolling_buffer: rolling_buffer as string,
    current_difficulty: current_difficulty as Difficulty,
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Generate "I'm Lost" rescue explanation using Gemini here.
  //
  //  Available:
  //    validatedRequest.rolling_buffer       — recent transcript text
  //    validatedRequest.current_difficulty   — student's current level
  //
  //  IMPORTANT — Section 5.5 Difficulty Step-Down:
  //    The difficulty must be AUTO-STEPPED-DOWN server-side before
  //    generating the explanation.  For example:
  //      expert       → college
  //      college      → high_school
  //      high_school  → child
  //      child        → child  (already at lowest)
  //
  //    This ensures the rescue explanation is always simpler than
  //    the student's current level.  Implement this mapping here
  //    before calling Gemini.
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
  //    const steppedDownDifficulty = stepDownDifficulty(
  //      validatedRequest.current_difficulty
  //    );
  //
  //    const explanation = await generateRescueExplanation(
  //      validatedRequest.rolling_buffer,
  //      steppedDownDifficulty,
  //      geminiApiKey,
  //    );
  //
  //    return jsonResponse(200, {
  //      explanation,
  //    } satisfies ImLostSuccessResponse);
  //
  //  IMPORTANT:
  //    • Do NOT expose the API key in responses or logs.
  //    • Do NOT write to the database from this function.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  return jsonResponse(501, {
    error:
      "I'm Lost rescue is not yet implemented. " +
      "The AI Engineer must connect Gemini (with Section 5.5 " +
      "difficulty step-down) at the marked integration point " +
      "in supabase/functions/im-lost/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

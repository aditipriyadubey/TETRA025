// supabase/functions/notes/index.ts
//
// EduBridge AI — Notes Generation Edge Function (Scaffold)
//
// Accepts the current transcript chunk and existing notes,
// returns ONLY the newly generated note bullets (notes_delta).
// The client appends notes_delta to its existing notes state.
//
// This keeps responses small and streaming-friendly.

// ─── Shared Types ────────────────────────────────────────────────

/** Difficulty levels used across the project. */
type Difficulty = "child" | "high_school" | "college" | "expert";

// ─── Request / Response Types ────────────────────────────────────

interface NotesRequest {
  session_id: string;
  new_transcript: string;
  existing_notes: string;
  difficulty: Difficulty;
}

/**
 * Successful response — Section 9.3 contract.
 *
 * Returns ONLY the newly generated bullets, not the entire
 * notes document.  The client appends this to existing notes.
 */
interface NotesSuccessResponse {
  notes_delta: string;
}

/** Consistent error response shape. */
interface NotesErrorResponse {
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
  body: NotesSuccessResponse | NotesErrorResponse,
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

  const { session_id, new_transcript, existing_notes, difficulty } =
    body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof session_id !== "string" || session_id.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "session_id".',
      code: "INVALID_SESSION_ID",
    });
  }

  if (typeof new_transcript !== "string") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "new_transcript".',
      code: "INVALID_NEW_TRANSCRIPT",
    });
  }

  if (typeof existing_notes !== "string") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "existing_notes".',
      code: "INVALID_EXISTING_NOTES",
    });
  }

  if (
    typeof difficulty !== "string" ||
    !VALID_DIFFICULTIES.has(difficulty)
  ) {
    return jsonResponse(400, {
      error: `"difficulty" must be one of: ${[...VALID_DIFFICULTIES].join(", ")}.`,
      code: "INVALID_DIFFICULTY",
    });
  }

  // ── 6. Validated request ───────────────────────────────────
  const validatedRequest: NotesRequest = {
    session_id: session_id as string,
    new_transcript: new_transcript as string,
    existing_notes: existing_notes as string,
    difficulty: difficulty as Difficulty,
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Generate the notes delta using Gemini here.
  //
  //  Available:
  //    validatedRequest.session_id      — current session
  //    validatedRequest.new_transcript  — latest transcript text
  //    validatedRequest.existing_notes  — notes accumulated so far
  //    validatedRequest.difficulty      — student difficulty level
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
  //    const notesDelta = await generateNotesDelta(
  //      validatedRequest, geminiApiKey
  //    );
  //
  //    return jsonResponse(200, {
  //      notes_delta: notesDelta,
  //    } satisfies NotesSuccessResponse);
  //
  //  IMPORTANT:
  //    • Return ONLY the new bullets, not the full document.
  //    • Do NOT write to the database — the client/API layer
  //      handles persistence based on persistence_mode.
  //    • Do NOT expose the API key in responses or logs.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  return jsonResponse(501, {
    error:
      "Notes generation is not yet implemented. " +
      "The AI Engineer must connect Gemini at the marked " +
      "integration point in supabase/functions/notes/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

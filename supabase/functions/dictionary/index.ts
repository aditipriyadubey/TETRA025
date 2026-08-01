// supabase/functions/dictionary/index.ts
//
// EduBridge AI — Dictionary Lookup Edge Function (Scaffold)
//
// Accepts a technical term with its sentence context, difficulty
// level, and target language.  Returns definition, pronunciation,
// translation, simple explanation, and analogy.

// ─── Shared Types ────────────────────────────────────────────────

type Difficulty = "child" | "high_school" | "college" | "expert";

// ─── Request / Response Types ────────────────────────────────────

interface DictionaryRequest {
  term: string;
  sentence_context: string;
  difficulty: Difficulty;
  target_language: string;
}

/**
 * Successful response — Section 9.3 contract.
 * All fields are strings.
 */
interface DictionarySuccessResponse {
  definition: string;
  pronunciation_ipa: string;
  translation: string;
  simple_explanation: string;
  analogy: string;
}

/** Consistent error response shape. */
interface DictionaryErrorResponse {
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
  body: DictionarySuccessResponse | DictionaryErrorResponse,
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

  const { term, sentence_context, difficulty, target_language } =
    body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof term !== "string" || term.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "term".',
      code: "INVALID_TERM",
    });
  }

  if (typeof sentence_context !== "string") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "sentence_context".',
      code: "INVALID_SENTENCE_CONTEXT",
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

  if (typeof target_language !== "string" || target_language.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "target_language".',
      code: "INVALID_TARGET_LANGUAGE",
    });
  }

  // ── 6. Validated request ───────────────────────────────────
  const validatedRequest: DictionaryRequest = {
    term: term as string,
    sentence_context: sentence_context as string,
    difficulty: difficulty as Difficulty,
    target_language: target_language as string,
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Generate dictionary entry using Gemini here.
  //
  //  Available:
  //    validatedRequest.term             — the technical term
  //    validatedRequest.sentence_context — sentence where term appeared
  //    validatedRequest.difficulty       — student difficulty level
  //    validatedRequest.target_language  — language for translation
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
  //    const entry = await generateDictionaryEntry(
  //      validatedRequest, geminiApiKey
  //    );
  //
  //    return jsonResponse(200, {
  //      definition: entry.definition,
  //      pronunciation_ipa: entry.pronunciation_ipa,
  //      translation: entry.translation,
  //      simple_explanation: entry.simple_explanation,
  //      analogy: entry.analogy,
  //    } satisfies DictionarySuccessResponse);
  //
  //  IMPORTANT:
  //    • Do NOT write to the vocabulary table — the client/API
  //      layer handles persistence based on persistence_mode.
  //    • Do NOT expose the API key in responses or logs.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  return jsonResponse(501, {
    error:
      "Dictionary lookup is not yet implemented. " +
      "The AI Engineer must connect Gemini at the marked " +
      "integration point in supabase/functions/dictionary/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

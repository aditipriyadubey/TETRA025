// supabase/functions/finish/index.ts
//
// EduBridge AI — Session Finish Edge Function (Scaffold)
//
// Called at end-of-lecture to generate a structured summary and
// a personalized quiz (5–8 questions) weighted toward the
// student's friction points.
//
// Quiz contains a mix of MCQ and short-answer questions with
// immediate feedback (correct_answer + explanation per question).

// ─── Shared Types ────────────────────────────────────────────────

/**
 * Quiz question — Developer 3 implementation contract.
 *
 * Discriminated union supporting both MCQ and short-answer,
 * with explanation for immediate feedback as required by the SRD.
 */
type QuizQuestion =
  | {
      type: "mcq";
      question: string;
      options: string[];
      correct_answer: string;
      explanation: string;
    }
  | {
      type: "short_answer";
      question: string;
      correct_answer: string;
      explanation: string;
    };

// ─── Request / Response Types ────────────────────────────────────

interface FrictionPoints {
  dictionary_terms_clicked: string[];
  im_lost_timestamps: number[];
}

interface FinishRequest {
  session_id: string;
  full_transcript: string;
  running_summary: string;
  friction_points: FrictionPoints;
}

/**
 * Successful response — Developer 3 contract.
 *
 * summary: structured end-of-lecture summary
 * quiz:    5–8 QuizQuestion objects weighted toward friction points
 */
interface FinishSuccessResponse {
  summary: string;
  quiz: QuizQuestion[];
}

/** Consistent error response shape. */
interface FinishErrorResponse {
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
  body: FinishSuccessResponse | FinishErrorResponse,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Validation Helpers ──────────────────────────────────────────

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "number")
  );
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

  const {
    session_id,
    full_transcript,
    running_summary,
    friction_points,
  } = body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof session_id !== "string" || session_id.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "session_id".',
      code: "INVALID_SESSION_ID",
    });
  }

  if (typeof full_transcript !== "string" || full_transcript.trim() === "") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "full_transcript".',
      code: "INVALID_FULL_TRANSCRIPT",
    });
  }

  if (typeof running_summary !== "string") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "running_summary".',
      code: "INVALID_RUNNING_SUMMARY",
    });
  }

  // ── 6. Validate friction_points (nested object) ────────────

  if (typeof friction_points !== "object" || friction_points === null) {
    return jsonResponse(400, {
      error: '"friction_points" must be an object with "dictionary_terms_clicked" and "im_lost_timestamps".',
      code: "INVALID_FRICTION_POINTS",
    });
  }

  const fp = friction_points as Record<string, unknown>;

  if (!isStringArray(fp.dictionary_terms_clicked)) {
    return jsonResponse(400, {
      error: '"friction_points.dictionary_terms_clicked" must be an array of strings.',
      code: "INVALID_DICTIONARY_TERMS_CLICKED",
    });
  }

  if (!isNumberArray(fp.im_lost_timestamps)) {
    return jsonResponse(400, {
      error: '"friction_points.im_lost_timestamps" must be an array of numbers.',
      code: "INVALID_IM_LOST_TIMESTAMPS",
    });
  }

  // ── 7. Validated request ───────────────────────────────────
  const validatedRequest: FinishRequest = {
    session_id: session_id as string,
    full_transcript: full_transcript as string,
    running_summary: running_summary as string,
    friction_points: {
      dictionary_terms_clicked: fp.dictionary_terms_clicked as string[],
      im_lost_timestamps: fp.im_lost_timestamps as number[],
    },
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Generate end-of-lecture content using Gemini:
  //
  //    1. Structured summary of the full lecture
  //    2. 5–8 personalized QuizQuestion objects
  //       (mix of MCQ + short_answer)
  //       weighted toward the student's friction points
  //
  //  Available:
  //    validatedRequest.session_id       — session identifier
  //    validatedRequest.full_transcript  — complete lecture transcript
  //    validatedRequest.running_summary  — accumulated summary
  //    validatedRequest.friction_points
  //      .dictionary_terms_clicked       — terms the student looked up
  //      .im_lost_timestamps             — times the student was lost
  //
  //  QuizQuestion type (discriminated union):
  //
  //    | { type: "mcq",
  //        question, options: string[], correct_answer, explanation }
  //    | { type: "short_answer",
  //        question, correct_answer, explanation }
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
  //    const result = await generateFinishContent(
  //      validatedRequest, geminiApiKey
  //    );
  //
  //    return jsonResponse(200, {
  //      summary: result.summary,
  //      quiz: result.quiz,
  //    } satisfies FinishSuccessResponse);
  //
  //  IMPORTANT:
  //    • Quiz should be 5–8 questions.
  //    • Weight questions toward friction_points (terms the student
  //      clicked + moments they were lost).
  //    • Each question must include correct_answer + explanation
  //      for immediate feedback.
  //    • Do NOT generate fake quiz data.
  //    • Do NOT write to the database from this function.
  //    • Do NOT delete the session.
  //    • Do NOT expose the API key in responses or logs.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  return jsonResponse(501, {
    error:
      "Session finish processing is not yet implemented. " +
      "The AI Engineer must connect Gemini at the marked " +
      "integration point in supabase/functions/finish/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

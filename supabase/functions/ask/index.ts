// supabase/functions/ask/index.ts
//
// EduBridge AI — Ask AI Chat Edge Function (Scaffold)
//
// Accepts a student question with session context and chat history.
// Returns a STREAMED TEXT response (not JSON).
//
// IMPORTANT:
//   The SRD explicitly specifies streamed text for /ask responses.
//   Do NOT convert this into a JSON answer object.
//   The AI Engineer must implement Gemini streaming here.

// ─── Shared Types ────────────────────────────────────────────────

/**
 * A single chat turn.
 *
 * Roles match the database schema constraint:
 *   chat_history.role CHECK (role IN ('user', 'assistant'))
 */
interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

// ─── Request / Response Types ────────────────────────────────────

interface AskRequest {
  session_id: string;
  question: string;
  running_summary: string;
  rolling_buffer: string;
  chat_history: ChatTurn[];
}

/**
 * Error response shape.
 *
 * NOTE: The success response for /ask is STREAMED TEXT, not JSON.
 * This typed error response is used only for validation failures
 * and the 501 development placeholder.
 */
interface AskErrorResponse {
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

function errorResponse(status: number, body: AskErrorResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Validation Helpers ──────────────────────────────────────────

const VALID_ROLES: ReadonlySet<string> = new Set(["user", "assistant"]);

function isValidChatTurn(turn: unknown): turn is ChatTurn {
  if (typeof turn !== "object" || turn === null) return false;
  const t = turn as Record<string, unknown>;
  return (
    typeof t.role === "string" &&
    VALID_ROLES.has(t.role) &&
    typeof t.content === "string"
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
    return errorResponse(405, {
      error: "Method not allowed. Use POST.",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  // ── 3. Content-Type guard ──────────────────────────────────
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return errorResponse(400, {
      error: "Content-Type must be application/json.",
      code: "INVALID_CONTENT_TYPE",
    });
  }

  // ── 4. Parse JSON body ─────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch (_err) {
    return errorResponse(400, {
      error: "Failed to parse JSON request body.",
      code: "JSON_PARSE_ERROR",
    });
  }

  const {
    session_id,
    question,
    running_summary,
    rolling_buffer,
    chat_history,
  } = body as Record<string, unknown>;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof session_id !== "string" || session_id.trim() === "") {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "session_id".',
      code: "INVALID_SESSION_ID",
    });
  }

  if (typeof question !== "string" || question.trim() === "") {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "question".',
      code: "INVALID_QUESTION",
    });
  }

  if (typeof running_summary !== "string") {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "running_summary".',
      code: "INVALID_RUNNING_SUMMARY",
    });
  }

  if (typeof rolling_buffer !== "string") {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "rolling_buffer".',
      code: "INVALID_ROLLING_BUFFER",
    });
  }

  if (!Array.isArray(chat_history)) {
    return errorResponse(400, {
      error: '"chat_history" must be an array of ChatTurn objects.',
      code: "INVALID_CHAT_HISTORY",
    });
  }

  for (let i = 0; i < chat_history.length; i++) {
    if (!isValidChatTurn(chat_history[i])) {
      return errorResponse(400, {
        error: `Invalid ChatTurn at chat_history[${i}]. Each entry must have { role: "user" | "assistant", content: string }.`,
        code: "INVALID_CHAT_TURN",
      });
    }
  }

  // ── 6. Validated request ───────────────────────────────────
  const validatedRequest: AskRequest = {
    session_id: session_id as string,
    question: question as string,
    running_summary: running_summary as string,
    rolling_buffer: rolling_buffer as string,
    chat_history: chat_history as ChatTurn[],
  };

  // ════════════════════════════════════════════════════════════════
  //
  //  AI ENGINEER INTEGRATION POINT:
  //
  //  Implement Gemini STREAMING response here.
  //
  //  The SRD specifies that /ask returns STREAMED TEXT, not JSON.
  //
  //  Available:
  //    validatedRequest.session_id       — current session
  //    validatedRequest.question         — student's question
  //    validatedRequest.running_summary  — session summary so far
  //    validatedRequest.rolling_buffer   — recent transcript text
  //    validatedRequest.chat_history     — previous chat turns
  //
  //  Expected usage:
  //
  //    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  //    if (!geminiApiKey) {
  //      return errorResponse(500, {
  //        error: "GEMINI_API_KEY is not configured.",
  //        code: "MISSING_API_KEY",
  //      });
  //    }
  //
  //    // Build a ReadableStream that streams Gemini's response
  //    const stream = await streamGeminiResponse(
  //      validatedRequest, geminiApiKey
  //    );
  //
  //    return new Response(stream, {
  //      status: 200,
  //      headers: {
  //        ...CORS_HEADERS,
  //        "Content-Type": "text/plain; charset=utf-8",
  //        "Transfer-Encoding": "chunked",
  //      },
  //    });
  //
  //  IMPORTANT:
  //    • Response MUST be streamed text, not JSON.
  //    • Do NOT write chat history to the database — the
  //      client/API layer handles persistence.
  //    • Do NOT expose the API key in responses or logs.
  //
  // ════════════════════════════════════════════════════════════════

  void validatedRequest;

  // Until Gemini streaming is implemented, return a JSON 501 error.
  // This is acceptable per the scaffold requirements.
  return errorResponse(501, {
    error:
      "Ask AI streaming is not yet implemented. " +
      "The AI Engineer must connect Gemini streaming at the marked " +
      "integration point in supabase/functions/ask/index.ts.",
    code: "AI_NOT_IMPLEMENTED",
  });
});

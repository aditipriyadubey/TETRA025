// supabase/functions/ask/index.ts
//
// EduBridge AI — Ask AI Chat Edge Function
//
// Accepts a student question with full lecture context.
// Returns a STREAMED TEXT response grounded in lecture content.
//
// LECTURE-GROUNDED:
//   The chat does NOT directly ask Gemini a generic question.
//   Instead, it builds context from:
//     - Lecture transcript (rolling buffer)
//     - Generated notes
//     - Glossary terms
//     - Keywords
//   This makes answers lecture-aware, NOT generic internet knowledge.

import {
  CORS_HEADERS,
  corsPreflightResponse,
  validateMethod,
  validateJsonContentType,
  safeParseJson,
  requireEnvSecret,
  streamResponse,
} from "../_shared/cors.ts";
import { streamGemini } from "../_shared/gemini.ts";
import { isValidChatTurn, type ChatTurn } from "../_shared/types.ts";

// ─── Error Response Helper ───────────────────────────────────────

function errorResponse(status: number, body: { error: string; code: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Request Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // ── 1. CORS preflight ──────────────────────────────────────
  if (req.method === "OPTIONS") {
    return corsPreflightResponse();
  }

  // ── 2. Method guard ────────────────────────────────────────
  const methodErr = validateMethod(req);
  if (methodErr) return methodErr;

  // ── 3. Content-Type guard ──────────────────────────────────
  const ctErr = validateJsonContentType(req);
  if (ctErr) return ctErr;

  // ── 4. Parse JSON body ─────────────────────────────────────
  const parsed = await safeParseJson(req);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  // ── 5. Validate required fields ────────────────────────────

  if (typeof body.session_id !== "string" || !(body.session_id as string).trim()) {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "session_id".',
      code: "INVALID_SESSION_ID",
    });
  }

  if (typeof body.question !== "string" || !(body.question as string).trim()) {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "question".',
      code: "INVALID_QUESTION",
    });
  }

  if (typeof body.running_summary !== "string") {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "running_summary".',
      code: "INVALID_RUNNING_SUMMARY",
    });
  }

  if (typeof body.rolling_buffer !== "string") {
    return errorResponse(400, {
      error: 'Missing or invalid required field: "rolling_buffer".',
      code: "INVALID_ROLLING_BUFFER",
    });
  }

  if (!Array.isArray(body.chat_history)) {
    return errorResponse(400, {
      error: '"chat_history" must be an array of ChatTurn objects.',
      code: "INVALID_CHAT_HISTORY",
    });
  }

  for (let i = 0; i < (body.chat_history as unknown[]).length; i++) {
    if (!isValidChatTurn((body.chat_history as unknown[])[i])) {
      return errorResponse(400, {
        error: `Invalid ChatTurn at chat_history[${i}]. Each entry must have { role: "user" | "assistant", content: string }.`,
        code: "INVALID_CHAT_TURN",
      });
    }
  }

  // Optional: notes, glossary, keywords for lecture grounding
  const lectureNotes = typeof body.notes === "string" ? (body.notes as string) : "";
  const glossaryRaw = typeof body.glossary === "string" ? (body.glossary as string) : "";
  const keywordsRaw = typeof body.keywords === "string" ? (body.keywords as string) : "";

  // ── 6. Get API key ────────────────────────────────────────
  const keyResult = requireEnvSecret("GEMINI_API_KEY");
  if ("error" in keyResult) return keyResult.error;

  // ── 7. Build lecture-grounded prompt ───────────────────────
  const question = body.question as string;
  const runningSummary = body.running_summary as string;
  const rollingBuffer = body.rolling_buffer as string;
  const chatHistory = body.chat_history as ChatTurn[];

  // Build context sections
  let contextBlock = "";

  if (runningSummary) {
    contextBlock += `\n## Lecture Summary\n${runningSummary}\n`;
  }

  if (rollingBuffer) {
    contextBlock += `\n## Recent Transcript\n${rollingBuffer}\n`;
  }

  if (lectureNotes) {
    contextBlock += `\n## Generated Notes\n${lectureNotes}\n`;
  }

  if (glossaryRaw) {
    contextBlock += `\n## Glossary Terms\n${glossaryRaw}\n`;
  }

  if (keywordsRaw) {
    contextBlock += `\n## Key Concepts\n${keywordsRaw}\n`;
  }

  // Build conversation history for multi-turn
  let historyBlock = "";
  if (chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-10); // Keep last 10 turns
    historyBlock = "\n## Previous Conversation\n";
    for (const turn of recentHistory) {
      historyBlock += `${turn.role === "user" ? "Student" : "EduBridge AI"}: ${turn.content}\n\n`;
    }
  }

  const prompt = `You are EduBridge AI, a lecture-aware learning companion.

CRITICAL RULE: You must answer ONLY from the lecture context provided below. Do NOT use generic internet knowledge. If the answer is not in the lecture content, say "This wasn't covered in the lecture so far" and give a brief pointer.

## LECTURE CONTEXT
${contextBlock || "(No lecture context available yet)"}
${historyBlock}

## STUDENT'S QUESTION
${question}

## INSTRUCTIONS
1. Answer based on the lecture content above — transcript, notes, glossary, and summary.
2. Reference specific parts of the lecture when possible ("As discussed in the lecture...", "The professor mentioned...").
3. Keep your answer concise (2-4 paragraphs max).
4. If the student is confused about a concept from the lecture, explain it simply.
5. If asked something not covered in the lecture, acknowledge that clearly.
6. Be warm, encouraging, and student-friendly.`;

  try {
    const stream = await streamGemini(prompt, keyResult.key, {
      temperature: 0.5,
      maxOutputTokens: 2048,
    });

    return streamResponse(stream);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return errorResponse(500, {
      error: `Ask AI failed: ${message}`,
      code: "AI_ERROR",
    });
  }
});

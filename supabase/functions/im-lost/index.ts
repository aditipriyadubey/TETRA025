// supabase/functions/im-lost/index.ts
//
// EduBridge AI — "I'm Lost" Rescue Edge Function
//
// When a student clicks "I'm Lost", this function:
//   1. Steps down the difficulty level (expert→college→high_school→child)
//   2. Uses Gemini to explain ONLY the current lecture section
//   3. Returns: simpler explanation + real-life analogy + practical example
//
// Designed to be FAST — short prompt, focused output.

import {
  CORS_HEADERS,
  corsPreflightResponse,
  jsonResponse,
  validateMethod,
  validateJsonContentType,
  safeParseJson,
  requireEnvSecret,
} from "../_shared/cors.ts";
import { callGemini } from "../_shared/ollama.ts";
import {
  type DifficultyLevel,
  VALID_DIFFICULTIES,
  DIFFICULTY_STEP_DOWN,
} from "../_shared/types.ts";

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

  if (typeof body.rolling_buffer !== "string") {
    return jsonResponse(400, {
      error: 'Missing or invalid required field: "rolling_buffer".',
      code: "INVALID_ROLLING_BUFFER",
    });
  }

  if (
    typeof body.current_difficulty !== "string" ||
    !VALID_DIFFICULTIES.includes(body.current_difficulty as DifficultyLevel)
  ) {
    return jsonResponse(400, {
      error: `"current_difficulty" must be one of: ${VALID_DIFFICULTIES.join(", ")}.`,
      code: "INVALID_DIFFICULTY",
    });
  }

  const rollingBuffer = body.rolling_buffer as string;
  const currentDifficulty = body.current_difficulty as DifficultyLevel;

  // ── 6. Get API key ────────────────────────────────────────
  const keyResult = requireEnvSecret("AI_INFERENCE_API_HOST");
  if ("error" in keyResult) return keyResult.error;

  // ── 7. Step down difficulty ────────────────────────────────
  const rescueDifficulty = DIFFICULTY_STEP_DOWN[currentDifficulty];

  // ── 8. Build prompt and call Gemini ────────────────────────
  const difficultyLabels: Record<DifficultyLevel, string> = {
    child: "a 10-year-old child",
    high_school: "a high school student",
    college: "a college undergraduate",
    expert: "a graduate-level expert",
  };

  const prompt = `You are EduBridge AI. A student just clicked "I'm Lost" during a lecture.

Here is the most recent section of the lecture transcript they are struggling with:

"${rollingBuffer}"

The student needs a rescue explanation at the level of ${difficultyLabels[rescueDifficulty]}.

Return your response in EXACTLY this format (plain text, not JSON):

**Simpler Explanation:**
[Explain what was just discussed in simpler terms. 2-3 sentences max. Only cover what's in the transcript above — do NOT explain the entire lecture.]

**Real-Life Analogy:**
[One concrete, relatable real-life analogy that makes the concept click.]

**Practical Example:**
[One specific practical example showing how this concept works in the real world.]

RULES:
- Keep it SHORT and FAST. Students are lost — don't overwhelm them.
- Only explain what's in the transcript — not the whole lecture.
- Use language appropriate for ${difficultyLabels[rescueDifficulty]}.
- Be warm and encouraging.`;

  try {
    const explanation = await callGemini(prompt, keyResult.key, {
      temperature: 0.4,
      maxOutputTokens: 1024,
    });

    return jsonResponse(200, { explanation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return jsonResponse(500, {
      error: `I'm Lost AI failed: ${message}`,
      code: "AI_ERROR",
    });
  }
});

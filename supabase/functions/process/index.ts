// supabase/functions/process/index.ts
//
// EduBridge AI — Unified AI Processing Edge Function
//
// ONE Gemini call that returns structured JSON containing:
//   - Translated text
//   - Notes (key points)
//   - Running summary (incremental fold)
//   - Glossary (term, definition, simple explanation)
//   - Important keywords
//
// This replaces the old translate, terms, notes, context-summary,
// and dictionary scaffold endpoints.
//
// PIPELINE:
//   Audio → Groq Whisper (/stt-proxy) → transcript
//   transcript → THIS FUNCTION → structured output
//   structured output → UI consumes

import {
  CORS_HEADERS,
  corsPreflightResponse,
  jsonResponse,
  validateMethod,
  validateJsonContentType,
  safeParseJson,
  requireString,
  requireEnvSecret,
} from "../_shared/cors.ts";
import { callGemini } from "../_shared/gemini.ts";

// ─── Request / Response Types ────────────────────────────────────

interface ProcessRequest {
  transcript: string;
  target_language: string;
  existing_summary: string;
  existing_notes: string;
  difficulty: string;
}

interface GlossaryEntry {
  term: string;
  definition: string;
  simple_explanation: string;
}

interface ProcessSuccessResponse {
  translated_text: string;
  notes: string;
  summary: string;
  glossary: GlossaryEntry[];
  keywords: string[];
}

// ─── Prompt Builder ──────────────────────────────────────────────

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  child:
    "Use very simple words, short sentences, no jargon. Suitable for a 10-year-old.",
  high_school:
    "Use high-school level vocabulary. Define technical terms. Include simple examples.",
  college:
    "Use undergraduate level language. Technical terms are acceptable with brief explanations.",
  expert:
    "Use graduate/professional level language. Be precise and concise.",
};

function buildProcessPrompt(req: ProcessRequest): string {
  const diffInstruction =
    DIFFICULTY_INSTRUCTIONS[req.difficulty] ??
    DIFFICULTY_INSTRUCTIONS["college"];

  return `You are EduBridge AI, an intelligent lecture processing assistant.

You will receive a transcript chunk from a lecture. Your job is to process it and return a SINGLE structured JSON response.

## INPUT

### New Transcript Chunk:
${req.transcript}

### Target Language for Translation: ${req.target_language}

### Existing Summary So Far:
${req.existing_summary || "(No summary yet — this is the first chunk)"}

### Existing Notes So Far:
${req.existing_notes || "(No notes yet — this is the first chunk)"}

### Difficulty Level: ${req.difficulty}
${diffInstruction}

## INSTRUCTIONS

Return a JSON object with EXACTLY these fields:

1. **translated_text**: Translate the transcript chunk into ${req.target_language}. If the target language is English, return the original text unchanged. The translation must be accurate and natural-sounding.

2. **notes**: Generate NEW note bullet points from this chunk ONLY. Do NOT repeat notes from existing_notes. Format as markdown bullet points. Include key concepts, formulas if any, and important takeaways. Adjust complexity to the difficulty level.

3. **summary**: Take the existing_summary and FOLD in the new information from this chunk. Keep the result compact (2-4 sentences max). Do NOT re-summarize from scratch — incrementally update.

4. **glossary**: Extract technical/domain-specific terms from this chunk. For each term return:
   - "term": the technical term
   - "definition": formal definition
   - "simple_explanation": plain-language explanation suitable for the difficulty level
   Only include genuinely technical terms. Return an empty array if none found.

5. **keywords**: List the most important keywords/concepts from this chunk as an array of strings. 3-8 keywords max.

## RULES
- Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.
- Do NOT invent information not present in the transcript.
- Keep notes concise — bullet points, not paragraphs.
- Glossary simple_explanation should match the difficulty level.
- If the transcript is very short or trivial, still return all fields (use empty arrays/strings where appropriate).

## RESPONSE FORMAT
{
  "translated_text": "...",
  "notes": "- Point 1\\n- Point 2",
  "summary": "...",
  "glossary": [{"term": "...", "definition": "...", "simple_explanation": "..."}],
  "keywords": ["...", "..."]
}`;
}

// ─── JSON Extraction Helper ──────────────────────────────────────

function extractJson(text: string): string {
  // Try to extract JSON from markdown fences if Gemini wraps it
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  // Try to find a JSON object directly
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text.trim();
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
  const transcriptErr = requireString(body.transcript, "transcript");
  if (transcriptErr) return transcriptErr;

  const langErr = requireString(body.target_language, "target_language");
  if (langErr) return langErr;

  // existing_summary and existing_notes can be empty strings
  if (typeof body.existing_summary !== "string") {
    return jsonResponse(400, {
      error: '"existing_summary" must be a string (empty string is valid).',
      code: "INVALID_EXISTING_SUMMARY",
    });
  }

  if (typeof body.existing_notes !== "string") {
    return jsonResponse(400, {
      error: '"existing_notes" must be a string (empty string is valid).',
      code: "INVALID_EXISTING_NOTES",
    });
  }

  const difficulty =
    typeof body.difficulty === "string" && body.difficulty.trim()
      ? (body.difficulty as string)
      : "college";

  // ── 6. Get API key ────────────────────────────────────────
  const keyResult = requireEnvSecret("GEMINI_API_KEY");
  if ("error" in keyResult) return keyResult.error;

  // ── 7. Build prompt and call Gemini ────────────────────────
  const processRequest: ProcessRequest = {
    transcript: body.transcript as string,
    target_language: body.target_language as string,
    existing_summary: body.existing_summary as string,
    existing_notes: body.existing_notes as string,
    difficulty,
  };

  try {
    const rawResponse = await callGemini(
      buildProcessPrompt(processRequest),
      keyResult.key,
      {
        systemInstruction:
          "You are EduBridge AI. Return ONLY valid JSON. No markdown fences, no extra text.",
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    );

    // ── 8. Parse Gemini's JSON response ──────────────────────
    const jsonStr = extractJson(rawResponse);
    let result: ProcessSuccessResponse;

    try {
      const parsed = JSON.parse(jsonStr);
      result = {
        translated_text: parsed.translated_text ?? "",
        notes: parsed.notes ?? "",
        summary: parsed.summary ?? "",
        glossary: Array.isArray(parsed.glossary) ? parsed.glossary : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      };
    } catch (_parseErr) {
      // If JSON parsing fails, return what we can
      return jsonResponse(500, {
        error: "Failed to parse AI response as JSON.",
        code: "AI_PARSE_ERROR",
      });
    }

    return jsonResponse(200, result as unknown as Record<string, unknown>);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return jsonResponse(500, {
      error: `AI processing failed: ${message}`,
      code: "AI_ERROR",
    });
  }
});

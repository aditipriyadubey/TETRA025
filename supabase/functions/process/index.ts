// supabase/functions/process/index.ts
//
// EduBridge AI — Post-Recording AI Processing
//
// Called ONCE after "Stop Recording & Generate Notes":
//   Call 1 (qwen/qwen3.6-27b): translate full transcript
//   Call 2 (llama-3.3-70b-versatile): notes, summary, glossary, keywords
//
// PIPELINE:
//   Audio → Groq Whisper (/stt-proxy) → transcript
//   transcript → THIS FUNCTION → structured output
//   structured output → UI consumes

import {
  corsPreflightResponse,
  jsonResponse,
  validateMethod,
  validateJsonContentType,
  safeParseJson,
  requireString,
  requireEnvSecret,
} from "../_shared/cors.ts";
import { callGroqChat } from "../_shared/groq_chat.ts";

const TRANSLATION_MODEL = "qwen/qwen3.6-27b";
const NOTES_MODEL = "llama-3.3-70b-versatile";

const SUPPORTED_LANGUAGES = ["English", "Hindi", "Gujarati", "French"];

interface ProcessRequest {
  transcript: string;
  target_language: string;
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

interface NotesResponse {
  notes: string;
  summary: string;
  glossary: GlossaryEntry[];
  keywords: string[];
}

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

function buildTranslationPrompt(req: ProcessRequest): string {
  const lang = req.target_language.trim();

  if (lang.toLowerCase() === "english") {
    return `Return the following lecture transcript exactly as written. Do not add, remove, or modify any text. Output ONLY the transcript text with no preamble or explanation.

TRANSCRIPT:
${req.transcript}`;
  }

  return `Translate the following lecture transcript into ${lang}.

Supported target languages: ${SUPPORTED_LANGUAGES.join(", ")}.

Rules:
- Preserve meaning, tone, and technical accuracy.
- Use natural, fluent ${lang}.
- Do NOT invent information not present in the transcript.
- Output ONLY the translated text. No preamble, labels, or explanation.

TRANSCRIPT:
${req.transcript}`;
}

function buildNotesPrompt(req: ProcessRequest): string {
  const diffInstruction =
    DIFFICULTY_INSTRUCTIONS[req.difficulty] ??
    DIFFICULTY_INSTRUCTIONS["college"];

  return `You are EduBridge AI, an intelligent lecture processing assistant.

Process the complete lecture transcript below and return a SINGLE structured JSON response.

## TRANSCRIPT
${req.transcript}

## TARGET LANGUAGE
${req.target_language}

## DIFFICULTY LEVEL: ${req.difficulty}
${diffInstruction}

## INSTRUCTIONS

Return a JSON object with EXACTLY these fields:

1. **notes**: Generate concise note bullet points covering the full lecture. Format as markdown bullet points. Include key concepts, formulas if any, and important takeaways. Adjust complexity to the difficulty level.

2. **summary**: Write a compact summary of the entire lecture (2-4 sentences max).

3. **glossary**: Extract technical/domain-specific terms from the transcript. For each term return:
   - "term": the technical term
   - "definition": formal definition
   - "simple_explanation": plain-language explanation suitable for the difficulty level
   Only include genuinely technical terms. Return an empty array if none found.

4. **keywords**: List the most important keywords/concepts from the lecture as an array of strings. 3-8 keywords max.

## RULES
- Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.
- Do NOT invent information not present in the transcript.
- Keep notes concise — bullet points, not paragraphs.
- Glossary simple_explanation should match the difficulty level.

## RESPONSE FORMAT
{
  "notes": "- Point 1\\n- Point 2",
  "summary": "...",
  "glossary": [{"term": "...", "definition": "...", "simple_explanation": "..."}],
  "keywords": ["...", "..."]
}`;
}

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text.trim();
}

function parseNotesResponse(rawResponse: string): NotesResponse {
  const jsonStr = extractJson(rawResponse);
  const parsed = JSON.parse(jsonStr);

  return {
    notes: parsed.notes ?? "",
    summary: parsed.summary ?? "",
    glossary: Array.isArray(parsed.glossary) ? parsed.glossary : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return corsPreflightResponse();
  }

  const methodErr = validateMethod(req);
  if (methodErr) return methodErr;

  const ctErr = validateJsonContentType(req);
  if (ctErr) return ctErr;

  const parsed = await safeParseJson(req);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const transcriptErr = requireString(body.transcript, "transcript");
  if (transcriptErr) return transcriptErr;

  const langErr = requireString(body.target_language, "target_language");
  if (langErr) return langErr;

  const difficulty =
    typeof body.difficulty === "string" && body.difficulty.trim()
      ? (body.difficulty as string)
      : "college";

  const keyResult = requireEnvSecret("GROQ_API_KEY");
  if ("error" in keyResult) return keyResult.error;

  const processRequest: ProcessRequest = {
    transcript: body.transcript as string,
    target_language: body.target_language as string,
    difficulty,
  };

  try {
    const translatedText = await callGroqChat(
      buildTranslationPrompt(processRequest),
      keyResult.key,
      {
        systemInstruction:
          "You are EduBridge AI, a professional translator. Output ONLY the translated or original transcript text. No JSON, no markdown fences, no extra commentary.",
        temperature: 0.2,
        maxOutputTokens: 8192,
        model: TRANSLATION_MODEL,
      },
    );

    const notesRaw = await callGroqChat(
      buildNotesPrompt(processRequest),
      keyResult.key,
      {
        systemInstruction:
          "You are EduBridge AI. Return ONLY valid JSON. No markdown fences, no extra text.",
        temperature: 0.3,
        maxOutputTokens: 4096,
        model: NOTES_MODEL,
      },
    );

    let notesResult: NotesResponse;
    try {
      notesResult = parseNotesResponse(notesRaw);
    } catch (_parseErr) {
      return jsonResponse(500, {
        error: "Failed to parse AI response as JSON.",
        code: "AI_PARSE_ERROR",
      });
    }

    const result: ProcessSuccessResponse = {
      translated_text: translatedText.trim(),
      notes: notesResult.notes,
      summary: notesResult.summary,
      glossary: notesResult.glossary,
      keywords: notesResult.keywords,
    };

    return jsonResponse(200, result as unknown as Record<string, unknown>);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return jsonResponse(500, {
      error: `AI processing failed: ${message}`,
      code: "AI_ERROR",
    });
  }
});

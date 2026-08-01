// supabase/functions/_shared/types.ts
//
// EduBridge AI — Shared Type Contracts for Edge Functions
//
// These types define the HTTP API contracts between:
//   - Frontend API wrappers (src/lib/api.ts)
//   - Edge Function handlers (supabase/functions/*/index.ts)
//   - AI Engineer integration points
//
// DENO RUNTIME NOTE:
//   This file runs in Supabase's Deno Edge Function runtime.
//   It must NOT import from src/ai/* or any Vite-bundled module.
//
// CAMELCASE vs SNAKE_CASE:
//   HTTP contracts use snake_case (JSON over the wire).
//   AI Engineer internal types may use camelCase.
//   The mapping happens at the HTTP boundary, not here.

// ─── Difficulty ──────────────────────────────────────────────────

/**
 * Backend difficulty enum — matches Edge Function validation
 * and database constraints.
 *
 * Values: "child" | "high_school" | "college" | "expert"
 */
export type DifficultyLevel = "child" | "high_school" | "college" | "expert";

export const VALID_DIFFICULTIES: readonly DifficultyLevel[] = [
  "child",
  "high_school",
  "college",
  "expert",
];

/**
 * Step-down mapping for the "I'm Lost" feature.
 * expert → college → high_school → child → child
 */
export const DIFFICULTY_STEP_DOWN: Record<DifficultyLevel, DifficultyLevel> = {
  expert: "college",
  college: "high_school",
  high_school: "child",
  child: "child",
};

// ─── Chat History ────────────────────────────────────────────────

/** A single chat turn — matches database schema constraint. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export const VALID_ROLES: ReadonlySet<string> = new Set(["user", "assistant"]);

export function isValidChatTurn(turn: unknown): turn is ChatTurn {
  if (typeof turn !== "object" || turn === null) return false;
  const t = turn as Record<string, unknown>;
  return (
    typeof t.role === "string" &&
    VALID_ROLES.has(t.role) &&
    typeof t.content === "string"
  );
}

// ─── Technical Terms ─────────────────────────────────────────────

/** Extracted technical term with character-level positions. */
export interface TechnicalTerm {
  term: string;
  start_index: number;
  end_index: number;
}

// ─── Quiz ────────────────────────────────────────────────────────

/**
 * Quiz question — discriminated union supporting MCQ and short-answer.
 * 5–8 questions per session, weighted toward friction points.
 */
export type QuizQuestion =
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

// ─── Friction Points ─────────────────────────────────────────────

/** Friction data sent with /finish for personalized quiz generation. */
export interface FrictionPoints {
  dictionary_terms_clicked: string[];
  im_lost_timestamps: number[];
}

// ─── Error Shape ─────────────────────────────────────────────────

/** Consistent error response shape used by all Edge Functions. */
export interface ApiErrorResponse {
  error: string;
  code: string;
}

// src/ai/constants.ts
//
// EduBridge AI — Shared Constants for AI Pipeline
//
// Languages: English, Hindi, Gujarati, French
// Difficulty: child, high_school, college, expert

export const DIFFICULTY_LEVELS = {
  CHILD: "child",
  HIGH_SCHOOL: "high_school",
  COLLEGE: "college",
  EXPERT: "expert",
} as const;

export type DifficultyLevel =
  (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS];

export const SUPPORTED_LANGUAGES = [
  "English",
  "Hindi",
  "Gujarati",
  "French",
] as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  English: "en",
  Hindi: "hi",
  Gujarati: "gu",
  French: "fr",
};

export const LANGUAGE_NATIVE: Record<SupportedLanguage, string> = {
  English: "English",
  Hindi: "हिन्दी",
  Gujarati: "ગુજરાતી",
  French: "Français",
};
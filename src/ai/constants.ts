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
  "Japanese",
  "Korean",
] as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number];
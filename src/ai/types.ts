import type {
  DifficultyLevel,
  SupportedLanguage,
} from "./constants";

export interface ExplanationRequest {
  transcript: string;
  difficulty: DifficultyLevel;
  language: SupportedLanguage;
}

export interface ExplanationResponse {
  explanation: string;
}

export interface AskAIRequest {
  question: string;
  rollingBuffer: string;
  runningSummary: string;
  difficulty: DifficultyLevel;
  language: SupportedLanguage;
}

export interface AskAIResponse {
  answer: string;
}
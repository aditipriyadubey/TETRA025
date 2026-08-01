import { DifficultyLevel } from "../constants";

const difficultyInstructions: Record<DifficultyLevel, string> = {
  child:
    "Explain like the student is 10 years old. Use very simple words, short sentences, no jargon, and one everyday example.",
  high_school:
    "Explain using high-school level vocabulary. Define every technical term the first time you use it and include one simple example.",
  college:
    "Explain at undergraduate level. You may use technical terms but briefly explain difficult concepts.",
  expert:
    "Explain at graduate/professional level. Be precise, concise, and assume strong domain knowledge.",
};

export function buildExplanationPrompt(
  transcript: string,
  difficulty: DifficultyLevel
): string {
  return `
You are EduBridge AI.

Your job is NOT to simply translate.
Your job is to help the student UNDERSTAND the lecture.

Current Lecture Transcript:
${transcript}

Difficulty Level:
${difficulty}

Instructions:
${difficultyInstructions[difficulty]}

Rules:
- Keep the explanation under 150 words.
- Stay faithful to the lecture.
- Do not invent information.
- If the transcript is incomplete, explain only what is available.
- If appropriate, include one simple real-world example.
`;
}
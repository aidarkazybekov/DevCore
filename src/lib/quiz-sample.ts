import type { InterviewQuestion } from "./types";

// Deterministic: the first n questions (avoids Math.random flakiness).
export function sampleQuizQuestions(qs: InterviewQuestion[], n = 3): InterviewQuestion[] {
  return qs.slice(0, n);
}

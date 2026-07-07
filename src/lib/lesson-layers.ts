import type { Depth } from "./depth";

export type LessonSection =
  | "tldr" | "analogy" | "diagram" | "recap"
  | "whatWhy" | "howItWorks" | "code" | "gotcha" | "checkpoints"
  | "interview" | "spring" | "glossary";

const QUICK: LessonSection[] = ["tldr", "analogy", "diagram", "recap"];
const STANDARD_ADD: LessonSection[] = ["whatWhy", "howItWorks", "code", "gotcha", "checkpoints"];
const DEEP_ADD: LessonSection[] = ["interview", "spring", "glossary"];

export function visibleSections(depth: Depth): Set<LessonSection> {
  if (depth === "quick") return new Set(QUICK);
  if (depth === "standard") return new Set([...QUICK, ...STANDARD_ADD]);
  return new Set([...QUICK, ...STANDARD_ADD, ...DEEP_ADD]);
}

export function isVisible(section: LessonSection, depth: Depth): boolean {
  return visibleSections(depth).has(section);
}

export function showMiniQuiz(depth: Depth): boolean {
  return !isVisible("interview", depth);
}

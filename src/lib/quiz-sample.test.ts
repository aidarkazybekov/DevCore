import { describe, it, expect } from "vitest";
import { sampleQuizQuestions } from "./quiz-sample";
import type { InterviewQuestion } from "./types";

const q = (id: string): InterviewQuestion => ({ id, q: "q", a: "a", difficulty: "mid" });

describe("sampleQuizQuestions", () => {
  it("returns the first 3 by default", () => {
    const out = sampleQuizQuestions([q("1"), q("2"), q("3"), q("4")]);
    expect(out.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });
  it("returns all when fewer than n", () => {
    expect(sampleQuizQuestions([q("1")]).map((x) => x.id)).toEqual(["1"]);
  });
  it("returns [] for no questions", () => {
    expect(sampleQuizQuestions([])).toEqual([]);
  });
});

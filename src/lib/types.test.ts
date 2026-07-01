import { describe, it, expect } from "vitest";
import type { TopicContent } from "./types";

describe("TopicContent optional layered fields", () => {
  it("accepts a topic with the new fields", () => {
    const t: TopicContent = {
      id: "x", blockId: 1, title: "T", summary: "s", deepDive: "d", code: "c",
      interviewQs: [], tip: "t", springConnection: null,
      tldr: "tl", analogy: "an", whatWhy: "ww", howItWorks: "hiw", gotcha: "g", recap: "r",
      checkpoints: [{ id: "cp1", prompt: "p", answer: "a" }],
      keyTerms: [{ term: "term", definition: "def" }],
    };
    expect(t.checkpoints?.[0].id).toBe("cp1");
    expect(t.keyTerms?.[0].term).toBe("term");
  });

  it("accepts a legacy topic without the new fields", () => {
    const t: TopicContent = {
      id: "y", blockId: 1, title: "T", summary: "s", deepDive: "d", code: "c",
      interviewQs: [], tip: "t", springConnection: null,
    };
    expect(t.tldr).toBeUndefined();
  });
});

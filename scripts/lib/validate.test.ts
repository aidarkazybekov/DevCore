import { describe, it, expect } from "vitest";
import { validateTopic } from "./validate";
import type { NormTopic } from "./norm";

const base: NormTopic = {
  id: "x", blockId: 1,
  title: { ru: "т", en: "t" }, summary: { ru: "к", en: "s" },
  deepDive: { ru: "г", en: "d" }, tip: { ru: "с", en: "t" }, code: "x",
  interviewQs: [{ id: "x-q1", difficulty: "mid", q: { ru: "в", en: "q" }, a: { ru: "о", en: "a" } }],
  spring: null,
};

describe("validateTopic", () => {
  it("passes a complete published topic", () => {
    expect(validateTopic(base, "published").errors).toEqual([]);
  });
  it("errors on a missing RU side when published", () => {
    const bad = { ...base, summary: { ru: "", en: "s" } };
    expect(validateTopic(bad, "published").errors.length).toBeGreaterThan(0);
  });
  it("downgrades the same gap to a warning when draft", () => {
    const bad = { ...base, summary: { ru: "", en: "s" } };
    const r = validateTopic(bad, "draft");
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("errors on invalid difficulty when published", () => {
    const bad = {
      ...base,
      interviewQs: [{ ...base.interviewQs[0], difficulty: "expert" as "junior" }],
    };
    const r = validateTopic(bad, "published");
    expect(r.errors).toContain("x: interviewQs[0].difficulty invalid: expert");
  });
  it("downgrades invalid difficulty to warning when draft", () => {
    const bad = {
      ...base,
      interviewQs: [{ ...base.interviewQs[0], difficulty: "expert" as "junior" }],
    };
    const r = validateTopic(bad, "draft");
    expect(r.errors).toEqual([]);
    expect(r.warnings).toContain("x: interviewQs[0].difficulty invalid: expert");
  });
});

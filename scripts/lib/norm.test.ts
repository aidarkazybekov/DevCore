import { describe, it, expect } from "vitest";
import { decompose, recompose } from "./norm";
import type { TopicContent } from "../../src/lib/types";

const sample: TopicContent = {
  id: "1-1",
  blockId: 1,
  title: "JVM Architecture",
  diagram: "jvm-architecture",
  summary: "кратко\n\n---\n\nshort",
  deepDive: "глубоко\n\n---\n\ndeep",
  code: "class A {}",
  tip: "совет\n\n---\n\ntip",
  interviewQs: [
    { id: "1-1-q1", q: "вопрос\n\n---\n\nquestion", a: "ответ\n\n---\n\nanswer", difficulty: "senior" },
  ],
  springConnection: { concept: "к\n\n---\n\nc", springFeature: "ф\n\n---\n\nf", explanation: "о\n\n---\n\ne" },
};

describe("decompose/recompose", () => {
  it("decomposes prose into ru/en", () => {
    const n = decompose(sample);
    expect(n.summary).toEqual({ ru: "кратко", en: "short" });
    expect(n.title).toEqual({ ru: "JVM Architecture", en: "JVM Architecture" });
    expect(n.interviewQs[0].q).toEqual({ ru: "вопрос", en: "question" });
    expect(n.spring?.concept).toEqual({ ru: "к", en: "c" });
    expect(n.diagram).toBe("jvm-architecture");
    expect(n.code).toBe("class A {}");
  });

  it("round-trips to render-equal content", () => {
    const back = recompose(decompose(sample));
    // Render-level equality: decompose again must match.
    expect(decompose(back)).toEqual(decompose(sample));
  });
});

describe("decompose/recompose new optional fields", () => {
  const rich: TopicContent = {
    id: "z",
    blockId: 1,
    title: "T",
    summary: "s",
    deepDive: "d",
    code: "c",
    interviewQs: [],
    tip: "t",
    springConnection: null,
    tldr: "кратко\n\n---\n\nshort",
    checkpoints: [{ id: "cp1", prompt: "п\n\n---\n\np", answer: "о\n\n---\n\na" }],
    keyTerms: [{ term: "treeify", definition: "де\n\n---\n\ndef" }],
  };

  it("decomposes present optional fields to Loc", () => {
    const n = decompose(rich);
    expect(n.tldr).toEqual({ ru: "кратко", en: "short" });
    expect(n.checkpoints?.[0]).toEqual({ id: "cp1", prompt: { ru: "п", en: "p" }, answer: { ru: "о", en: "a" } });
    expect(n.keyTerms?.[0]).toEqual({ term: "treeify", definition: { ru: "де", en: "def" } });
  });

  it("omits absent optional fields (legacy stays clean)", () => {
    const legacy: TopicContent = { id: "l", blockId: 1, title: "T", summary: "s", deepDive: "d", code: "c", interviewQs: [], tip: "t", springConnection: null };
    const n = decompose(legacy);
    expect("tldr" in n).toBe(false);
    expect("checkpoints" in n).toBe(false);
  });

  it("round-trips present optional fields", () => {
    expect(decompose(recompose(decompose(rich)))).toEqual(decompose(rich));
  });
});

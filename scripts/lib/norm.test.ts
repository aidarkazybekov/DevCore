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

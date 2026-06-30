import { describe, it, expect } from "vitest";
import { serializeNote, parseNotePair } from "./note";
import type { NormTopic } from "./norm";

const n: NormTopic = {
  id: "1-1",
  blockId: 1,
  diagram: "jvm-architecture",
  title: { ru: "JVM", en: "JVM" },
  summary: { ru: "кратко", en: "short" },
  deepDive: { ru: "## Раздел\nтекст", en: "## Section\ntext" },
  tip: { ru: "совет", en: "tip" },
  code: 'class A {\n  void x() {}\n}',
  interviewQs: [
    { id: "1-1-q1", difficulty: "senior", q: { ru: "вопрос", en: "question" }, a: { ru: "ответ", en: "answer" } },
  ],
  spring: {
    concept: { ru: "к1\n\nк2", en: "c1\n\nc2" },
    springFeature: { ru: "ф", en: "f" },
    explanation: { ru: "строка1\n\nстрока2\n- пункт", en: "line1\n\nline2\n- bullet" },
  },
};

describe("note serialize/parse round-trip", () => {
  it("preserves every field, including deepDive that contains its own ## headings", () => {
    const { en, ru } = serializeNote(n, "java-core", "draft");
    const back = parseNotePair(en, ru);
    expect(back.title).toEqual(n.title);
    expect(back.summary).toEqual(n.summary);
    expect(back.deepDive).toEqual(n.deepDive);   // n.deepDive has a `## Section` heading — must survive
    expect(back.tip).toEqual(n.tip);
    expect(back.code).toBe(n.code);
    expect(back.interviewQs).toEqual(n.interviewQs);
    expect(back.spring).toEqual(n.spring);
    expect(back.diagram).toBe("jvm-architecture");
    expect(back.blockId).toBe(1);
    expect(back.id).toBe("1-1");
  });
});

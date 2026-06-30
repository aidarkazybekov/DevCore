import { describe, it, expect } from "vitest";
import { emitTopicModule, emitIndex } from "./emit";
import type { NormTopic } from "./norm";

const n: NormTopic = {
  id: "1-1", blockId: 1, diagram: "jvm-architecture",
  title: { ru: "JVM", en: "JVM" }, summary: { ru: "к", en: "s" },
  deepDive: { ru: "г", en: "d" }, tip: { ru: "с", en: "t" }, code: 'class A {}',
  interviewQs: [{ id: "1-1-q1", difficulty: "senior", q: { ru: "в", en: "q" }, a: { ru: "о", en: "a" } }],
  spring: null,
};

describe("emit", () => {
  it("emits a compilable, importable module", () => {
    const src = emitTopicModule(n);
    expect(src).toContain('import { TopicContent } from "@/lib/types";');
    expect(src).toContain("export const topic: TopicContent =");
    expect(src).toContain('"id": "1-1"');
  });
  it("emits a lazy-import index with one entry per id, preserving the helper + named export", () => {
    const idx = emitIndex(["1-1", "2-3"]);
    expect(idx).toContain('"1-1": () => import("./1-1")');
    expect(idx).toContain('"2-3": () => import("./2-3")');
    expect(idx).toContain("export async function getTopicContent");
    expect(idx).toContain("export { contentModules }");
  });
});

import { describe, it, expect } from "vitest";
import { resolveTopic } from "./resolve-topic";
import type { TopicContent } from "./types";

const legacy: TopicContent = {
  id: "l", blockId: 1, title: "T", summary: "S", deepDive: "D", code: "C",
  interviewQs: [], tip: "TIP", springConnection: null,
};

const rich: TopicContent = {
  ...legacy, id: "r", tldr: "TLDR", analogy: "AN", whatWhy: "WW",
  howItWorks: "HIW", gotcha: "G", recap: "R",
  checkpoints: [{ id: "cp1", prompt: "p", answer: "a" }],
  keyTerms: [{ term: "k", definition: "d" }],
};

describe("resolveTopic", () => {
  it("falls back to legacy fields", () => {
    const r = resolveTopic(legacy);
    expect(r.tldr).toBe("S");
    expect(r.howItWorks).toBe("D");
    expect(r.gotcha).toBe("TIP");
    expect(r.analogy).toBeUndefined();
    expect(r.recap).toBeUndefined();
    expect(r.checkpoints).toEqual([]);
    expect(r.keyTerms).toEqual([]);
  });

  it("prefers authored fields", () => {
    const r = resolveTopic(rich);
    expect(r.tldr).toBe("TLDR");
    expect(r.howItWorks).toBe("HIW");
    expect(r.gotcha).toBe("G");
    expect(r.analogy).toBe("AN");
    expect(r.checkpoints).toHaveLength(1);
  });

  it("treats empty tip as no gotcha", () => {
    expect(resolveTopic({ ...legacy, tip: "" }).gotcha).toBeUndefined();
  });
});

describe("resolveTopic diagram mapping", () => {
  const base = { id: "x", blockId: 1, title: "T", summary: "s", deepDive: "d",
    code: "c", tip: "t", interviewQs: [], springConnection: null } as unknown as TopicContent;

  it("maps a plain diagram key to a react ref", () => {
    expect(resolveTopic({ ...base, diagram: "jvm-architecture" }).diagram)
      .toEqual({ kind: "react", key: "jvm-architecture" });
  });
  it("maps diagram:mermaid + diagramSrc to a mermaid ref", () => {
    expect(resolveTopic({ ...base, diagram: "mermaid", diagramSrc: "graph TD\n A-->B" }).diagram)
      .toEqual({ kind: "mermaid", src: "graph TD\n A-->B" });
  });
  it("omits the diagram when mermaid is declared but src is missing", () => {
    expect(resolveTopic({ ...base, diagram: "mermaid" }).diagram).toBeUndefined();
  });
  it("omits the diagram when none is set", () => {
    expect(resolveTopic(base).diagram).toBeUndefined();
  });
});

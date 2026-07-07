import { describe, it, expect } from "vitest";
import { annotateTerms } from "./key-terms";

describe("annotateTerms", () => {
  it("marks only the first occurrence of a term", () => {
    const segs = annotateTerms("treeify then treeify again", ["treeify"]);
    expect(segs).toEqual([
      { text: "treeify", term: "treeify" },
      { text: " then treeify again" },
    ]);
  });
  it("is case-insensitive but preserves original casing in the text", () => {
    const segs = annotateTerms("A HashMap resizes", ["hashmap"]);
    expect(segs.find((s) => s.term)).toEqual({ text: "HashMap", term: "hashmap" });
  });
  it("returns one plain segment when no term matches", () => {
    expect(annotateTerms("nothing here", ["treeify"])).toEqual([{ text: "nothing here" }]);
  });
  it("returns one plain segment for empty term list", () => {
    expect(annotateTerms("plain", [])).toEqual([{ text: "plain" }]);
  });
  it("supports first-occurrence-across-calls via a shared used-set filter", () => {
    const terms = ["heap"];
    const used = new Set<string>();
    const firstRemaining = terms.filter((t) => !used.has(t.toLowerCase()));
    const seg1 = annotateTerms("the heap grows", firstRemaining);
    seg1.filter((s) => s.term).forEach((s) => used.add(s.term!.toLowerCase()));
    expect(seg1.some((s) => s.term === "heap")).toBe(true);

    const secondRemaining = terms.filter((t) => !used.has(t.toLowerCase()));
    const seg2 = annotateTerms("the heap again", secondRemaining);
    expect(seg2.some((s) => s.term)).toBe(false); // already used → not underlined
  });
});

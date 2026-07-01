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
});

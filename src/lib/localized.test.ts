import { describe, it, expect } from "vitest";
import { splitLocalized, joinLocalized } from "./localized";

describe("splitLocalized", () => {
  it("splits RU first, EN second", () => {
    expect(splitLocalized("привет\n\n---\n\nhello")).toEqual({ ru: "привет", en: "hello" });
  });
  it("returns the same text for both when no separator", () => {
    expect(splitLocalized("JVM Architecture")).toEqual({ ru: "JVM Architecture", en: "JVM Architecture" });
  });
});

describe("joinLocalized round-trip", () => {
  it("preserves split output for bilingual text", () => {
    const joined = joinLocalized("привет", "hello");
    expect(splitLocalized(joined)).toEqual({ ru: "привет", en: "hello" });
  });
  it("emits a single string when both sides are equal", () => {
    expect(joinLocalized("JVM Architecture", "JVM Architecture")).toBe("JVM Architecture");
  });
});

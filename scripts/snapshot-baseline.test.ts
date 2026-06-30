import { describe, it, expect } from "vitest";
import baseline from "../tests/fixtures/content-baseline.json";

describe("content baseline fixture", () => {
  const entries = Object.entries(baseline as Record<string, { id: string; blockId: number; title: { ru: string; en: string } }>);

  it("covers many topics", () => {
    expect(entries.length).toBeGreaterThan(100);
  });

  it("every topic has a non-empty EN and RU title", () => {
    for (const [id, t] of entries) {
      expect(t.title.en, `${id} en title`).not.toBe("");
      expect(t.title.ru, `${id} ru title`).not.toBe("");
    }
  });
});

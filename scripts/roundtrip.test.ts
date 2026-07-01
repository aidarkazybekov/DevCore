import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decompose } from "./lib/norm";
import baseline from "../tests/fixtures/content-baseline.json";

// The baseline captures the ORIGINAL topic shape. New optional fields
// (tldr/analogy/checkpoints/…) are additive and intentionally absent from it,
// so we compare only the original keys — proving existing content is never lost
// or altered, while allowing authored enrichment.
const ORIGINAL_KEYS = [
  "id", "blockId", "diagram", "title", "summary", "deepDive", "tip", "code", "interviewQs", "spring",
] as const;

function pickOriginal(n: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of ORIGINAL_KEYS) if (k in n) o[k] = n[k];
  return o;
}

describe("vault → compile round-trip preserves original content", () => {
  const ids = Object.keys(baseline as Record<string, unknown>);

  it("regenerates every topic's original fields identically", async () => {
    for (const id of ids) {
      const mod = await import(resolve(`src/data/content/${id}.ts`));
      const regenerated = pickOriginal(decompose(mod.topic) as unknown as Record<string, unknown>);
      expect(regenerated, `topic ${id}`).toEqual((baseline as Record<string, unknown>)[id]);
    }
  });

  it("the source TS files exist", () => {
    for (const id of ids) {
      expect(() => readFileSync(resolve(`src/data/content/${id}.ts`), "utf8")).not.toThrow();
    }
  });
});

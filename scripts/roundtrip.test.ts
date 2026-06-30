import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decompose } from "./lib/norm";
import baseline from "../tests/fixtures/content-baseline.json";

describe("vault → compile round-trip is render-identical", () => {
  const ids = Object.keys(baseline as Record<string, unknown>);

  it("regenerates every topic with identical RU/EN content", async () => {
    for (const id of ids) {
      const mod = await import(resolve(`src/data/content/${id}.ts`));
      const regenerated = decompose(mod.topic);
      expect(regenerated, `topic ${id}`).toEqual((baseline as Record<string, unknown>)[id]);
    }
  });

  it("the source TS files exist", () => {
    for (const id of ids) {
      expect(() => readFileSync(resolve(`src/data/content/${id}.ts`), "utf8")).not.toThrow();
    }
  });
});

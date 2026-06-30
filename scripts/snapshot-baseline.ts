import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { decompose, type NormTopic } from "./lib/norm";

async function main() {
  // Import the lazy-loaded content map and resolve every module.
  const { contentModules } = (await import("../src/data/content/index")) as {
    contentModules: Record<string, () => Promise<{ topic: import("../src/lib/types").TopicContent }>>;
  };

  const out: Record<string, NormTopic> = {};
  for (const id of Object.keys(contentModules)) {
    const mod = await contentModules[id]();
    out[id] = decompose(mod.topic);
  }

  const dir = resolve("tests/fixtures");
  mkdirSync(dir, { recursive: true });
  const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
  writeFileSync(resolve(dir, "content-baseline.json"), JSON.stringify(sorted, null, 2) + "\n");
  console.log(`Wrote baseline for ${Object.keys(out).length} topics`);
}

main();

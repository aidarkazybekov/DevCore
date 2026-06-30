import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type { NormTopic } from "./lib/norm";
import { serializeNote } from "./lib/note";
import { blockFolder } from "./lib/paths";

const baseline = JSON.parse(
  readFileSync(resolve("tests/fixtures/content-baseline.json"), "utf8"),
) as Record<string, NormTopic>;

let count = 0;
for (const [id, n] of Object.entries(baseline)) {
  const folder = blockFolder(n.blockId);
  const { en, ru } = serializeNote(n, "java-core", "draft");
  const enPath = resolve(`${folder}/${id}.md`);
  const ruPath = resolve(`${folder}/ru/${id}.md`);
  mkdirSync(dirname(enPath), { recursive: true });
  mkdirSync(dirname(ruPath), { recursive: true });
  writeFileSync(enPath, en);
  writeFileSync(ruPath, ru);
  count++;
}
console.log(`Migrated ${count} topics into content/`);

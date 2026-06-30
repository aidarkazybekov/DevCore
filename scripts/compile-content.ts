import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import matter from "gray-matter";
import { parseNotePair } from "./lib/note";
import { validateTopic } from "./lib/validate";
import { emitTopicModule, emitIndex } from "./lib/emit";

const CONTENT_ROOT = resolve("content");
const OUT_DIR = resolve("src/data/content");

function findEnNotes(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "ru" || entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      if (entry.name === "00-project") continue;
      out.push(...findEnNotes(full));
    } else if (entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  if (!existsSync(CONTENT_ROOT)) {
    console.error("content/ vault not found — run `npm run migrate-content` first.");
    process.exit(1);
  }

  const enNotes = findEnNotes(CONTENT_ROOT);
  const ids: string[] = [];
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  mkdirSync(OUT_DIR, { recursive: true });
  // Clear previously generated topic modules + index (keep nothing stale).
  for (const f of readdirSync(OUT_DIR)) {
    if (f.endsWith(".ts")) rmSync(join(OUT_DIR, f));
  }

  for (const enPath of enNotes) {
    const enRaw = readFileSync(enPath, "utf8");
    const fm = matter(enRaw).data;
    if (!fm.id || fm.id === "BLOCK-N") continue; // skip non-topic files (README, templates)
    const id = String(fm.id);
    const status = (fm.status === "published" ? "published" : "draft") as "published" | "draft";
    const ruPath = join(enPath, "..", "ru", `${id}.md`);
    const ruRaw = existsSync(ruPath) ? readFileSync(ruPath, "utf8") : "";

    const topic = parseNotePair(enRaw, ruRaw);
    const { errors, warnings } = validateTopic(topic, status);
    allErrors.push(...errors);
    allWarnings.push(...warnings);

    writeFileSync(join(OUT_DIR, `${id}.ts`), emitTopicModule(topic));
    ids.push(id);
  }

  writeFileSync(join(OUT_DIR, "index.ts"), emitIndex(ids));

  if (allWarnings.length) {
    console.warn(`⚠ ${allWarnings.length} content warnings (draft topics):`);
    for (const w of allWarnings.slice(0, 20)) console.warn("  " + w);
    if (allWarnings.length > 20) console.warn(`  …and ${allWarnings.length - 20} more`);
  }
  if (allErrors.length) {
    console.error(`✖ ${allErrors.length} content errors (published topics):`);
    for (const e of allErrors) console.error("  " + e);
    process.exit(1);
  }
  console.log(`Compiled ${ids.length} topics → src/data/content/`);
}

main();

import { ROADMAP } from "../../src/data/roadmap";

function slug(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function blockFolder(blockId: number): string {
  const block = ROADMAP.find((b) => b.id === blockId);
  const title = block ? slug(block.title) : `block-${blockId}`;
  const nn = String(blockId).padStart(2, "0");
  return `content/java-core/${nn}-${title}`;
}

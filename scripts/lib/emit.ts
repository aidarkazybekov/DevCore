import { recompose, type NormTopic } from "./norm";

export function emitTopicModule(n: NormTopic): string {
  const topic = recompose(n);
  const body = JSON.stringify(topic, null, 2);
  return (
    `import { TopicContent } from "@/lib/types";\n\n` +
    `export const topic: TopicContent = ${body};\n`
  );
}

export function emitIndex(ids: string[]): string {
  const sorted = [...ids].sort();
  const entries = sorted
    .map((id) => `  ${JSON.stringify(id)}: () => import(${JSON.stringify("./" + id)}),`)
    .join("\n");
  // Regenerate the FULL index.ts — the map PLUS the getTopicContent helper and
  // named export that the app imports (`import { getTopicContent } from "@/data/content"`).
  return (
    `import { TopicContent } from "@/lib/types";\n\n` +
    `const contentModules: Record<string, () => Promise<{ topic: TopicContent }>> = {\n` +
    `${entries}\n};\n\n` +
    `export async function getTopicContent(id: string): Promise<TopicContent | null> {\n` +
    `  const loader = contentModules[id];\n` +
    `  if (!loader) return null;\n` +
    `  const mod = await loader();\n` +
    `  return mod.topic;\n` +
    `}\n\n` +
    `export { contentModules };\n`
  );
}

import { notFound } from "next/navigation";
import { highlightJava } from "@/lib/highlighter";
import { ROADMAP } from "@/data/roadmap";
import { getTopicContent } from "@/data/content";
import { getTopic } from "@/data/roadmap";
import TopicClient from "./TopicClient";

export async function generateStaticParams() {
  return ROADMAP.flatMap((block) =>
    block.topics.map((topic) => ({ id: topic.id }))
  );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meta = getTopic(id);
  if (!meta) notFound();

  const content = await getTopicContent(id);
  if (!content) notFound();

  const highlightedCode = await highlightJava(content.code);

  const topicIndexInBlock = meta.block.topics.findIndex((t) => t.id === id);

  return (
    <TopicClient
      content={content}
      blockId={meta.block.id}
      blockTitle={meta.block.title}
      blockIcon={meta.block.icon}
      topicIndexInBlock={topicIndexInBlock}
      blockTopicCount={meta.block.topics.length}
      highlightedCode={highlightedCode}
    />
  );
}

import type { TopicContent, Checkpoint, KeyTerm, InterviewQuestion, SpringConnection } from "./types";

export type DiagramRef = { kind: "react"; key: string } | { kind: "mermaid"; src: string };

function toDiagramRef(c: TopicContent): DiagramRef | undefined {
  if (c.diagram === "mermaid") return c.diagramSrc ? { kind: "mermaid", src: c.diagramSrc } : undefined;
  if (c.diagram) return { kind: "react", key: c.diagram };
  return undefined;
}

export interface ResolvedTopic {
  id: string;
  blockId: number;
  title: string;
  tldr: string;              // bilingual — always present (falls back to summary)
  analogy?: string;
  whatWhy?: string;
  howItWorks: string;        // always present (falls back to deepDive)
  code: string;
  gotcha?: string;           // falls back to tip; empty tip → undefined
  recap?: string;
  checkpoints: Checkpoint[];
  keyTerms: KeyTerm[];
  interviewQs: InterviewQuestion[];
  springConnection: SpringConnection | null;
  diagram?: DiagramRef;
}

export function resolveTopic(c: TopicContent): ResolvedTopic {
  return {
    id: c.id,
    blockId: c.blockId,
    title: c.title,
    tldr: c.tldr ?? c.summary,
    analogy: c.analogy,
    whatWhy: c.whatWhy,
    howItWorks: c.howItWorks ?? c.deepDive,
    code: c.code,
    gotcha: c.gotcha ?? (c.tip ? c.tip : undefined),
    recap: c.recap,
    checkpoints: c.checkpoints ?? [],
    keyTerms: c.keyTerms ?? [],
    interviewQs: c.interviewQs,
    springConnection: c.springConnection,
    diagram: toDiagramRef(c),
  };
}

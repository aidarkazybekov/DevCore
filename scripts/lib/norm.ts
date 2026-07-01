import { splitLocalized, joinLocalized } from "../../src/lib/localized";
import type { TopicContent, InterviewQuestion, SpringConnection } from "../../src/lib/types";

export interface Loc { ru: string; en: string }
export interface NormQ { id: string; difficulty: InterviewQuestion["difficulty"]; q: Loc; a: Loc }
export interface NormSpring { concept: Loc; springFeature: Loc; explanation: Loc }
export interface NormCheckpoint { id: string; prompt: Loc; answer: Loc }
export interface NormKeyTerm { term: string; definition: Loc }
export interface NormTopic {
  id: string;
  blockId: number;
  diagram?: string;
  title: Loc;
  summary: Loc;
  deepDive: Loc;
  tip: Loc;
  code: string;
  interviewQs: NormQ[];
  spring: NormSpring | null;
  tldr?: Loc;
  analogy?: Loc;
  whatWhy?: Loc;
  howItWorks?: Loc;
  gotcha?: Loc;
  recap?: Loc;
  checkpoints?: NormCheckpoint[];
  keyTerms?: NormKeyTerm[];
}

const L = (s: string): Loc => splitLocalized(s);
const J = (l: Loc): string => joinLocalized(l.ru, l.en);

export function decompose(t: TopicContent): NormTopic {
  const n: NormTopic = {
    id: t.id,
    blockId: t.blockId,
    diagram: t.diagram,
    title: L(t.title),
    summary: L(t.summary),
    deepDive: L(t.deepDive),
    tip: L(t.tip),
    code: t.code,
    interviewQs: t.interviewQs.map((q) => ({
      id: q.id,
      difficulty: q.difficulty,
      q: L(q.q),
      a: L(q.a),
    })),
    spring: t.springConnection
      ? {
          concept: L(t.springConnection.concept),
          springFeature: L(t.springConnection.springFeature),
          explanation: L(t.springConnection.explanation),
        }
      : null,
  };
  if (t.tldr !== undefined) n.tldr = L(t.tldr);
  if (t.analogy !== undefined) n.analogy = L(t.analogy);
  if (t.whatWhy !== undefined) n.whatWhy = L(t.whatWhy);
  if (t.howItWorks !== undefined) n.howItWorks = L(t.howItWorks);
  if (t.gotcha !== undefined) n.gotcha = L(t.gotcha);
  if (t.recap !== undefined) n.recap = L(t.recap);
  if (t.checkpoints) n.checkpoints = t.checkpoints.map((c) => ({ id: c.id, prompt: L(c.prompt), answer: L(c.answer) }));
  if (t.keyTerms) n.keyTerms = t.keyTerms.map((k) => ({ term: k.term, definition: L(k.definition) }));
  return n;
}

export function recompose(n: NormTopic): TopicContent {
  const spring: SpringConnection | null = n.spring
    ? {
        concept: J(n.spring.concept),
        springFeature: J(n.spring.springFeature),
        explanation: J(n.spring.explanation),
      }
    : null;
  const topic: TopicContent = {
    id: n.id,
    blockId: n.blockId,
    title: J(n.title),
    summary: J(n.summary),
    deepDive: J(n.deepDive),
    code: n.code,
    interviewQs: n.interviewQs.map((q) => ({
      id: q.id,
      q: J(q.q),
      a: J(q.a),
      difficulty: q.difficulty,
    })),
    tip: J(n.tip),
    springConnection: spring,
  };
  if (n.diagram !== undefined) topic.diagram = n.diagram;
  if (n.tldr) topic.tldr = J(n.tldr);
  if (n.analogy) topic.analogy = J(n.analogy);
  if (n.whatWhy) topic.whatWhy = J(n.whatWhy);
  if (n.howItWorks) topic.howItWorks = J(n.howItWorks);
  if (n.gotcha) topic.gotcha = J(n.gotcha);
  if (n.recap) topic.recap = J(n.recap);
  if (n.checkpoints) topic.checkpoints = n.checkpoints.map((c) => ({ id: c.id, prompt: J(c.prompt), answer: J(c.answer) }));
  if (n.keyTerms) topic.keyTerms = n.keyTerms.map((k) => ({ term: k.term, definition: J(k.definition) }));
  return topic;
}

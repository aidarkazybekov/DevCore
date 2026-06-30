import { splitLocalized, joinLocalized } from "../../src/lib/localized";
import type { TopicContent, InterviewQuestion, SpringConnection } from "../../src/lib/types";

export interface Loc { ru: string; en: string }
export interface NormQ { id: string; difficulty: InterviewQuestion["difficulty"]; q: Loc; a: Loc }
export interface NormSpring { concept: Loc; springFeature: Loc; explanation: Loc }
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
}

const L = (s: string): Loc => splitLocalized(s);
const J = (l: Loc): string => joinLocalized(l.ru, l.en);

export function decompose(t: TopicContent): NormTopic {
  return {
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
  return topic;
}

import matter from "gray-matter";
import type { NormTopic, NormQ, Loc } from "./norm";

const HEADING = /^##\s+(.+?)\s*$/;
const Q_HEAD = /^###\s+\[([^|\]]+)\|([^\]]+)\]\s*(.*)$/;

// A `## X` line is a section boundary ONLY when X is a reserved name.
// Any other `##` (e.g. `## Runtime Data Areas` inside a deepDive) is content.
const RESERVED = new Set([
  "title", "summary", "deep dive", "code", "tip", "spring", "interview",
  "tl;dr", "analogy", "what & why", "how it works", "gotcha", "recap", "checkpoint", "key terms", "diagram",
]);

/** Split markdown body (frontmatter already stripped) into reserved `## Section` → text. */
function sectionize(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let cur: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (cur) out[cur] = buf.join("\n").trim();
    buf = [];
  };
  for (const line of body.split("\n")) {
    const m = line.match(HEADING);
    if (m && RESERVED.has(m[1].trim().toLowerCase())) {
      flush();
      cur = m[1].trim().toLowerCase();
    } else if (cur) {
      buf.push(line);
    }
  }
  flush();
  return out;
}

function fence(code: string): string {
  return "```java\n" + code + "\n```";
}
function unfence(block: string): string {
  return block.replace(/^```[a-z]*\n/, "").replace(/\n```$/, "").replace(/```$/, "").trim();
}

function parseInterview(enText: string, ruText: string): NormQ[] {
  const parse = (text: string) => {
    const items: { id: string; difficulty: string; q: string; a: string }[] = [];
    let cur: { id: string; difficulty: string; q: string; a: string } | null = null;
    let buf: string[] = [];
    const flush = () => {
      if (cur) {
        cur.a = buf.join("\n").trim();
        items.push(cur);
      }
      buf = [];
    };
    for (const line of text.split("\n")) {
      const m = line.match(Q_HEAD);
      if (m) {
        flush();
        cur = { id: m[1].trim(), difficulty: m[2].trim(), q: m[3].trim(), a: "" };
      } else if (cur) {
        buf.push(line);
      }
    }
    flush();
    return items;
  };
  const en = parse(enText);
  const ru = parse(ruText);
  return en.map((e, i) => ({
    id: e.id,
    difficulty: e.difficulty as NormQ["difficulty"],
    q: { ru: ru[i]?.q ?? "", en: e.q },
    a: { ru: ru[i]?.a ?? "", en: e.a },
  }));
}

function parseSpring(enText: string | undefined, ruText: string | undefined) {
  if (!enText) return null;
  const kv = (text: string) => {
    const o: Record<string, string> = {};
    let cur: string | null = null;
    let buf: string[] = [];
    const flush = () => { if (cur) o[cur] = buf.join("\n").trim(); buf = []; };
    for (const line of text.split("\n")) {
      const m = line.match(/^###\s+(concept|springFeature|explanation)\s*$/);
      if (m) { flush(); cur = m[1]; }
      else if (cur) buf.push(line);
    }
    flush();
    return o;
  };
  const e = kv(enText);
  const r = kv(ruText ?? "");
  const loc = (k: string): Loc => ({ ru: r[k] ?? "", en: e[k] ?? "" });
  return { concept: loc("concept"), springFeature: loc("springFeature"), explanation: loc("explanation") };
}

function parseCheckpoints(enText: string | undefined, ruText: string | undefined) {
  if (enText === undefined && ruText === undefined) return undefined;
  const side = (text: string) => {
    const items: { id: string; prompt: string; answer: string }[] = [];
    let cur: { id: string; prompt: string; answer: string } | null = null;
    let buf: string[] = [];
    const flush = () => { if (cur) { cur.answer = buf.join("\n").trim(); items.push(cur); } buf = []; };
    for (const line of text.split("\n")) {
      const m = line.match(/^###\s+\[([^\]]+)\]\s*(.*)$/);
      if (m) { flush(); cur = { id: m[1].trim(), prompt: m[2].trim(), answer: "" }; }
      else if (cur) buf.push(line);
    }
    flush();
    return items;
  };
  const en = side(enText ?? "");
  const ru = side(ruText ?? "");
  return en.map((e, i) => ({
    id: e.id,
    prompt: { ru: ru[i]?.prompt ?? "", en: e.prompt },
    answer: { ru: ru[i]?.answer ?? "", en: e.answer },
  }));
}

function parseKeyTerms(enText: string | undefined, ruText: string | undefined) {
  if (enText === undefined && ruText === undefined) return undefined;
  const side = (text: string) => {
    const items: { term: string; definition: string }[] = [];
    let cur: { term: string; definition: string } | null = null;
    let buf: string[] = [];
    const flush = () => { if (cur) { cur.definition = buf.join("\n").trim(); items.push(cur); } buf = []; };
    for (const line of text.split("\n")) {
      const m = line.match(/^###\s+(.+?)\s*$/);
      if (m) { flush(); cur = { term: m[1].trim(), definition: "" }; }
      else if (cur) buf.push(line);
    }
    flush();
    return items;
  };
  const en = side(enText ?? "");
  const ru = side(ruText ?? "");
  return en.map((e, i) => ({ term: e.term, definition: { ru: ru[i]?.definition ?? "", en: e.definition } }));
}

export function serializeNote(n: NormTopic, track: string, status: "draft" | "published") {
  const fm = (locale: "ru" | "en") => {
    const lines = ["---", `id: ${n.id}`, `blockId: ${n.blockId}`, `track: ${track}`, `status: ${status}`];
    if (locale === "en" && n.diagram !== undefined) lines.push(`diagram: ${n.diagram}`);
    lines.push("---");
    return lines.join("\n");
  };

  const body = (side: "ru" | "en") => {
    const parts: string[] = [];
    parts.push(`## Title\n${n.title[side]}`);
    parts.push(`## Summary\n${n.summary[side]}`);
    parts.push(`## Deep Dive\n${n.deepDive[side]}`);
    parts.push(`## Code\n${fence(n.code)}`);
    if (n.diagramSrc) parts.push("## Diagram\n```mermaid\n" + n.diagramSrc + "\n```");
    parts.push(`## Tip\n${n.tip[side]}`);
    if (n.spring) {
      parts.push(
        `## Spring\n### concept\n${n.spring.concept[side]}\n\n### springFeature\n${n.spring.springFeature[side]}\n\n### explanation\n${n.spring.explanation[side]}`,
      );
    }
    if (n.tldr) parts.push(`## TL;DR\n${n.tldr[side]}`);
    if (n.analogy) parts.push(`## Analogy\n${n.analogy[side]}`);
    if (n.whatWhy) parts.push(`## What & Why\n${n.whatWhy[side]}`);
    if (n.howItWorks) parts.push(`## How It Works\n${n.howItWorks[side]}`);
    if (n.gotcha) parts.push(`## Gotcha\n${n.gotcha[side]}`);
    if (n.recap) parts.push(`## Recap\n${n.recap[side]}`);
    if (n.checkpoints) {
      const cps = n.checkpoints.map((c) => `### [${c.id}] ${c.prompt[side]}\n${c.answer[side]}`).join("\n\n");
      parts.push(`## Checkpoint\n${cps}`);
    }
    if (n.keyTerms) {
      const kts = n.keyTerms.map((k) => `### ${k.term}\n${k.definition[side]}`).join("\n\n");
      parts.push(`## Key Terms\n${kts}`);
    }
    const qs = n.interviewQs
      .map((q) => `### [${q.id} | ${q.difficulty}] ${q.q[side]}\n${q.a[side]}`)
      .join("\n\n");
    parts.push(`## Interview\n${qs}`);
    return parts.join("\n\n");
  };

  return {
    en: `${fm("en")}\n${body("en")}\n`,
    ru: `${fm("ru")}\n${body("ru")}\n`,
  };
}

export function parseNotePair(enRaw: string, ruRaw: string): NormTopic {
  const en = matter(enRaw);
  const ru = matter(ruRaw);
  const es = sectionize(en.content);
  const rs = sectionize(ru.content);
  const loc = (key: string): Loc => ({ ru: rs[key] ?? "", en: es[key] ?? "" });

  const topic: NormTopic = {
    id: String(en.data.id),
    blockId: Number(en.data.blockId),
    title: loc("title"),
    summary: loc("summary"),
    deepDive: loc("deep dive"),
    tip: loc("tip"),
    code: unfence(es["code"] ?? ""),
    interviewQs: parseInterview(es["interview"] ?? "", rs["interview"] ?? ""),
    spring: parseSpring(es["spring"], rs["spring"]),
  };
  const optLoc = (key: string): Loc | undefined =>
    es[key] !== undefined || rs[key] !== undefined ? { ru: rs[key] ?? "", en: es[key] ?? "" } : undefined;
  const tldr = optLoc("tl;dr"); if (tldr) topic.tldr = tldr;
  const analogy = optLoc("analogy"); if (analogy) topic.analogy = analogy;
  const whatWhy = optLoc("what & why"); if (whatWhy) topic.whatWhy = whatWhy;
  const howItWorks = optLoc("how it works"); if (howItWorks) topic.howItWorks = howItWorks;
  const gotcha = optLoc("gotcha"); if (gotcha) topic.gotcha = gotcha;
  const recap = optLoc("recap"); if (recap) topic.recap = recap;
  const checkpoints = parseCheckpoints(es["checkpoint"], rs["checkpoint"]); if (checkpoints) topic.checkpoints = checkpoints;
  const keyTerms = parseKeyTerms(es["key terms"], rs["key terms"]); if (keyTerms) topic.keyTerms = keyTerms;
  if (en.data.diagram !== undefined) topic.diagram = String(en.data.diagram);
  if (es["diagram"] !== undefined) topic.diagramSrc = unfence(es["diagram"]);
  return topic;
}

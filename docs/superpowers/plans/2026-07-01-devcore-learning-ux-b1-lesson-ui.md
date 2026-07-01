# DevCore Learning UX — Plan B1: Lesson UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the topic page's 4-tab shell with a single-scroll layered lesson driven by a `Quick · Standard · Deep` depth control, in the calm typography-led style, with active-recall (checkpoints, key-term tooltips, mini-quiz, completion nudge) — degrading gracefully for all 106 topics using the existing React diagrams.

**Architecture:** Pure logic (depth→section visibility, quiz sampling, key-term annotation) lives in `src/lib/` and is unit-tested in node. Presentational components live in `src/components/lesson/` and are verified by typecheck + `next build` + a visual check (no React test infra in this repo). `LessonView` assembles the sections from `resolveTopic()` (Plan A) and **reuses** the existing `InterviewTab`/`CodeTab`/`SpringTab`/`Diagram`/`Markdown` inside the layers. `TopicContent`/`TopicClient` are rewired to render `LessonView` + `DepthControl` instead of tabs, keeping the header, reading progress, TOC, prev/next nav, and mark-done.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind v4 / framer-motion. No new dependencies. Design tokens already defined: `text-primary/secondary/muted`, `accent-green/amber/red/cyan`, `bg-primary/card/elevated`, `border`.

## Global Constraints

- **Calm, typography-led visual style:** only the code block and the single **Gotcha** get a boxed callout. TL;DR is a lead line with a thin `accent-green` left rule; analogy is soft italic; recap is a small labelled line. One accent color (`accent-green`); `accent-amber` reserved for the gotcha. Hierarchy via type size/weight/spacing, not borders.
- **Depth control:** `Quick · Standard · Deep`, default `standard`, persisted via `depth.ts` (Plan A, key `devcore:depth`). Keyboard `1/2/3` set quick/standard/deep (replacing the old tab shortcuts). Prev/next (←/→) and `g h`→home shortcuts are preserved.
- **Layer → section mapping (fixed render order; visibility per depth):** Quick = tldr, analogy, diagram, recap. Standard adds whatWhy, howItWorks, code, gotcha, checkpoints. Deep adds interview, spring, glossary. Mini-quiz + completion nudge render at the end at **all** depths.
- **Graceful degradation:** every section reads from `resolveTopic()`; optional sections (analogy, whatWhy, recap, gotcha when no tip, checkpoints, glossary, diagram) render only when present. All 106 legacy topics must render correctly at all three depths.
- **Reuse, don't rebuild:** `InterviewTab` (interview section), `CodeTab` (code), `SpringTab` (spring), `Diagram` (react diagrams), `Markdown` (prose) are reused as-is.
- **Bilingual:** prose fields are bilingual strings; render via `localized(field, locale)`. RU/EN toggle unchanged.
- **No dead UI:** the four `*Tab` files stay (Interview/Code/Spring reused; `LearnTab` becomes unused — remove its import from `TopicContent`, leave the file).

---

### Task 1: `lesson-layers.ts` — depth → section visibility (pure)

**Files:**
- Create: `src/lib/lesson-layers.ts`
- Test: `src/lib/lesson-layers.test.ts`

**Interfaces:**
- Consumes: `Depth` from `./depth`.
- Produces: `type LessonSection`, `visibleSections(depth: Depth): Set<LessonSection>`, `isVisible(section: LessonSection, depth: Depth): boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/lesson-layers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isVisible, visibleSections } from "./lesson-layers";

describe("lesson-layers", () => {
  it("quick shows only tldr/analogy/diagram/recap", () => {
    expect(visibleSections("quick")).toEqual(new Set(["tldr", "analogy", "diagram", "recap"]));
  });
  it("standard adds the lesson body", () => {
    expect(isVisible("howItWorks", "standard")).toBe(true);
    expect(isVisible("code", "standard")).toBe(true);
    expect(isVisible("interview", "standard")).toBe(false);
  });
  it("deep adds interview/spring/glossary", () => {
    expect(isVisible("interview", "deep")).toBe(true);
    expect(isVisible("spring", "deep")).toBe(true);
    expect(isVisible("glossary", "deep")).toBe(true);
  });
  it("tldr is visible at every depth", () => {
    for (const d of ["quick", "standard", "deep"] as const) expect(isVisible("tldr", d)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/lesson-layers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement lesson-layers.ts**

Create `src/lib/lesson-layers.ts`:
```ts
import type { Depth } from "./depth";

export type LessonSection =
  | "tldr" | "analogy" | "diagram" | "recap"
  | "whatWhy" | "howItWorks" | "code" | "gotcha" | "checkpoints"
  | "interview" | "spring" | "glossary";

const QUICK: LessonSection[] = ["tldr", "analogy", "diagram", "recap"];
const STANDARD_ADD: LessonSection[] = ["whatWhy", "howItWorks", "code", "gotcha", "checkpoints"];
const DEEP_ADD: LessonSection[] = ["interview", "spring", "glossary"];

export function visibleSections(depth: Depth): Set<LessonSection> {
  if (depth === "quick") return new Set(QUICK);
  if (depth === "standard") return new Set([...QUICK, ...STANDARD_ADD]);
  return new Set([...QUICK, ...STANDARD_ADD, ...DEEP_ADD]);
}

export function isVisible(section: LessonSection, depth: Depth): boolean {
  return visibleSections(depth).has(section);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/lib/lesson-layers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lesson-layers.ts src/lib/lesson-layers.test.ts
git commit -m "feat: depth → lesson-section visibility"
```

---

### Task 2: `quiz-sample.ts` — deterministic mini-quiz sampling (pure)

**Files:**
- Create: `src/lib/quiz-sample.ts`
- Test: `src/lib/quiz-sample.test.ts`

**Interfaces:**
- Consumes: `InterviewQuestion` from `./types`.
- Produces: `sampleQuizQuestions(qs: InterviewQuestion[], n?: number): InterviewQuestion[]` — the first `n` (default 3), deterministic.

- [ ] **Step 1: Write the failing test**

Create `src/lib/quiz-sample.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { sampleQuizQuestions } from "./quiz-sample";
import type { InterviewQuestion } from "./types";

const q = (id: string): InterviewQuestion => ({ id, q: "q", a: "a", difficulty: "mid" });

describe("sampleQuizQuestions", () => {
  it("returns the first 3 by default", () => {
    const out = sampleQuizQuestions([q("1"), q("2"), q("3"), q("4")]);
    expect(out.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });
  it("returns all when fewer than n", () => {
    expect(sampleQuizQuestions([q("1")]).map((x) => x.id)).toEqual(["1"]);
  });
  it("returns [] for no questions", () => {
    expect(sampleQuizQuestions([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/quiz-sample.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement quiz-sample.ts**

Create `src/lib/quiz-sample.ts`:
```ts
import type { InterviewQuestion } from "./types";

// Deterministic: the first n questions (avoids Math.random flakiness).
export function sampleQuizQuestions(qs: InterviewQuestion[], n = 3): InterviewQuestion[] {
  return qs.slice(0, n);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/lib/quiz-sample.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz-sample.ts src/lib/quiz-sample.test.ts
git commit -m "feat: deterministic mini-quiz sampling"
```

---

### Task 3: `key-terms.ts` — first-occurrence annotation (pure)

**Files:**
- Create: `src/lib/key-terms.ts`
- Test: `src/lib/key-terms.test.ts`

**Interfaces:**
- Produces: `interface Segment { text: string; term?: string }` and `annotateTerms(text: string, terms: string[]): Segment[]` — splits `text` into segments, marking the **first** case-insensitive occurrence of each term (longest terms first); un-marked text stays plain.

- [ ] **Step 1: Write the failing test**

Create `src/lib/key-terms.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { annotateTerms } from "./key-terms";

describe("annotateTerms", () => {
  it("marks only the first occurrence of a term", () => {
    const segs = annotateTerms("treeify then treeify again", ["treeify"]);
    expect(segs).toEqual([
      { text: "treeify", term: "treeify" },
      { text: " then treeify again" },
    ]);
  });
  it("is case-insensitive but preserves original casing in the text", () => {
    const segs = annotateTerms("A HashMap resizes", ["hashmap"]);
    expect(segs.find((s) => s.term)).toEqual({ text: "HashMap", term: "hashmap" });
  });
  it("returns one plain segment when no term matches", () => {
    expect(annotateTerms("nothing here", ["treeify"])).toEqual([{ text: "nothing here" }]);
  });
  it("returns one plain segment for empty term list", () => {
    expect(annotateTerms("plain", [])).toEqual([{ text: "plain" }]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/key-terms.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement key-terms.ts**

Create `src/lib/key-terms.ts`:
```ts
export interface Segment {
  text: string;
  term?: string;
}

// Marks the first case-insensitive occurrence of each term. Longer terms match
// first so "load factor" wins over "load". Non-overlapping.
export function annotateTerms(text: string, terms: string[]): Segment[] {
  const wanted = [...terms].filter((t) => t.trim()).sort((a, b) => b.length - a.length);
  if (wanted.length === 0) return [{ text }];

  type Hit = { start: number; end: number; term: string };
  const hits: Hit[] = [];
  const lower = text.toLowerCase();
  for (const term of wanted) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx === -1) continue;
    const end = idx + term.length;
    if (hits.some((h) => idx < h.end && end > h.start)) continue; // skip overlaps
    hits.push({ start: idx, end, term });
  }
  if (hits.length === 0) return [{ text }];

  hits.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.start > cursor) segments.push({ text: text.slice(cursor, h.start) });
    segments.push({ text: text.slice(h.start, h.end), term: h.term });
    cursor = h.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/lib/key-terms.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/key-terms.ts src/lib/key-terms.test.ts
git commit -m "feat: first-occurrence key-term annotation"
```

---

### Task 4: `useDepth` hook + `DepthControl`

**Files:**
- Create: `src/lib/use-depth.ts`
- Create: `src/components/lesson/DepthControl.tsx`

**Interfaces:**
- Consumes: `Depth`, `DEFAULT_DEPTH`, `loadDepth`, `saveDepth` from `./depth` (Plan A).
- Produces: `useDepth(): [Depth, (d: Depth) => void]`; `DepthControl({ depth, onChange, locale }: { depth: Depth; onChange: (d: Depth) => void; locale: "ru" | "en" })`.

- [ ] **Step 1: Implement the hook**

Create `src/lib/use-depth.ts`:
```ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { type Depth, DEFAULT_DEPTH, loadDepth, saveDepth } from "./depth";

export function useDepth(): [Depth, (d: Depth) => void] {
  const [depth, setDepthState] = useState<Depth>(DEFAULT_DEPTH);
  useEffect(() => {
    setDepthState(loadDepth());
  }, []);
  const setDepth = useCallback((d: Depth) => {
    setDepthState(d);
    saveDepth(d);
  }, []);
  return [depth, setDepth];
}
```

- [ ] **Step 2: Implement DepthControl**

Create `src/components/lesson/DepthControl.tsx`:
```tsx
"use client";
import type { Depth } from "@/lib/depth";

const OPTIONS: { id: Depth; ru: string; en: string }[] = [
  { id: "quick", ru: "Кратко", en: "Quick" },
  { id: "standard", ru: "Обычно", en: "Standard" },
  { id: "deep", ru: "Глубоко", en: "Deep" },
];

export default function DepthControl({
  depth,
  onChange,
  locale,
}: {
  depth: Depth;
  onChange: (d: Depth) => void;
  locale: "ru" | "en";
}) {
  return (
    <div
      role="group"
      aria-label={locale === "ru" ? "Глубина" : "Depth"}
      className="inline-flex rounded-lg border border-border overflow-hidden"
    >
      {OPTIONS.map((o, i) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={depth === o.id}
          aria-label={`${locale === "ru" ? o.ru : o.en} (${i + 1})`}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1 text-[11px] transition-colors ${
            depth === o.id
              ? "bg-accent-green/15 text-accent-green font-semibold"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {locale === "ru" ? o.ru : o.en}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/use-depth.ts src/components/lesson/DepthControl.tsx
git commit -m "feat: useDepth hook + DepthControl segmented control"
```

---

### Task 5: Lesson prose & recall components

**Files:**
- Create: `src/components/lesson/KeyTermText.tsx`, `TldrLead.tsx`, `Analogy.tsx`, `Gotcha.tsx`, `Recap.tsx`, `Checkpoint.tsx`, `Glossary.tsx`, `CompletionNudge.tsx`

**Interfaces:**
- Consumes: `annotateTerms` from `@/lib/key-terms`; `KeyTerm`, `Checkpoint as CheckpointT` from `@/lib/types`; `localized` from `@/lib/i18n`.
- Produces (default exports): `KeyTermText({ text, keyTerms, locale })`; `TldrLead`, `Analogy`, `Gotcha`, `Recap` (all `{ text, keyTerms, locale }`); `Checkpoint({ prompt, answer, locale })`; `Glossary({ terms, locale })`; `CompletionNudge({ locale, onStart })`.

- [ ] **Step 1: KeyTermText (underline + tooltip via title)**

Create `src/components/lesson/KeyTermText.tsx`:
```tsx
"use client";
import { annotateTerms } from "@/lib/key-terms";
import { localized } from "@/lib/i18n";
import type { KeyTerm } from "@/lib/types";

export default function KeyTermText({
  text,
  keyTerms,
  locale,
}: {
  text: string;
  keyTerms: KeyTerm[];
  locale: "ru" | "en";
}) {
  if (keyTerms.length === 0) return <>{text}</>;
  const defByTerm = new Map(keyTerms.map((k) => [k.term.toLowerCase(), localized(k.definition, locale)]));
  const segs = annotateTerms(text, keyTerms.map((k) => k.term));
  return (
    <>
      {segs.map((s, i) =>
        s.term ? (
          <span
            key={i}
            title={defByTerm.get(s.term.toLowerCase()) ?? ""}
            className="border-b border-dashed border-accent-green/60 cursor-help"
          >
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
  );
}
```

- [ ] **Step 2: TldrLead, Analogy, Gotcha, Recap**

Create `src/components/lesson/TldrLead.tsx`:
```tsx
"use client";
import KeyTermText from "./KeyTermText";
import type { KeyTerm } from "@/lib/types";

export default function TldrLead({ text, keyTerms, locale }: { text: string; keyTerms: KeyTerm[]; locale: "ru" | "en" }) {
  return (
    <p className="text-[15px] leading-[1.65] text-text-primary pl-3.5 border-l-2 border-accent-green">
      <KeyTermText text={text} keyTerms={keyTerms} locale={locale} />
    </p>
  );
}
```
Create `src/components/lesson/Analogy.tsx`:
```tsx
"use client";
import KeyTermText from "./KeyTermText";
import type { KeyTerm } from "@/lib/types";

export default function Analogy({ text, keyTerms, locale }: { text: string; keyTerms: KeyTerm[]; locale: "ru" | "en" }) {
  return (
    <p className="italic text-[13px] leading-[1.7] text-text-muted">
      <span className="not-italic text-text-secondary font-medium">{locale === "ru" ? "Представь: " : "Think of it like: "}</span>
      <KeyTermText text={text} keyTerms={keyTerms} locale={locale} />
    </p>
  );
}
```
Create `src/components/lesson/Gotcha.tsx` (the ONE boxed callout, amber):
```tsx
"use client";
import KeyTermText from "./KeyTermText";
import type { KeyTerm } from "@/lib/types";

export default function Gotcha({ text, keyTerms, locale }: { text: string; keyTerms: KeyTerm[]; locale: "ru" | "en" }) {
  return (
    <div className="flex gap-2.5 rounded-md border border-[#2e2712] bg-[#15130a] px-3.5 py-3 text-[12.5px] leading-[1.7] text-text-secondary">
      <span className="text-accent-amber" aria-hidden="true">⚠</span>
      <span>
        <span className="text-accent-amber font-semibold">{locale === "ru" ? "Подвох — " : "Gotcha — "}</span>
        <KeyTermText text={text} keyTerms={keyTerms} locale={locale} />
      </span>
    </div>
  );
}
```
Create `src/components/lesson/Recap.tsx`:
```tsx
"use client";
import KeyTermText from "./KeyTermText";
import type { KeyTerm } from "@/lib/types";

export default function Recap({ text, keyTerms, locale }: { text: string; keyTerms: KeyTerm[]; locale: "ru" | "en" }) {
  return (
    <div className="text-[12.5px] leading-[1.7] text-text-secondary">
      <span className="block text-[9.5px] tracking-[2px] uppercase text-accent-green mb-1">
        {locale === "ru" ? "Итог" : "Recap"}
      </span>
      <KeyTermText text={text} keyTerms={keyTerms} locale={locale} />
    </div>
  );
}
```

- [ ] **Step 3: Checkpoint (reveal)**

Create `src/components/lesson/Checkpoint.tsx`:
```tsx
"use client";
import { useState } from "react";

export default function Checkpoint({ prompt, answer, locale }: { prompt: string; answer: string; locale: "ru" | "en" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border pt-3.5 text-[12.5px] leading-[1.7] text-text-secondary">
      <span aria-hidden="true">🧠 </span>
      <span className="font-medium text-text-primary">{locale === "ru" ? "Прежде чем листать — " : "Before you scroll — "}</span>
      {prompt}
      {open ? (
        <span className="block mt-1.5 text-text-muted">{answer}</span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-1.5 text-accent-green hover:underline"
        >
          {locale === "ru" ? "▶ показать" : "▶ reveal"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Glossary + CompletionNudge**

Create `src/components/lesson/Glossary.tsx`:
```tsx
"use client";
import { localized } from "@/lib/i18n";
import type { KeyTerm } from "@/lib/types";

export default function Glossary({ terms, locale }: { terms: KeyTerm[]; locale: "ru" | "en" }) {
  if (terms.length === 0) return null;
  return (
    <div>
      <div className="text-[9.5px] tracking-[2px] uppercase text-text-muted mb-2">
        {locale === "ru" ? "Ключевые термины" : "Key terms"}
      </div>
      <dl className="space-y-2">
        {terms.map((k) => (
          <div key={k.term} className="text-[12.5px] leading-[1.6]">
            <dt className="inline text-accent-green font-medium">{k.term}</dt>
            <dd className="inline text-text-secondary"> — {localized(k.definition, locale)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```
Create `src/components/lesson/CompletionNudge.tsx`:
```tsx
"use client";

export default function CompletionNudge({ locale, onStart }: { locale: "ru" | "en"; onStart: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#1e3a2a] bg-[#0f1c16] px-3.5 py-2.5">
      <span className="text-[12px] text-text-muted">
        {locale === "ru" ? "Ты дочитал урок." : "You've reached the end of the lesson."}
      </span>
      <button
        type="button"
        onClick={onStart}
        className="shrink-0 rounded-md bg-accent-green/15 text-accent-green border border-accent-green/30 px-3 py-1.5 text-[11px] font-semibold hover:bg-accent-green/25 transition-colors"
      >
        {locale === "ru" ? "🧠 Проверить себя" : "🧠 Test yourself"}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: 0 errors.
```bash
git add src/components/lesson/
git commit -m "feat: lesson prose & recall components (calm style)"
```

---

### Task 6: `MiniQuiz`

**Files:**
- Create: `src/components/lesson/MiniQuiz.tsx`

**Interfaces:**
- Consumes: `sampleQuizQuestions` from `@/lib/quiz-sample`; `InterviewQuestion` from `@/lib/types`; `localized`, `t` from `@/lib/i18n`; `Markdown`.
- Produces: `MiniQuiz({ questions, onRate, locale, anchorRef }: { questions: InterviewQuestion[]; onRate: (id: string, quality: number) => void; locale: "ru" | "en"; anchorRef?: React.Ref<HTMLDivElement> })` — reveal-then-rate over up to 3 sampled questions; each rating calls `onRate` (feeds SM-2).

- [ ] **Step 1: Implement MiniQuiz**

Create `src/components/lesson/MiniQuiz.tsx`:
```tsx
"use client";
import { useMemo, useState } from "react";
import { localized, t, useLocale } from "@/lib/i18n";
import { sampleQuizQuestions } from "@/lib/quiz-sample";
import type { InterviewQuestion } from "@/lib/types";
import Markdown from "../Markdown";

const RATINGS = [
  { key: "again" as const, quality: 0, cls: "text-accent-red border-accent-red/30 bg-accent-red/10" },
  { key: "hard" as const, quality: 3, cls: "text-accent-amber border-accent-amber/30 bg-accent-amber/10" },
  { key: "good" as const, quality: 4, cls: "text-accent-green border-accent-green/30 bg-accent-green/10" },
  { key: "easy" as const, quality: 5, cls: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10" },
];

export default function MiniQuiz({
  questions,
  onRate,
  anchorRef,
}: {
  questions: InterviewQuestion[];
  onRate: (id: string, quality: number) => void;
  locale: "ru" | "en";
  anchorRef?: React.Ref<HTMLDivElement>;
}) {
  const { locale } = useLocale();
  const items = useMemo(() => sampleQuizQuestions(questions, 3), [questions]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [rated, setRated] = useState<Set<string>>(new Set());
  if (items.length === 0) return null;

  return (
    <div ref={anchorRef} className="rounded-md border border-border bg-bg-card p-3.5 scroll-mt-28">
      <div className="text-[9.5px] tracking-[2px] uppercase text-text-muted mb-3">
        {locale === "ru" ? `Мини-квиз · ${items.length} вопр.` : `Mini-quiz · ${items.length} questions`}
      </div>
      <div className="flex flex-col gap-3">
        {items.map((q, i) => {
          const isOpen = revealed.has(q.id);
          const isRated = rated.has(q.id);
          return (
            <div key={q.id} className="border-t border-border first:border-t-0 pt-3 first:pt-0">
              <div className="text-[13px] text-text-primary mb-1.5">
                <span className="text-text-muted mr-1.5">{i + 1}.</span>
                {localized(q.q, locale)}
              </div>
              {!isOpen ? (
                <button
                  type="button"
                  onClick={() => setRevealed((p) => new Set(p).add(q.id))}
                  className="text-[11px] text-accent-green hover:underline"
                >
                  {t("reveal", locale)}
                </button>
              ) : (
                <>
                  <div className="text-[12.5px] text-text-secondary [&_p]:mb-1.5">
                    <Markdown>{localized(q.a, locale)}</Markdown>
                  </div>
                  {!isRated && (
                    <div className="flex gap-1.5 mt-2">
                      {RATINGS.map((r) => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => {
                            onRate(q.id, r.quality);
                            setRated((p) => new Set(p).add(q.id));
                          }}
                          className={`px-2.5 py-1 rounded border text-[10px] ${r.cls}`}
                        >
                          {t(r.key, locale)}
                        </button>
                      ))}
                    </div>
                  )}
                  {isRated && (
                    <div className="text-[10px] text-text-muted mt-1.5">{t("rated", locale)} ✓</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: 0 errors.
```bash
git add src/components/lesson/MiniQuiz.tsx
git commit -m "feat: end-of-lesson mini-quiz (feeds SM-2)"
```

---

### Task 7: `LessonView` — assemble the layers

**Files:**
- Create: `src/components/LessonView.tsx`

**Interfaces:**
- Consumes: `resolveTopic` (`@/lib/resolve-topic`), `visibleSections` (`@/lib/lesson-layers`), `Depth` (`@/lib/depth`), `localized`/`useLocale` (`@/lib/i18n`); reuses `Diagram`, `CodeTab`, `InterviewTab`, `SpringTab`, `Markdown`, and the `lesson/*` components + `MiniQuiz`.
- Produces: `LessonView({ content, highlightedCode, progress, onRate, depth }: { content: TopicContent; highlightedCode: string; progress: ProgressState; onRate: (id: string, quality: number) => void; depth: Depth })`.

- [ ] **Step 1: Implement LessonView**

Create `src/components/LessonView.tsx`:
```tsx
"use client";
import { useRef } from "react";
import { TopicContent, ProgressState } from "@/lib/types";
import { localized, useLocale } from "@/lib/i18n";
import { resolveTopic } from "@/lib/resolve-topic";
import { visibleSections } from "@/lib/lesson-layers";
import type { Depth } from "@/lib/depth";
import Diagram from "./Diagram";
import CodeTab from "./CodeTab";
import InterviewTab from "./InterviewTab";
import SpringTab from "./SpringTab";
import Markdown from "./Markdown";
import TldrLead from "./lesson/TldrLead";
import Analogy from "./lesson/Analogy";
import Gotcha from "./lesson/Gotcha";
import Recap from "./lesson/Recap";
import Checkpoint from "./lesson/Checkpoint";
import Glossary from "./lesson/Glossary";
import MiniQuiz from "./lesson/MiniQuiz";
import CompletionNudge from "./lesson/CompletionNudge";

function Label({ children }: { children: string }) {
  return <div className="text-[9.5px] tracking-[2px] uppercase text-text-muted mb-2">{children}</div>;
}

export default function LessonView({
  content,
  highlightedCode,
  progress,
  onRate,
  depth,
}: {
  content: TopicContent;
  highlightedCode: string;
  progress: ProgressState;
  onRate: (id: string, quality: number) => void;
  depth: Depth;
}) {
  const { locale } = useLocale();
  const r = resolveTopic(content);
  const vis = visibleSections(depth);
  const kt = r.keyTerms;
  const quizRef = useRef<HTMLDivElement>(null);
  const toQuiz = () => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex flex-col gap-6">
      {vis.has("tldr") && <TldrLead text={localized(r.tldr, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("analogy") && r.analogy && <Analogy text={localized(r.analogy, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("diagram") && r.diagram && <Diagram name={r.diagram} />}
      {vis.has("whatWhy") && r.whatWhy && (
        <div>
          <Label>{locale === "ru" ? "Что и зачем" : "What & Why"}</Label>
          <Markdown>{localized(r.whatWhy, locale)}</Markdown>
        </div>
      )}
      {vis.has("howItWorks") && (
        <div>
          <Label>{locale === "ru" ? "Как это работает" : "How it works"}</Label>
          <Markdown>{localized(r.howItWorks, locale)}</Markdown>
        </div>
      )}
      {vis.has("code") && <CodeTab content={content} highlightedCode={highlightedCode} />}
      {vis.has("gotcha") && r.gotcha && <Gotcha text={localized(r.gotcha, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("checkpoints") &&
        r.checkpoints.map((c) => (
          <Checkpoint key={c.id} prompt={localized(c.prompt, locale)} answer={localized(c.answer, locale)} locale={locale} />
        ))}
      {vis.has("recap") && r.recap && <Recap text={localized(r.recap, locale)} keyTerms={kt} locale={locale} />}
      {vis.has("interview") && (
        <div>
          <Label>{locale === "ru" ? "Вопросы на интервью" : "Interview questions"}</Label>
          <InterviewTab content={content} progress={progress} onRate={onRate} />
        </div>
      )}
      {vis.has("spring") && content.springConnection && <SpringTab content={content} />}
      {vis.has("glossary") && <Glossary terms={kt} locale={locale} />}
      <CompletionNudge locale={locale} onStart={toQuiz} />
      <MiniQuiz questions={content.interviewQs} onRate={onRate} locale={locale} anchorRef={quizRef} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck`
Expected: 0 errors.
```bash
git add src/components/LessonView.tsx
git commit -m "feat: LessonView assembles depth-gated lesson sections"
```

---

### Task 8: Rewire `TopicContent` + `TopicClient` (tabs → depth + LessonView)

**Files:**
- Modify: `src/components/TopicContent.tsx`
- Modify: `src/app/topic/[id]/TopicClient.tsx`

**Interfaces:**
- Consumes: `LessonView`, `DepthControl`, `useDepth`, `resolveTopic`, `Depth`.
- Produces: the topic page renders the single-scroll layered lesson with the depth control; `1/2/3` set depth; TOC/nav/mark-done/reading-progress preserved.

- [ ] **Step 1: Rewire TopicContent.tsx**

In `src/components/TopicContent.tsx`:
1. Remove the `TABS`/`TabId` block, the `activeTab`/`onTabChange` props, and the `LearnTab`/`CodeTab`/`InterviewTab`/`SpringTab`/`AnimatePresence`/`motion` imports (LessonView owns them now). Keep `ReadingProgress`, `TableOfContents`, `StudyStats`.
2. Add imports:
```tsx
import LessonView from "./LessonView";
import DepthControl from "./lesson/DepthControl";
import { resolveTopic } from "@/lib/resolve-topic";
import type { Depth } from "@/lib/depth";
```
3. Change the props interface: replace `activeTab: TabId; onTabChange: (t: TabId) => void;` with `depth: Depth; onDepthChange: (d: Depth) => void;`.
4. Replace `const deepDiveMd = localized(content.deepDive, locale);` with `const resolved = resolveTopic(content); const deepDiveMd = localized(resolved.howItWorks, locale);` and delete the `showToc` line (TOC always shows now — set `const showToc = true;`).
5. Replace the reading-time call to use resolved fields:
```tsx
const readingMinutes = estimateReadingMinutes(resolved.tldr, resolved.howItWorks, resolved.gotcha ?? "");
```
6. Replace the `<div role="tablist">…</div>` block with the depth control:
```tsx
<div className="flex items-center gap-2 px-4 sm:px-7 pb-2">
  <DepthControl depth={depth} onChange={onDepthChange} locale={locale} />
</div>
```
7. Replace the `<AnimatePresence mode="wait">…</AnimatePresence>` block (the tab body) with:
```tsx
<LessonView
  content={content}
  highlightedCode={highlightedCode}
  progress={progress}
  onRate={onRate}
  depth={depth}
/>
```
Leave the prev/next `<nav>` and the TOC `<aside>` exactly as they are.

- [ ] **Step 2: Rewire TopicClient.tsx**

In `src/app/topic/[id]/TopicClient.tsx`:
1. Replace `import TopicContentView, { TabId } from "@/components/TopicContent";` with `import TopicContentView from "@/components/TopicContent";` and add `import { useDepth } from "@/lib/use-depth";`.
2. Replace `const [activeTab, setActiveTab] = useState<TabId>("learn");` with `const [depth, setDepth] = useDepth();`.
3. In the keydown handler, replace the tab lines:
```tsx
      if (e.key === "1") setActiveTab("learn");
      else if (e.key === "2") setActiveTab("code");
      else if (e.key === "3") setActiveTab("interview");
      else if (e.key === "4") setActiveTab("spring");
```
with:
```tsx
      if (e.key === "1") setDepth("quick");
      else if (e.key === "2") setDepth("standard");
      else if (e.key === "3") setDepth("deep");
```
and add `setDepth` to that `useEffect`'s dependency array (alongside `prevTopic, nextTopic, router, shortcutsOpen`).
4. In the `<TopicContentView … />` JSX, replace `activeTab={activeTab} onTabChange={setActiveTab}` with `depth={depth} onDepthChange={setDepth}`.

- [ ] **Step 3: Typecheck, full suite, build**

Run: `npm run typecheck && npm test && npm run build`
Expected: 0 type errors; all tests pass; `next build` succeeds (all 106 topic routes generate).

- [ ] **Step 4: Visual check (legacy degradation + depths)**

Run: `npm run dev`, open `http://localhost:3000/topic/1-1`. Verify: the depth control shows; **Quick** shows TL;DR (from summary) + diagram + (recap absent → skipped); **Standard** adds How-It-Works (deepDive) + code + gotcha (from tip); **Deep** adds interview Qs + Spring + (glossary absent → skipped); mini-quiz renders at the end and rating a question persists (reload keeps it). Confirm RU/EN toggle and ←/→ nav still work. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/TopicContent.tsx "src/app/topic/[id]/TopicClient.tsx"
git commit -m "feat: single-scroll layered lesson replaces topic tabs"
```

---

## Self-Review

**Spec coverage (against `2026-07-01-devcore-learning-ux-design.md`):**
- §3 calm visual principle (only code + gotcha boxed, one accent) → Task 5 component styling + Task 7 assembly. ✓
- §6 single scroll + depth control (Quick/Standard/Deep, default standard, `1/2/3`, localStorage) → Tasks 1, 4, 8. ✓
- §6 layer→section mapping + preserved reading aids/nav → Tasks 1, 7, 8. ✓
- §8 active recall: mini-quiz (feeds SM-2), inline checkpoints, key-term tooltips, completion nudge → Tasks 2, 3, 5, 6. ✓
- §5 graceful degradation via `resolveTopic` → Task 7 (+ Plan A). ✓
- §11 no-regression: full suite + build in Task 8; the 106-topic round-trip is unaffected (no content changes). ✓
- **Deferred to Plan B2 (by design):** Mermaid renderer + `mermaid` field, and authoring the 5 exemplars (needs this UI to be visible). Also deferred: key-term underlining *inside* the markdown body (B1 underlines the short prose sections + Glossary; full-markdown underlining is a later enhancement) — flagged so it's not lost.

**Placeholder scan:** none — every step has runnable code or an exact command. ✓

**Type consistency:** `Depth` (`depth.ts`, Plan A) used by `lesson-layers.ts` (T1), `use-depth.ts`/`DepthControl` (T4), `LessonView` (T7), `TopicContent`/`TopicClient` (T8). `LessonSection`/`visibleSections` (T1) consumed by `LessonView` (T7). `annotateTerms`/`Segment` (T3) consumed by `KeyTermText` (T5). `sampleQuizQuestions` (T2) consumed by `MiniQuiz` (T6). `resolveTopic`/`ResolvedTopic` (Plan A) consumed by `LessonView` (T7) and `TopicContent` (T8). `MiniQuiz`/`DepthControl`/`LessonView` prop shapes match between definition and use. ✓

---

## Notes for the executor
- Tasks 1–3 are pure TDD (node). Tasks 4–8 are React — verified by `npm run typecheck` + `next build` + the Task 8 visual check (this repo has no component test runner; do not add one).
- Reuse `InterviewTab`/`CodeTab`/`SpringTab`/`Diagram`/`Markdown` verbatim — do not modify them.
- After Task 8, `LearnTab.tsx` is unused (no importers); leave the file in place (removing it is out of scope).

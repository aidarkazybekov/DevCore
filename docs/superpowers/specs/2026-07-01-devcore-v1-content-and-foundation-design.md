# DevCore v1 — Content Engine & Portfolio Foundation

**Date:** 2026-07-01
**Status:** Approved design, ready for implementation planning
**Repo:** `~/DEV/java-core` (to be rebranded **DevCore**)

---

## 1. Overview

`java-core` is a Next.js 16 / React 19 Java-interview learning platform deployed on Cloudflare Workers (OpenNext). It already has 22 blocks / 107 bilingual topics, an SM-2 spaced-repetition engine, quiz mode, timed study sessions, an Anthropic-powered "Ask Deeper" tutor, a JDoodle code playground, search, and 7 hand-built SVG diagrams. All state lives in `localStorage`; there are no accounts and the README is still create-next-app boilerplate.

This milestone — **DevCore v1** — does two things at once:

1. **Phase 0 — Portfolio foundation:** rebrand to DevCore, add a public landing page, real README, OG images, API rate-limiting, and tests + CI. Make the project LinkedIn-presentable.
2. **Phase 3 — Content engine:** replace the fragile string-concatenated content model with an explicit, structured, bilingual model authored in an **in-repo Obsidian content vault** (the single source of truth) and compiled to typed content at build time. Fill the thin blocks 5–22 to the standard of blocks 1–4 by ingesting the external DEV vaults, and rebuild the per-topic experience around four pedagogy principles: **layered depth, consistent template, visual-first, active recall.**

Accounts, persistence, Telegram, multi-track navigation, the portfolio/interview layer, and the media/launch kit are **explicitly deferred** to later phases, but the content model is designed `track`-aware so they land cleanly.

## 2. Goals & non-goals

**Goals**
- Every topic is effortless to consume: TL;DR-first, consistently structured, visual, with active recall built in.
- Bilingual RU/EN parity is **enforced by the build**, not left to discipline.
- Content is authored in Obsidian (markdown + wiki-links), versioned in-repo, compiled to typed data.
- Thin blocks 5–22 reach the depth/quality of blocks 1–4.
- The repo and its public face look like a flagship portfolio project.

**Non-goals (this milestone)**
- No user accounts, auth, or server-side persistence.
- No Telegram bot.
- No multi-track navigation UI or portfolio/interview-mode UI (content may be seeded, UI comes later).
- No media/launch kit production.

## 3. Key architecture decisions

| Decision | Choice |
|---|---|
| Content source of truth | In-repo Obsidian **content vault** (`content/`); TS is a **generated, git-ignored** build artifact |
| Bilingual layout | **`ru/` mirror subtree** per track folder (matches existing DEV vaults); compiler fails build if a mirror is missing |
| AI usage | **Translation only** — Claude drafts the missing-language mirror; all original authoring (incl. TL;DR/analogy) is human; AI output is a reviewed draft, never auto-published |
| Diagrams | **Mermaid by default** (authorable, scalable) + keep/extend bespoke React diagrams for flagship topics |
| Landing | Public marketing page at `/`; the app moves to **`/learn`** |
| Deploy | Unchanged — Cloudflare Workers via OpenNext / Wrangler |

## 4. Content vault structure

```
DevCore/
├── content/                          # the vault — open directly in Obsidian
│   ├── .obsidian/                    # vault config (graph, templates plugin)
│   ├── _templates/
│   │   └── topic.md                  # "new topic" skeleton with all required sections
│   ├── java-core/
│   │   ├── 01-how-java-works/
│   │   │   ├── jvm-architecture.md   # EN (primary)
│   │   │   ├── classloaders.md
│   │   │   └── ru/
│   │   │       ├── jvm-architecture.md   # RU mirror
│   │   │       └── classloaders.md
│   │   ├── 02-language-basics/ …
│   │   └── … (blocks 1–22)
│   ├── system-design/                # seeded from iz-vault/tamyr (future track)
│   ├── databases/                    # seeded from iz-vault/10-Concepts/database
│   ├── security/                     # seeded from iz-vault + gamebazaar
│   ├── graph/                        # seeded from tamyr (neo4j/cypher)
│   └── 00-project/                   # optional PM notes (dashboard, sessions) — not compiled
├── scripts/
│   ├── compile-content.ts            # vault → src/data/content/*.ts  (runs in prebuild)
│   ├── ingest-vaults.ts              # one-time: external DEV vaults → content/ drafts
│   └── translate.ts                  # one-time/assist: EN note → ru/ draft via Anthropic
└── src/data/content/                 # GENERATED, git-ignored
```

- `track` is the top-level folder; `blockId` comes from the `NN-...` folder prefix; topic `id` is the filename.
- `00-project/` is for the user's usual Obsidian PM notes and is **excluded from compilation**.

## 5. Content model

Replaces the current `TopicContent` (single strings split on `\n---\n`). All prose is `Localized` with **both** languages required.

```ts
type Localized = { ru: string; en: string };
type TrackId = "java-core" | "system-design" | "databases" | "security" | "graph";

interface CodeExample { lang: "java" | "sql"; caption: Localized; code: string; }
interface InterviewQuestion { id: string; q: Localized; a: Localized; difficulty: "junior" | "mid" | "senior"; }
interface Checkpoint { id: string; prompt: Localized; answer: Localized; }   // inline active recall
interface KeyTerm { term: string; definition: Localized; }                   // hover/tap glossary
interface SpringConnection { concept: Localized; springFeature: Localized; explanation: Localized; }
type DiagramRef = { kind: "mermaid"; src: string } | { kind: "react"; key: string };

interface TopicContent {
  id: string;
  blockId: number;
  track: TrackId;
  title: Localized;
  difficulty: "junior" | "mid" | "senior";
  interviewRelevance: "high" | "medium" | "low";
  prerequisites: string[];            // resolved from [[wiki-links]]

  // LAYER 1 — instant grasp (always visible)
  tldr: Localized;
  analogy: Localized;

  // LAYER 2 — the lesson (consistent template, in order)
  whatWhy: Localized;
  howItWorks: Localized;              // markdown
  code: CodeExample;
  gotcha: Localized;

  // LAYER 3 — mastery
  interviewQs: InterviewQuestion[];
  recap: Localized;

  // active recall
  checkpoints: Checkpoint[];
  keyTerms: KeyTerm[];

  // visual + spring
  diagram?: DiagramRef;
  springConnection?: SpringConnection;

  estReadingMin: number;
}
```

### Markdown note format (authoring contract)

Frontmatter + section headings map 1:1 to fields. Example `java-core/06-collections/hashmap-internals.md`:

```markdown
---
id: hashmap-internals
track: java-core
difficulty: mid
interviewRelevance: high
diagram: react:hashmap-internals      # or omit / "mermaid"
prerequisites: ["[[equals-and-hashcode]]", "[[arraylist-vs-linkedlist]]"]
---
## TL;DR
A hash map stores entries in buckets indexed by hash(key)...

## Analogy
A coat-check room: your ticket number (hash) tells the attendant which shelf...

## What & Why
...

## How It Works
...

## Code
```java
// caption: Resize doubles capacity and rehashes
Map<String,Integer> m = new HashMap<>();
```

## Gotcha
Mutating a key after insertion corrupts the bucket index...

## Checkpoint
- Q: What happens to existing entries when the map resizes?
  A: They are rehashed into a larger bucket array...

## Key Terms
- treeify :: When a bucket exceeds 8 entries it converts to a red-black tree...

## Interview
- [mid] Q: Why must hashCode be consistent with equals?
  A: ...

## Recap
HashMap = array of buckets + hash → O(1) average; collisions → chaining → treeify.

## Spring
- concept: ... / springFeature: ... / explanation: ...
```

The **`ru/` mirror** uses the identical structure in Russian. Diagram, `prerequisites`, `difficulty`, etc. live only in the EN frontmatter (mirrors inherit non-prose fields).

## 6. Compile pipeline (`scripts/compile-content.ts`)

Runs in `prebuild` (and on demand). Steps:

1. **Discover** every `*.md` under `content/<track>/<NN-block>/` (excluding `ru/` and `00-project/`).
2. **Parse** frontmatter + sections into the EN half of a `TopicContent`; parse the matching `ru/` mirror into the RU half; merge into `Localized` fields.
3. **Resolve `[[wiki-links]]`** in `prerequisites`/inline to topic `id`s; warn on dangling links.
4. **Validate** (hard-fail the build on any violation):
   - both `ru` and `en` non-empty for every `Localized`;
   - all required sections present;
   - every `prerequisites` id exists;
   - `diagram: react:<key>` references a real component; `mermaid` parses.
5. **Emit** `src/data/content/<id>.ts` (typed `TopicContent`) + regenerate `index.ts` (the existing lazy-import map) + a `roadmap.ts`-compatible manifest.
6. **Compute** `estReadingMin` from word count.

Generated TS keeps the **current lazy-loaded `import()` architecture** unchanged — only the *source* of those files changes. No runtime markdown parsing on the Worker.

## 7. Bilingual + AI translation pass

- Authoring is **EN-primary**: write the English note fully (including TL;DR/analogy), then generate the `ru/` mirror.
- `scripts/translate.ts` calls the Anthropic SDK (already a dependency) to translate an EN note section-by-section into a `ru/` **draft** marked `status: draft-translation` in frontmatter. The user reviews/edits before it's considered final.
- AI is **never** used to invent original content — only to translate human-authored text. This keeps voice and correctness under human control while reaching parity fast.
- The parity validator (§6.4) is the backstop: nothing ships half-translated.

## 8. Per-topic learning experience (`/learn/topic/[id]`)

The four-tab layout becomes a **single scrollable lesson with layered disclosure**:

- **Depth control: Quick · Standard · Deep** (persisted in localStorage now; server later).
  - *Quick* → TL;DR, analogy, code, recap (~60s).
  - *Standard* → + whatWhy, howItWorks, gotcha.
  - *Deep* → + interview Qs (difficulty-grouped, existing SM-2 reveal/rate flow), prerequisites, Spring connection.
- **Visual-first:** `diagram` renders directly under *How It Works*.
- **Active recall:**
  - `keyTerms` render as underlined terms with hover/tap bilingual definitions.
  - `checkpoints` render as inline "🧠 Before you scroll…" reveal prompts at section breaks.
  - Each topic ends with a **3-question mini-quiz** reusing the existing QuizMode + SM-2 plumbing, so finishing a read feeds spaced repetition.
- **Consistent template:** rendering order is fixed by the model, so every topic has the same rhythm.
- Existing Interview/Spring content folds into the *Deep* layer — nothing authored today is lost.

The existing reading aids (ReadingProgress, TableOfContents, reading-time, keyboard shortcuts, RU/EN toggle) are preserved.

## 9. Diagram strategy

- Add a **Mermaid renderer** behind the existing `<Diagram>` wrapper; `DiagramRef` is a discriminated union so a topic is agnostic to the engine.
- **Mermaid is the default** for the long tail — authorable as text in the note, RU/EN labels, hundreds feasible.
- **Keep the 7 bespoke React/animated diagrams** (`react:<key>`) for flagship topics; add a few more for hero topics over time.
- Goal: a diagram on (nearly) every topic, premium treatment on the important ones.

## 10. External vault ingest (one-time, `scripts/ingest-vaults.ts`)

A throwaway/assistive script that seeds `content/` from the external DEV vaults; output is **drafts the user reviews**, not auto-published.

- Sources: `iz-vault/10-Concepts` (spring-boot, database, system-design, security) + `iz-vault/13-Java-Prep/Topics`, `tamyr/10-Concepts` (neo4j/graph), `gamebazaar-vault/10-Concepts` (spring/security).
- Parse each note's frontmatter (`track`, `difficulty`, `interview_relevance`, ru-mirror links), map its body to the section template, drop into the right `content/<track>/<block>/` folder.
- Mine the unused `src/data/interview-prep-source.md` (266 KB, RU) by heading for gap topics (reactive, virtual threads, reflection, annotations, fork/join…).
- Priority: bring **blocks 5–22 of `java-core` to parity with 1–4** first; seed the other tracks opportunistically.

## 11. Phase 0 — Portfolio foundation

- **Rebrand:** `package.json` name; `layout.tsx` metadata (title/description → DevCore); favicon; "Java Core" UI strings.
- **Landing page at `/`:** hero, feature highlights (spaced repetition, AI tutor, bilingual, diagrams, code playground), screenshots, CTA → `/learn`. Move the app from `/` to `/learn` (and `/learn/topic/[id]`); add redirects.
- **README:** real content — what it is, feature list, architecture diagram, screenshots, the actual Cloudflare/OpenNext deploy story. Replaces create-next-app boilerplate.
- **OG images:** static Open Graph image(s) so LinkedIn/X link previews look intentional; set `metadataBase`.
- **API hardening:** KV-backed per-IP rate limiting on `/api/ask` and `/api/run` (no accounts yet). Add a KV binding in `wrangler.json`. Return 429 with a friendly message past the limit.
- **Tests (Vitest):** `lib/` — SM-2 math, streak logic, `splitLocalized`/locale helpers, and the **content validators** (schema + bilingual parity + wiki-link resolution).
- **CI (GitHub Actions):** lint, typecheck, test, `compile-content`, build on push/PR.

## 12. Data flow

```
content/ (markdown + ru/ mirror, wiki-links)
        │  prebuild
        ▼
scripts/compile-content.ts ──validate(schema, parity, links)──► src/data/content/*.ts (generated, git-ignored)
        │
        ▼
Next.js build (lazy import per topic, shiki highlight) ──► Cloudflare Worker (OpenNext)
        │
        ▼
/learn/topic/[id]  →  layered lesson UI (Quick/Standard/Deep, diagrams, checkpoints, mini-quiz → SM-2 → localStorage)
```

## 13. Testing & verification strategy

- **Unit:** SM-2 intervals, streak transitions, reading-time, locale split, wiki-link resolver.
- **Content validation (build-blocking):** every `Localized` bilingual; required sections present; prerequisites resolve; diagram refs valid.
- **Smoke:** `compile-content` produces N files == N notes; `next build` succeeds; a sampled topic renders all layers.
- **CI gate:** all of the above on every PR.

## 14. Risks & mitigations

- **Next 16 is bleeding-edge** (AGENTS.md warns APIs differ) → consult `node_modules/next/dist/docs/` before routing/layout changes (landing + `/learn` move).
- **Workers runtime limits** → compile/ingest/translate scripts run **on the dev machine**, never in the Worker; no markdown parsing at runtime.
- **AI translation drift** → human review gate + `status: draft-translation` flag; parity validator backstop.
- **Generated TS git-ignored** → CI must run `compile-content` before build; document the local `dev` flow (`prebuild`).
- **Rate-limit needs KV** → add binding; without it the open APIs remain a credit-drain risk for a public link.
- **Large UX refactor of TopicClient** → land behind the existing tab structure incrementally; keep all current content reachable.

## 15. Out of scope (future phases, designed-for)

- **Phase 1:** Accounts (Telegram-first + GitHub/Google), Cloudflare D1, server-side progress/SR sync, guest→sync.
- **Phase 2:** Telegram reminder bot (Cron Trigger + Bot API; due-cards/streak DM + weekly recap).
- **Phase 4:** Multi-track navigation UI + Portfolio/interview-mode UI (`portfolio-vault`).
- **Phase 5:** Media & launch kit (demo video, generated hero media, LinkedIn post kit).

## 16. Success criteria

- DevCore-branded, public landing at `/`, app at `/learn`; README + OG render correctly in a LinkedIn preview.
- `content/` vault is the source of truth; `npm run build` regenerates all topic TS from it.
- Build **fails** if any topic lacks an RU or EN side, a required section, or a valid prerequisite.
- Blocks 5–22 reach blocks-1–4 depth; (nearly) every topic has a diagram.
- Each topic renders Quick/Standard/Deep layers, inline checkpoints, key-term tooltips, and an end-of-topic mini-quiz that feeds SM-2.
- `/api/ask` and `/api/run` are rate-limited; Vitest + GitHub Actions pass.

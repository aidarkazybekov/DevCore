# DevCore Content Vault

Single source of truth for all DevCore topic content. Open this folder directly in Obsidian.

- One markdown note per topic under `<track>/<NN-block>/<id>.md`, with a Russian mirror in `<NN-block>/ru/<id>.md`.
- `npm run compile-content` parses these notes into `src/data/content/*.ts` (generated, git-ignored).
- The build (`prebuild`/`predev`) runs the compiler automatically.
- Set `status: published` in a note's frontmatter to make missing RU/EN content a hard build error.
- `00-project/` is ignored by the compiler — use it for project notes.

New topics: copy `_templates/topic.md`.

## Build / CI

`npm run compile-content` must run before `test`, `lint`, and `typecheck` — this is now wired automatically via `pretest`, `prelint`, and the `typecheck` script itself. On a fresh clone or in CI, running `npm test`, `npm run lint`, or `npm run typecheck` will regenerate generated files automatically without any extra steps.

**Warning:** `npm run migrate-content` is a ONE-SHOT bootstrap command. It overwrites the entire vault back to `draft` status. Do NOT re-run it — the vault markdown files are now the source of truth. Running migrate again will destroy any published status you have set.

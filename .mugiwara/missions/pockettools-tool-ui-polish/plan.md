# pockettools-tool-ui-polish

Lane: 3 Full. Mode: auto. Solo. Baseline preflight: `bun run fmt:check` green, `bun run lint` green, `bun test` 319 pass / 0 fail on `main`; `nuxt typecheck` deferred to wave gates via `bun run ci:local` (not run at plan time to keep triage fast; Flow 3 never starts without T1 gate proving it).

## Key decisions
- Single shared workspace: rework `app/components/ToolDualPane.vue` in place (keep filename + `tool-dual-pane` testids) into one `.pt-workspace` card with an inside divider and a `toolbar` slot; tokens only in `app/assets/css/main.css`. No new shared component file.
- `ToolHeader.vue` becomes borderless full-width (no card border, subtle wash), page widens via a per-tool modifier class on `.pt-detail-page` (not a global width change); header→workspace gap uses existing spacing tokens.
- JSON editor is zero-dep enhanced textarea (gutter, Tab-to-indent, error-jump, stats bar) per spec; no new dependency, no ADR.
- New tool options stay flat primitives so `app/utils/url-state.ts` `?s=` sharing keeps working; JSON persists `sortKeys` too.
- UUID converter is timestamp-preserving both directions with honest copy; no claim of lossless bit mapping.
- Spec open questions resolved: sort-keys off, base64 wrap none, URL-safe off, cleaner line-ending keep, converter wording "timestamp-preserving conversion".

## Architecture overview
`app/pages/tools/[slug].vue` stacks `ToolHeader` / `ToolHost` / `ToolFooter`. `ToolHost` lazy-loads each tool's `ToolComponent.vue`. Three tools render through `ToolDualPane` (input/output slots); UUID renders its own section. This mission keeps that tree and changes only the shell presentation (header + dual-pane internals + CSS tokens) plus per-tool pure logic (`logic.ts`/`schema.ts`) and their thin components. No registry, routing, or PWA changes.

## Project structure
- Shell: `app/components/ToolHeader.vue`, `app/components/ToolDualPane.vue`, `app/assets/css/main.css`, `app/pages/tools/[slug].vue` (modifier class only).
- Tools: `app/tools/json-formatter/{ToolComponent.vue,schema.ts,logic.ts,logic.test.ts,json-parser.ts}`, `app/tools/text-cleaner/{ToolComponent.vue,schema.ts,logic.ts,logic.test.ts}`, `app/tools/base64-tool/{ToolComponent.vue,schema.ts,logic.ts,logic.test.ts}`, `app/tools/uuid-generator/{ToolComponent.vue,schema.ts,logic.ts,logic.test.ts}`.
- Tests: `tests/e2e/{json-formatter,text-cleaner,base64-tool,uuid-generator,accessibility,shell}.pw.ts`, `tests/e2e/helpers/app.ts`.

## Waves
| Wave | Focus | Tasks | Gate |
|------|-------|-------|------|
| 1 | Shared shell: header + single-card workspace + tokens | T1 | `bun run fmt:check && bun run lint && bun run check` green; shell e2e passes |
| 2 | JSON editor + cleaner options | T2–T3 | unit suites green + focused Playwright files pass 1x |
| 3 | Base64 + UUID/converter | T4–T5 | unit suites green + focused Playwright files pass 1x |
| 4 | Full gates + a11y + responsive proof | T6 | `bun run ci:local` green (fmt, lint, typecheck, registry check, coverage gate, audit, 319+ unit tests, build, Playwright) |

Rollback: wave N starts only when wave N-1's commit hash is recorded in `flows/` evidence; a failed wave gate means `git revert <wave-N-commit>` then fix and re-run the gate.

## CODEOWNERS
| Area | Owner task(s) |
|------|---------------|
| `app/components/`, `app/assets/css/`, `app/pages/tools/` | T1 |
| `app/tools/json-formatter/` | T2 |
| `app/tools/text-cleaner/` | T3 |
| `app/tools/base64-tool/` | T4 |
| `app/tools/uuid-generator/` | T5 |
| repo-wide gates | T6 |

## Implementation graph
- L0: T1 (shell; no deps).
- L1: T2 (consumes workspace slots + tokens from T1), T3 (same) — file-disjoint from each other, both wait on T1.
- L2: T4, T5 (same relation to T1; disjoint from L1 files and each other).
- L3: T6 (consumes all tool UIs; runs gates).
- Critical path: T1 → T2 → T6 (JSON editor is the highest-risk node: gutter sync + error-jump + mobile keyboards).

## Task index
| # | Task | Files | Size | Depends-on | Unblocks | Acceptance |
|---|------|-------|------|------------|----------|------------|
| T1 | Shared shell polish | `ToolHeader.vue`, `ToolDualPane.vue`, `main.css`, `[slug].vue` | M | — | T2, T3, T4, T5 | typecheck + shell e2e green |
| T2 | JSON code-editor + advanced options | `app/tools/json-formatter/*` | L | T1 | T6 | unit + json e2e green |
| T3 | Cleaner side-by-side + advanced options | `app/tools/text-cleaner/*` | M | T1 | T6 | unit + cleaner e2e green |
| T4 | Base64 side-by-side + advanced options | `app/tools/base64-tool/*` | M | T1 | T6 | unit + base64 e2e green |
| T5 | UUID polish + converter | `app/tools/uuid-generator/*` | L | T1 | T6 | unit + uuid e2e green |
| T6 | Full gates + a11y proof | repo-wide | S | T2–T5 | — | `bun run ci:local` green |

## Detail tasks
**Task 1: Shared shell polish** `[SEQUENTIAL, depends-on: none]`
- Files: modify `app/components/ToolHeader.vue`, `app/components/ToolDualPane.vue`, `app/assets/css/main.css`, `app/pages/tools/[slug].vue`.
- Interfaces: produces workspace contract — slots `toolbar`/`input`/`output`, testids `tool-dual-pane`, `tool-dual-pane-input`, `tool-dual-pane-output` preserved; per-tool modifier class for 1180px width.
- Size: M. Effort: M — touches 4 files across shell + CSS with responsive + reduced-motion rules.
- Break: none (4 files, single commit).
- Steps: [ ] extend existing shell/a11y e2e assertions for full-width header + divider + 375px no-overflow → run `bun run test tests/unit` → implement header/workspace/CSS → run `bun run fmt:check && bun run lint && bun run check` → run `playwright test tests/e2e/shell.pw.ts tests/e2e/tool-infrastructure.pw.ts` → commit.
- Acceptance: `bun run check` exits 0 and `playwright test tests/e2e/shell.pw.ts` passes.
- Risk: divider overflow on 375px → rollback `git revert <T1-commit>`; fix tokens.

**Task 2: JSON code-editor + advanced options** `[PARALLEL with T3; proof: files under app/tools/json-formatter/ only, no shared-area overlap]`
- Files: modify `app/tools/json-formatter/ToolComponent.vue`, `schema.ts` (add `sortKeys: boolean`), `logic.ts` (sort-keys + stats helpers `getJsonStats`), `logic.test.ts`; extend `tests/e2e/json-formatter.pw.ts` (sort toggle, clear/sample, 375px overflow).
- Interfaces: consumes workspace slots from T1 → produces formatted output + `json-formatter-*` testids preserved (`input`, `output`, `status`, `format`, `minify`, `indent`) plus new `sort-keys`, `clear`, `sample`.
- Size: L. Effort: L — gutter sync + Tab handling + error-jump + stats + URL-state `sortKeys`.
- Break: split into T2a (logic/schema/tests) + T2b (component/e2e) if the diff exceeds 8 files.
- Steps: [ ] add failing unit tests for sort-keys + stats → run `bun run test app/tools/json-formatter` → implement schema/logic → add failing component assertions (gutter, error-jump) → implement editor UI in grouped fieldsets → run `bun run fmt:check && bun run lint && bun run check` → run `playwright test tests/e2e/json-formatter.pw.ts` → commit.
- Acceptance: `bun run test app/tools/json-formatter` passes and `playwright test tests/e2e/json-formatter.pw.ts` passes.
- Risk: gutter/caret breaks mobile keyboards → rollback `git revert <T2-commit>`; fall back to plain mono textarea keeping the toolbar.

**Task 3: Cleaner side-by-side + advanced options** `[PARALLEL with T2; proof: files under app/tools/text-cleaner/ only]`
- Files: modify `app/tools/text-cleaner/ToolComponent.vue`, `schema.ts` (add `removeEmptyLines`, `removeDuplicateLines`, `lineEnding: "keep"|"lf"|"crlf"`, `stripHtml`), `logic.ts`, `logic.test.ts`; extend `tests/e2e/text-cleaner.pw.ts`.
- Interfaces: consumes workspace slots from T1 → produces cleaned text + counts + reading-time/removed stats; preserves `text-cleaner-*` testids.
- Size: M. Effort: M — four new pure transforms with order-sensitive semantics (stripHtml → normalize → dedupe → case).
- Break: none.
- Steps: [ ] add failing unit tests per transform → run `bun run test app/tools/text-cleaner` → implement schema/logic → rebuild component with grouped fieldsets (Whitespace/Lines/Case/Strip) → run fmt/lint/typecheck → run `playwright test tests/e2e/text-cleaner.pw.ts` → commit.
- Acceptance: `bun run test app/tools/text-cleaner` passes and `playwright test tests/e2e/text-cleaner.pw.ts` passes.
- Risk: transform ordering surprises → pin order in unit tests; revert on failure.

**Task 4: Base64 side-by-side + advanced options** `[PARALLEL with T5; proof: files under app/tools/base64-tool/ only]`
- Files: modify `app/tools/base64-tool/ToolComponent.vue`, `schema.ts` (add `urlSafe: boolean`, `wrapAt: 0|64|76`, `newline: "lf"|"crlf"`), `logic.ts` (url-safe alphabet + wrapping), `logic.test.ts`; extend `tests/e2e/base64-tool.pw.ts`.
- Interfaces: consumes workspace slots from T1 → produces encoded/decoded result + detected-direction + byte-size status; preserves `base64-*` testids; file-drop stays.
- Size: M. Effort: M — alphabet conversion + wrap/newline matrix, all pure.
- Break: none.
- Steps: [ ] failing unit tests for urlSafe/wrap/newline combos → run `bun run test app/tools/base64-tool` → implement → rebuild grouped options UI → fmt/lint/typecheck → `playwright test tests/e2e/base64-tool.pw.ts` → commit.
- Acceptance: `bun run test app/tools/base64-tool` passes and `playwright test tests/e2e/base64-tool.pw.ts` passes.
- Risk: wrap breaking strict decode round-trip → unit-test round-trip matrix; revert on failure.

**Task 5: UUID polish + converter** `[PARALLEL with T4; proof: files under app/tools/uuid-generator/ only]`
- Files: modify `app/tools/uuid-generator/ToolComponent.vue`, `schema.ts` (add `uppercase: boolean`, `hyphens: boolean` for generator display), `logic.ts` (add `inspectId` + `convertId` timestamp-preserving + `formatId`), `logic.test.ts`; extend `tests/e2e/uuid-generator.pw.ts` (format toggles + converter detect/convert both directions).
- Interfaces: consumes workspace-adjacent grouped layout (Generate/Results/Converter fieldsets) → produces id batches + inspection (`type`, `version`, `timestamp ISO|null`) + converted id; preserves `uuid-*` testids plus new `uuid-converter-*`.
- Size: L. Effort: L — bit-layout mapping (v7 48-bit timestamp + variant bits vs ULID Crockford) with honest timestamp-preserving semantics + nil/invalid handling.
- Break: split into T5a (inspect/convert logic+tests) + T5b (component/e2e) if over 8 files.
- Steps: [ ] failing unit tests for inspect (v4/v7/ULID/nil/invalid) + timestamp-preserving convert both ways → run `bun run test app/tools/uuid-generator` → implement logic → build grouped UI → fmt/lint/typecheck → `playwright test tests/e2e/uuid-generator.pw.ts` → commit.
- Acceptance: `bun run test app/tools/uuid-generator` passes and `playwright test tests/e2e/uuid-generator.pw.ts` passes.
- Risk: users reading conversion as lossless → copy fixed as "timestamp-preserving conversion"; unit-test timestamp equality both directions.

**Task 6: Full gates + a11y proof** `[SEQUENTIAL, depends-on: T2, T3, T4, T5]`
- Files: none (verification only; fix-forward via new tasks if red).
- Size: S. Effort: S — runs the repo gate, collects evidence.
- Steps: [ ] run `bun run ci:local` → capture output to `flows/06-gates.md` → run focused 375px + axe checks already covered per-tool → commit evidence only.
- Acceptance: `bun run ci:local` exits 0.
- Risk: none (no source edits in this task).

## Risk & rollback
- Wave order enforced by file ownership; parallel sets (T2‖T3, T4‖T5) share no files and no CODEOWNERS area — the only shared surface is the already-landed T1 contract.
- Each wave records its commit hash; red gate → `git revert` that wave's commit, fix, re-run.
- No new dependencies; no registry/routing/PWA changes; no secrets in evidence.

## Definition of Done
- Full-width borderless header with 2.5rem workspace gap on all four tools, desktop + 375px.
- One-card workspaces with dividers, equal heights desktop, stacked result-below mobile, no horizontal overflow.
- JSON enhanced-textarea editor (gutter, Tab, error-jump, stats) + grouped advanced options; zero new deps.
- Cleaner/base64 grouped advanced options; UUID format toggles + timestamp-preserving converter both directions.
- Old testids preserved; new testids covered by unit + e2e; axe zero critical/serious; 44px targets; reduced-motion respected.
- `bun run ci:local` green with evidence.

## Pre-mortem
Assuming this mission failed, the most likely cause is the JSON gutter/error-jump interaction breaking mobile keyboards or screen-reader announcements, stalling Wave 2 and everything behind it. The plan already counters it at Task 2: testids preserved so old e2e still passes, a defined fallback (plain mono textarea + toolbar) on red, and the critical path isolated as T1 → T2 → T6 so a T2 revert does not take down T3–T5.

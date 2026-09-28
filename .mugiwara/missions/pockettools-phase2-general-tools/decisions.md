# Decisions — pockettools-phase2-general-tools

## Flow 0 — Triage
- actor: user: farid nugraha <farid.nugraha@mekari.com>
- request: execute ROADMAP.md Phase 2 (2.1 JSON formatter, 2.2 text cleaner, 2.3 Base64, 2.4 UUID/ULID), only Phase 2.
- class: **Explicit** — ROADMAP.md lines 170-206 fully specify scope + acceptance per tool; PLAN.md gives architecture/testing/CLAUDE.md conventions. No brainstorm needed; wrote a spec bridge instead of running Flow 1.
- lane: **Full (3)** — 4 independent tool features, each needs pure logic + schema + component + unit/e2e/a11y tests + registry wiring; touches shared test fixtures (tool-metadata.test.ts, generated-registry.test.ts, e2e placeholder assertions). >8 tasks.
- mode read from `.mugiwara/config`: `auto`, `verbosity=normal`, `auto_commit=on`, `heal_max_cycles=3`, `coverage_new=85`, `coverage_modified=90`. Recorded per rule — auto never asks scope, proceeds, logs default choices.
- solo/team: **solo** (`team` key absent in config; single requester, no roster given).
- CLI availability: no global `mugiwara` binary / npx wrapper resolved in this shell; state tracked by hand-written `.mugiwara/missions/<mission>/*.md` files (degraded rung — file-ops only, noted here rather than left silent).
- gap logged: execution (scaffold + json-formatter/logic.ts + json-parser.ts) started before this file and spec.md/plan.md existed. Corrected same session, before further tool work, per coordinator check-in. No code is discarded; this file plus spec.md/plan.md below now cover the work already done and the work remaining.

## Spec bridge
See `spec.md`.

## Plan
See `plan.md`.

## Flow 3 — Execute (running log)
- Scaffolded `app/tools/base64-tool/` and `app/tools/uuid-generator/` via `bun run scaffold:tool` (commit a2f4938).
- Wrote `app/tools/json-formatter/json-parser.ts` (hand-rolled JSON parser with line/column error reporting — `JSON.parse` error messages differ between JavaScriptCore/Bun and V8/browser, so a shared parser keeps unit-test and browser behaviour identical), `schema.ts`, `logic.ts`, `logic.test.ts`, `json-parser.test.ts`. Verified via ad hoc `bun -e` run: format/minify/error-line all correct.
- Updated `nuxt.config.ts` PrimeVue `components.include` to add `Textarea`, `Select`, `InputNumber`, `Message` (needed across all 4 tools; kept the include list explicit/tree-shaken per Phase 0 convention, no new deps).
- Remaining: json-formatter component + e2e/a11y + screenshots; text-cleaner; base64-tool; uuid-generator; update shared test fixtures that hardcode `ToolPlaceholder.vue` for json-formatter/text-cleaner; regenerate registry; run `bun run ci:local`; checkpoint/quality/gates/review; ship gate; ROADMAP.md sync; archive; push.
logged: coverage-gate.test.ts base-discovery test is pre-existing-flaky on main (07b3f59), unrelated to this mission (confirmed via clean worktree at 07b3f59).

## Correction — branch hygiene
- Coordinator flagged: first two mission commits (a2f4938, 9686827) landed directly on `main` instead of a feature branch. Fixed: created `feature/phase-2-general-tools` at 9686827, reset local `main` back to `origin/main` (07b3f59) via `git branch -f main origin/main`. No push has happened at any point, so `origin/main` was never at risk. All further mission commits happen on `feature/phase-2-general-tools`.
- PLAN.md → RFC.md: confirmed by the user directly as an intentional rename outside this mission's scope. Not touched, not reverted, not treated as a mission artifact.

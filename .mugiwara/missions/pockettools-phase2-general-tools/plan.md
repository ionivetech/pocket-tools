# Plan — pockettools-phase2-general-tools

Lane: Full (3). Mode: auto. Solo. Baseline preflight: `bun test` and `nuxt typecheck` green on `main` at mission start (07b3f59), confirmed via `bun run ci:local` history in prior Phase 1 closure.

## Tasks

### T1 — Scaffolding
- [x] Scaffold `base64-tool`, `uuid-generator` via `bun run scaffold:tool`. Evidence: commit a2f4938.

### T2 — JSON formatter (2.1)
- [x] `json-parser.ts`: hand-rolled JSON parser, line/column errors.
- [x] `schema.ts`: input validation (text, indent 2/4/tab, mode format/minify).
- [x] `logic.ts`: `validateJson`, `runJsonFormatter`.
- [x] `logic.test.ts`, `json-parser.test.ts`: unit coverage.
- [ ] `ToolComponent.vue`: dual-pane PrimeVue layout, live validation, format/minify actions, shareable URL state via `app/utils/url-state.ts`, copy/download via `ToolActions`.
- [ ] e2e (`tests/e2e/json-formatter.pw.ts`) + a11y coverage.
- [ ] Light/dark screenshots.
- [ ] metadata componentPath updated (done).

### T3 — Text cleaner (2.2)
- [ ] `schema.ts`, `logic.ts` (trim/collapse-whitespace/case transforms; word/char/line counts), unit tests.
- [ ] `ToolComponent.vue`: single input, transform controls, live counts, copy/download.
- [ ] e2e + a11y.
- [ ] metadata componentPath update.

### T4 — Base64 encoder/decoder (2.3)
- [ ] `schema.ts`, `logic.ts` (encode/decode text, auto-detect direction), unit tests.
- [ ] `ToolComponent.vue`: dual-pane + `ToolFileDrop` for file input, copy/download.
- [ ] e2e + a11y.

### T5 — UUID/ULID generator (2.4)
- [ ] `schema.ts`, `logic.ts` (UUID v4/v7 via native crypto, ULID), unit tests.
- [ ] `ToolComponent.vue`: version select, batch size, generate + copy actions.
- [ ] e2e + a11y.

### T6 — Shared fixture updates
- [ ] `tests/unit/tool-metadata.test.ts`: real componentPaths for json-formatter/text-cleaner.
- [ ] `tests/unit/generated-registry.test.ts`: regenerate expectation.
- [ ] `tests/e2e/tool-infrastructure.pw.ts`, `shell.pw.ts`, `accessibility.pw.ts`: swap the "still a lazy placeholder" fixture from json-formatter to color-picker (still unimplemented, out of Phase 2 scope).
- [ ] `bun run generate:registry` (writes `.generated.ts` files).

### T7 — Gates
- [ ] `bun run ci:local` green.
- [ ] Checkpoint (re-verify acceptance), Quality (lint/format/tests), Gates (coverage/build/DoD), Review (diff findings), heal loop if needed (max 3).

### T8 — Closure
- [ ] Ship gate (GO/NO-GO).
- [ ] ROADMAP.md: check off delivered items, update "Current delivery" + M2 row.
- [ ] Delete evidence artifacts, archive mission (`report.md`, `pr-verdict.md`).
- [ ] Push branch (direct to `main` per user's explicit instruction) + ROADMAP.md commit.

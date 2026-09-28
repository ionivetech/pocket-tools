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
- [x] `ToolComponent.vue`: dual-pane PrimeVue layout, live validation, format/minify actions, shareable URL state via `app/utils/url-state.ts`, copy/download via `ToolActions`.
- [x] e2e (`tests/e2e/json-formatter.pw.ts`) + a11y coverage.
- [x] Light/dark screenshots (captured to mission evidence, removed at cleanup per convention).
- [x] metadata componentPath updated.

### T3 — Text cleaner (2.2)
- [x] `schema.ts`, `logic.ts` (trim/collapse-whitespace/case transforms; word/char/line counts), unit tests.
- [x] `ToolComponent.vue`: single input, transform controls, live counts, copy/download.
- [x] e2e + a11y.
- [x] metadata componentPath update.

### T4 — Base64 encoder/decoder (2.3)
- [x] `schema.ts`, `logic.ts` (encode/decode text, auto-detect direction), unit tests.
- [x] `ToolComponent.vue`: dual-pane + `ToolFileDrop` for file input, copy/download.
- [x] e2e + a11y.

### T5 — UUID/ULID generator (2.4)
- [x] `schema.ts`, `logic.ts` (UUID v4/v7 via native crypto, ULID), unit tests.
- [x] `ToolComponent.vue`: version select, batch size, generate + copy actions.
- [x] e2e + a11y.

### T6 — Shared fixture updates
- [x] `tests/unit/tool-metadata.test.ts`: real componentPaths for json-formatter/text-cleaner.
- [x] `tests/unit/generated-registry.test.ts`: confirmed self-contained (temp-dir fixtures), no change needed.
- [x] `tests/e2e/tool-infrastructure.pw.ts`, `shell.pw.ts`, `accessibility.pw.ts`: swapped the "still a lazy placeholder" fixture from json-formatter to color-picker.
- [x] `bun run generate:registry` (writes `.generated.ts` files).

### T7 — Gates
- [x] `bun run ci:local` green (fmt, lint, typecheck, registry check, coverage gate, audit, 319 unit tests, build, 43 Playwright specs).
- [x] Checkpoint (re-verified acceptance against spec.md), Quality (lint/format/tests all clean), Gates (coverage 88.43%/100% new, 90.08%/97.50% modified; build green), Review (see decisions.md — base64 double-encode bug found+fixed, JSON parser `__proto__` prototype-hijack found+fixed, InputNumber a11y label found+fixed, home-page JS budget regression found+fixed, PWA precache budget found+fixed). Heal cycles: see decisions.md Flow 8 sections (all resolved same-session, none exceeded max 3).

### T8 — Closure
- [x] Ship gate (GO/NO-GO) — see decisions.md.
- [x] ROADMAP.md: checked off delivered items, updated "Current delivery" + M2 row.
- [ ] Delete evidence artifacts, archive mission (`report.md`, `pr-verdict.md`).
- [ ] Push branch — held pending explicit user confirmation (coordinator instructed not to push until confirmed, after the main-branch mistake earlier this mission).

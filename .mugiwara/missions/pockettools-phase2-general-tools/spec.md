# Spec bridge — pockettools-phase2-general-tools

Source: ROADMAP.md Phase 2 (lines 170-206), PLAN.md architecture/testing sections, CLAUDE.md/AGENTS.md standard. Only Phase 2; Phase 3+ untouched.

## Goal
Ship the first four general-purpose tools on the Phase 1 registry/scaffold infrastructure, each usable by a non-developer and useful for technical work (Phase 2 gate).

## Tools in scope
1. **json-formatter** (existing metadata, `Developer`) — pure formatter/minifier/validator; specific line/column errors; shareable state (indent + mode via URL query); PrimeVue dual-pane input/output.
2. **text-cleaner** (existing metadata, `Text`) — whitespace/case cleanup; word/char/line counts; copy + download.
3. **base64-tool** (new, scaffolded, `Developer`) — text encode/decode; file drag/drop; auto-detect direction; copy + download.
4. **uuid-generator** (new, scaffolded, `Developer`) — UUID v4/v7 + ULID; batch size; copy actions.

## Acceptance criteria (per ROADMAP + PLAN Definition of Done)
- Each tool: pure, framework-independent logic under `bun test`, no `any`/unapproved suppressions, JSDoc + `@example` on public functions.
- Each tool: thin PrimeVue component using only project tokens/components already registered (Aura blue, existing `pt-*` classes, `ToolActions`/`ToolState`/`ToolDualPane`/`ToolFileDrop` shared components), verb-first buttons, real labels, 44px touch targets, visible focus, no raw color/spacing literals.
- Each tool: Playwright e2e covering its core flow, and axe accessibility coverage with zero critical/serious violations at 375px.
- json-formatter additionally: light/dark screenshots captured as evidence.
- No new runtime dependency: base64 uses native `atob`/`btoa`/`TextEncoder`; UUID/ULID uses native `crypto.randomUUID`/`crypto.getRandomValues` (ladder rung 3/4, no package add).
- Registry regenerated from metadata (`bun run generate:registry`), never hand-edited.
- Existing Phase 1 test fixtures that assert json-formatter/text-cleaner are still lazy placeholders must be updated to a still-placeholder tool (`color-picker` or `password-generator`) so Phase 1 infra coverage (lazy-loading, 404, placeholder axe pass) is preserved without depending on tools this mission replaces.
- `bun run ci:local` green (fmt, lint, typecheck, registry check, coverage gate ≥85%/90%, audit, unit tests, build, Playwright).
- ROADMAP.md Phase 2 checkboxes ticked per item actually delivered with evidence; "Current delivery" line and M2 milestone row updated.

## Non-goals
- Phase 3 shell features (command palette, favorites, recent, paste detection).
- Any new dependency without an ADR.
- Changing color-picker/password-generator beyond what's needed to keep them as the Phase 1 placeholder fixtures.

## Constraints carried from CLAUDE.md/PLAN.md
Bun only; Nuxt 4 `app/`; PrimeVue 4.5.5 Aura blue; Tailwind v4 tokens; TypeScript strict; oxfmt/oxlint; `bun test` + Playwright + axe; Conventional Commits; no cross-tool imports; no network calls from tool logic.

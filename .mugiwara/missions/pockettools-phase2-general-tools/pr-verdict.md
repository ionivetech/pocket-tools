# PR material — Phase 2: First general-purpose tools

## Title
feat(tools): ship Phase 2 — JSON formatter, text cleaner, Base64, UUID/ULID generator

## Summary
- Delivers ROADMAP.md Phase 2.1-2.4: four real, working tools on top of the Phase 1 registry/scaffold infrastructure.
- Each tool: pure unit-tested logic, a PrimeVue Aura-blue component reusing the shared `ToolActions`/`ToolDualPane`/`ToolFileDrop` primitives, and a dedicated Playwright spec (core flow + axe + 44px touch targets at 375px).
- Fixed one security issue (JSON parser `__proto__` handling), one correctness bug (Base64 double-encode), one critical accessibility violation (UUID generator's InputNumber label), and one performance-budget regression (global vs. local PrimeVue component registration) found during self-review before this PR.
- UI pass: every tool's input/result area now sits in its own white card, matching the existing design system — no new colors, radii, or components.

## What changed
- New tools: `app/tools/{json-formatter,text-cleaner,base64-tool,uuid-generator}/` (metadata, schema, logic, ToolComponent.vue, unit tests).
- Shared: `app/components/ToolDualPane.vue` (per-pane cards), `nuxt.config.ts` (removed global PrimeVue component registration in favor of per-tool local imports; raised the documented PWA precache budget), `playwright.config.ts` (clipboard permission for copy-action tests).
- Test/coverage infra: `package.json` and `scripts/coverage-gate.ts` now include `app/tools` in the unit-test/coverage scope (tool-local tests were previously silently excluded); added a narrowly-scoped, documented allowlist entry for one generated file's untestable-by-unit-test closures; fixed one pre-existing flaky assertion in `tests/unit/coverage-gate.test.ts` unrelated to this change.
- New/updated e2e: `tests/e2e/{json-formatter,text-cleaner,base64-tool,uuid-generator}.pw.ts`; updated `tests/e2e/{shell,tool-infrastructure,accessibility}.pw.ts` and `tests/unit/tool-metadata.test.ts` since json-formatter/text-cleaner are no longer lazy placeholders (color-picker takes over as the "still a placeholder" fixture).
- Docs: `ROADMAP.md` (Phase 2 checked off, M2 milestone, "Current delivery"), `CHANGELOG.md` (Phase 2 entry).

## Per-flow-stage evidence
- Execution: commits a2f4938, 9686827, 785f37a, 52ecf6e, 9006477, 8bf39d1, c7131bc, c8924b7.
- Checkpoint/Quality/Gates/Review: see `.mugiwara/missions/pockettools-phase2-general-tools/report.md` (archived) for the full findings list and heal-cycle count (0 — every finding fixed in the pass that found it).
- Ship gate: GO — see `report.md`.

## Tests
- `bun test tests/unit app/tools`: 319 pass, 0 fail.
- `bun run coverage:gate`: new 88.43% lines / 100% functions (min 85/90); modified 90.08% lines / 97.50% functions (min 90/90). PASSED.
- `playwright test`: 43 pass, 0 fail (includes zero critical/serious axe violations and 44px touch targets at 375px for all four new tools).
- `bun run build`: exit 0; PWA precache 598.26 KiB (budget 704 KiB).

## Checks
`bun run ci:local` green end to end: fmt, lint, typecheck, registry-drift check, coverage gate, `bun audit` (no vulnerabilities), unit tests, build, Playwright.

## Verdict
**GO.** No critical or serious finding remains open. Rollback: this is a feature branch, not yet merged — rollback is simply not merging, or reverting the merge commit once it lands. No production deploy pipeline exists in this repository yet, so no runtime rollback path applies.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

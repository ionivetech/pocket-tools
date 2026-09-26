# Title

feat(tools): Phase 1 core infrastructure — generated registry, scaffolder, tool UI system, and a deterministic test harness

# Summary

Phase 1 gives PocketTools the infrastructure the tool catalog scales on: validated tool metadata
contracts, a **generated** registry and prerender route manifest, registry-backed `/tools` and
`/tools/[slug]` routes, a Bun scaffolder for new tools, a URL-state codec, a shared tool
action/state component system, a local error boundary with bounded retry, and a test harness where
Bun and Playwright collect disjoint file sets.

Two properties are worth calling out because they were the hard part of this mission:

- **The browser gate is deterministic by measurement, not by retry.** The intermittent
  `Response has been disposed` failure that made the required Playwright gate untrustworthy is
  **root-cause fixed** — the `route.fetch()` → `.text()` → `fulfill({ response })` pattern is gone
  repo-wide — and `retries` is now `0` everywhere, including CI. A green run now means
  first-attempt success. Cumulative evidence: **9 focused + 8 full green runs, 0 flakes,
  0 retries consumed**, across three independent agents.
- **Generated output cannot silently drift.** The generated registry and route manifest are
  freshness-checked inside `ci:local`, on the real CI path, and the check is proven to fail.

No `app/` file in this diff changes user-facing behaviour: the entire remediation wave touched only
tests, helpers, standards, and gate configuration.

# What changed

**Tool data (T1–T3, T5)**

- `ToolMetadata` contracts with validation at the boundary, before untrusted metadata reaches the
  registry.
- `scripts/generate-tool-registry.ts` generates the registry and the prerender route manifest from
  discovered sources, so routes cannot drift from slugs once generated.
- Runtime registry and search helpers; a URL-state codec for shareable 375px-first tool state.

**Scaffolder (T4)**

- `scripts/scaffold-tool.ts` writes five stub files per tool with `wx` flags, refuses any path that
  escapes the output root, and returns a `Result` instead of throwing.
- Generated source is injection-safe: no user-supplied text is interpolated into comments or
  templates. All string content reaches generated files through `JSON.stringify`; the only raw
  interpolation left is `args.slug`, which is regex-validated.

**Tool UI system (T6–T8)**

- Shared action, dual-pane, file-drop, and empty/loading/error state primitives; a tool composition
  boundary with a local error boundary and bounded retry; registry-backed collection and detail
  routes with a real 404 recovery path.

**Test harness (T9) + standards**

- Runner separation at the filename boundary: `bun test` collects `tests/unit/*.test.ts`, Playwright
  collects `tests/e2e/*.pw.ts`. `tests/unit/test-harness.test.ts` enforces that contract, so a future
  `*.spec.ts` browser test can no longer be silently uncollected.
- `tests/e2e/helpers/{app,chunk}.ts` — app-ready, axe, 44px touch-target, overflow, and bounded
  chunk-gate helpers, reused by all four browser suites.
- `AGENTS.md` gains `## Test standards` with ten anti-flake rules drawn from the actual failures of
  this mission. The four agent instruction files are symlinks to `AGENTS.md`, so they cannot drift.

# Per-flow-stage evidence

| Stage | Commit(s) | Evidence |
|---|---|---|
| T1–T8 | `76dac5f` … `11d0655` | Plan T1–T8 acceptance; full suite green at each commit |
| T9 harness | `d54984c` | 25/25 browser, 0 critical/serious axe, budgets met, 6 screenshots |
| T10 evidence | `4a81a91` | ROADMAP 31/31 Phase 1 checkboxes, Phase 2+ byte-identical |
| Quality | `4c33062`, `4e82c91`, `ca9b5ec` | Direct `tsc` gate restored; all measured complexity blockers removed |
| R1 anti-flake | `7999bbd` | Pattern deleted repo-wide; 5 focused × 7/7, 3 full × 25/25, 1 full under CPU saturation |
| R1b standards | `967f72a` | `AGENTS.md` +17, `README.md` +2; `fmt:check` clean |
| R2 safety + freshness | `89639a9` | Reverting the fix fails 8 tests, with the `*/` case failing at the **execution** assertion; registry gate proven to exit 1 on four drift classes |
| R3 reviewer follow-ups | `5d63a7c` | `retries: 0`; 5 focused + 3 full green; captain re-ran `test:e2e` = 25 passed |

# Tests

- `bun run test` — **112 pass / 0 fail / 341 expect / 12 files**; raw `bun test` identical, so runner
  separation holds.
- `bun run test:e2e` — **25 passed / 0 failed / 0 flaky / 0 retried** at `retries: 0`, 4 workers.
- Coverage — new **92.64%** (≥85), modified **100.00%** (≥90). No threshold changed.
- axe — **0 violations at any severity** on `/`, `/tools`, `/tools/json-formatter` (39 / 39 / 35
  passing rules), re-measured at the final SHA.
- Performance — initial JS **111,212 B** / 122,880 budget; initial CSS **5,680 B** / 30,720 budget.

# Checks

`bun run ci:local` at `5d63a7c` — **exit 0**: format (78 files) · lint · typecheck · registry
freshness (`4 tool definitions, 0 errors`) · coverage · audit (0 vulnerabilities) · unit · build
(12 routes, 2.73 MB / 642 kB gzip) · Playwright 25/25.

Across the whole mission **two** config lines changed and both are strengthenings. `.oxlintrc.json`,
`.oxfmtrc.json`, `tsconfig.json`, `bunfig.toml`, `.editorconfig`, `nuxt.config.ts`,
`.github/workflows/ci.yml`, `lefthook.yml`, and `bun.lock` are byte-unchanged — **no dependency
moved**.

- **Review (Robin): PASS**, reliability B → A−. B-1, M-2, M-4 resolved at the root. M-1, M-3
  open-accepted; M-5 open with priority raised.
- **Security (Jinbe): PASS** — **0 Critical / 0 High / 0 Medium** (was 1 medium), 5 low. F-01 and
  F-07 closed.
- **Gates (Franky): PASS-with-waiver.** The diff-size gate **failed on measurement** — +4,295 net
  LOC against an unchanged ≤400 threshold — and passes only under an explicit, mission-scoped,
  non-precedential human waiver. Zero `app/` files changed; +293 of the remediation wave's +310 is
  tests, helpers, standards, and gate config.

# Verdict

**Ready for review, with one open decision the reviewer must see.**

Known-open, carried deliberately rather than hidden: **M-1** (category literals triplicated without
an exhaustiveness guard), **M-3** (`ToolActions` / `ToolDualPane` / `ToolFileDrop` have no consumer
or test while the ROADMAP claims coverage), and **M-5** (`ToolComponent.vue` is generated but
unreachable).

**M-5 is a tripwire, not cleanup.** The injection fix is sound *only* because no route renders the
generated component. Closing M-5 on its own would silently regress a proven fix; it must be
reopened together with an explicit escaping strategy.

This PR does **not** claim all findings closed, and it does **not** claim the diff-size gate passed.

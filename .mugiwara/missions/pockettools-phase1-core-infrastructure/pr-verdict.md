# Title

feat(tools): Phase 1 core infrastructure — generated registry, scaffolder, tool UI system, and a self-enforcing quality gate

# Summary

Phase 1 gives PocketTools the infrastructure the tool catalog scales on: validated tool metadata
contracts, a **generated** registry and prerender route manifest, registry-backed `/tools` and
`/tools/[slug]` routes, a Bun scaffolder for new tools, a URL-state codec, a shared tool
action/state component system, a local error boundary with bounded retry, and a test harness where
Bun and Playwright collect disjoint file sets.

Three properties are worth the reviewer's attention, because each one was a finding that got fixed
at the root rather than papered over:

- **The browser gate is deterministic by measurement, not by retry.** The intermittent
  `Response has been disposed` failure that made the required Playwright gate untrustworthy is
  root-cause fixed — the `route.fetch()` → `.text()` → `fulfill({ response })` pattern is gone
  repo-wide — and `retries` is now `0` everywhere, including CI. Evidence: **9 focused + 8 full
  green runs, 0 flakes, 0 retries**, across three independent agents.
- **Coverage is now an enforced gate, not a printed report.** `ci:local` runs `scripts/coverage-gate.ts`,
  which enforces the project's own configured standard — new ≥ 85%, modified ≥ 90% — against the
  merge-base with the default branch, and **fails closed** on malformed coverage data. Measured
  now: **new 89.45% lines / 93.01% functions, modified 100.00%**.
- **Generated output cannot silently drift, and generated source cannot be injected into.** The
  registry and route manifest are freshness-checked on the real CI path, and hostile `--name` input
  can no longer terminate a comment or become a compiled template expression.

The quality gate failed **twice** on the way here and the fix is in the history, not scrubbed from it.

# What changed

**Tool data (T1–T3, T5)** — `ToolMetadata` validated at the boundary before untrusted metadata
reaches the registry; generated registry + route manifest; runtime registry and search helpers;
URL-state codec with a symmetric 4 KiB cap on both encode and decode.

**Scaffolder (T4)** — `scripts/scaffold-tool.ts` writes five stub files per tool with `wx` flags,
refuses any path escaping the output root, and returns a `Result` instead of throwing. All string
content reaches generated files through `JSON.stringify`; the only raw interpolation left is
`args.slug`, validated by the single shared `isToolSlug`. The tool name is bound in `<script setup>`
with every `<` emitted as `<`, so `</script>` cannot terminate the block.

**Tool UI system (T6–T8)** — shared action, dual-pane, file-drop, and empty/loading/error state
primitives; a composition boundary with a local error boundary and bounded retry; registry-backed
collection and detail routes with a real 404 recovery path.

**Single-sourced rules** — tool categories and the tool slug rule each had three copies; both now
have exactly one owner, with tests that fail if a consumer drifts. The per-tool component path
delegates its slug segment to the same predicate rather than re-encoding the pattern.

**Test harness + standards** — `bun test` collects `tests/unit/*.test.ts`, Playwright collects
`tests/e2e/*.pw.ts`, and `tests/unit/test-harness.test.ts` enforces that contract so a future
`*.spec.ts` browser test cannot be silently uncollected. `tests/e2e/helpers/{app,chunk}.ts` hold the
shared app-ready, axe, 44px, overflow, and bounded chunk-gate logic. `AGENTS.md` gains
`## Test standards` with ten anti-flake rules drawn from this mission's actual failures; the four
agent instruction files are symlinks to `AGENTS.md` and cannot drift.

**Quality gate** — `scripts/coverage-gate.ts` reads lcov, drops records resolving outside the repo,
discovers its base as the merge-base with the default branch, enforces the new/modified split, fails
closed on a malformed count, and declares a loud `AGGREGATE-ONLY` degraded mode if the base cannot be
resolved — which hosted CI now treats as fatal via `COVERAGE_GATE_REQUIRE_SPLIT`.

# Per-wave evidence

| Wave | Commits | Evidence |
|---|---|---|
| T1–T10 | `76dac5f` … `4a81a91` | Plan acceptance per task; ROADMAP 31/31 Phase 1 checkboxes, Phase 2+ byte-identical |
| Quality | `4c33062`, `4e82c91`, `ca9b5ec` | Direct `tsc` gate restored; all measured complexity blockers removed |
| R1 anti-flake | `7999bbd` | Pattern deleted repo-wide; 5 focused × 7/7, 3 full × 25/25, 1 full under 8-process CPU saturation |
| R1b standards | `967f72a` | `AGENTS.md` +17, `README.md` +2 |
| R2 safety + freshness | `89639a9` | Reverting the fix fails 8 tests, the `*/` case at the **execution** assertion; registry gate proven to exit 1 on four drift classes |
| R3 follow-ups | `5d63a7c` | `retries: 0`; 5 focused + 3 full green |
| R4 single-sourcing + M-5 | 8 commits | Three duplicated rules single-sourced; per-tool path wired; 34-case equivalence corpus proves the accepted path language is unchanged; **F-06 closed** |
| R5 gate correctness | 3 commits | First NO-GO answered: new-code 84.99% → 89.08%, floor 0.84 → 0.85, aggregate replaced by the split; **F-08 closed** |
| R6 fail-closed | `133a031`, `2343df1` | Second NO-GO answered; the `NaN` fail-open reproduced at the old SHA (exit 0, `PASSED`) and closed; `COVERAGE_GATE_REQUIRE_SPLIT` set in CI; floors pinned to config by a test |

# Tests

- `bun run test` — **208 pass / 0 fail / 684 assertions / 16 files**.
- `bun run test:e2e` — **25 passed / 0 failed / 0 retried** at `retries: 0`, 4 workers.
- Coverage gate — **new 89.45% lines, 93.01% functions; modified 100.00%**, against floors of
  85/90. No threshold lowered; the one floor that moved was raised.
- axe — **0 violations at any severity** on `/`, `/tools`, `/tools/json-formatter` (39/39/35 rules).
- Performance — initial JS **111,213 B** / 122,880 budget; initial CSS **5,993 B** / 30,720 budget.

# Checks

`bun run ci:local` at `2343df1` — **exit 0**: format (83 files) · lint · typecheck · registry
freshness · coverage gate · audit (0 vulnerabilities) · unit · build (12 routes, 2.73 MB / 642 kB
gzip) · Playwright 25/25.

Across the whole mission **four** config files changed: `package.json` (gate script),
`.github/workflows/ci.yml` (`fetch-depth: 0`, `COVERAGE_GATE_REQUIRE_SPLIT`), `.mugiwara/config`
(mode only), and the gate's own floors. `playwright.config.ts`, `bun.lock`, `nuxt.config.ts`,
`bunfig.toml`, `.oxlintrc.json`, `.oxfmtrc.json`, `.editorconfig`, `tsconfig.json`, and `lefthook.yml`
are byte-unchanged. **No dependency moved.**

- **Review (Robin): PASS**, reliability **A**. All three original majors resolved.
- **Security (Jinbe): PASS** — **0 Critical / 0 High / 0 Medium**. F-01, F-06, F-07, F-08, F-09
  closed; **F-02 withdrawn as erroneous**; three Low findings open with no live caller; two rows
  flagged **To Review** rather than invented to balance a count.
- **Gates (Franky): NO-GO, then re-run.** The diff-size gate **failed on measurement** at
  +6,959 net LOC against an unchanged ≤400 threshold and passes only under an explicit,
  mission-scoped human waiver whose approved number no longer describes the diff. **This is the one
  item awaiting the human.**

# Verdict

**Ready for review, with one open decision for the reviewer.**

Known-open and carried deliberately: the **W3 diff-size waiver needs re-confirmation** (approved at
+4,295 with `app/` untouched; the diff is now +6,959 with `app/` at 27 files), **F-03 / F-04 / F-05**
at Low with no live caller, two security rows **To Review**, and no render coverage for the three
shared components — which `ROADMAP.md` now states plainly rather than implying otherwise.

One residual is worth naming: the per-tool component path is **contract-proven, not Vite-proven**,
because no scaffolded tool exists in the repo to exercise it. The four shipped tools still point at
`ToolPlaceholder.vue`, so nothing user-facing depends on it and a mistake would surface as a loud
build-time resolve error.

This PR does **not** claim the diff-size gate passed, and does **not** claim all findings are closed.

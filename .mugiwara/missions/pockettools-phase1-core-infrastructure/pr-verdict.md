# Title

feat(tools): Phase 1 core infrastructure — generated registry, scaffolder, tool UI system, and a self-enforcing quality gate

# Summary

Phase 1 gives PocketTools the infrastructure the tool catalog scales on: validated tool metadata
contracts, a **generated** registry and prerender route manifest, registry-backed `/tools` and
`/tools/[slug]` routes, a Bun scaffolder for new tools, a URL-state codec, a shared tool
action/state component system, a local error boundary with bounded retry, and a test harness where
Bun and Playwright collect disjoint file sets.

Three properties deserve a reviewer's attention, because each was a finding fixed at the root rather
than papered over:

- **The browser gate is deterministic by measurement, not by retry.** The intermittent
  `Response has been disposed` failure that made the required Playwright gate untrustworthy is
  root-cause fixed, and `retries` is now `0` everywhere including CI. Evidence: **14 focused + 13 full
  green runs, 0 flakes, 0 retries**, across four independent agents.
- **Coverage is an enforced gate, not a printed report.** `scripts/coverage-gate.ts` enforces the
  project's own configured standard — new ≥ 85%, modified ≥ 90% — against the merge-base with the
  default branch, **fails closed** on malformed coverage data, and now **fails when a new
  instrumentable source file is invisible to the split**. Measured: **new 89.80% lines / 93.10%
  functions, modified 100.00%**. The gate appears in its own lcov, so it is measuring itself.
- **Generated output cannot silently drift, and generated source cannot be injected into.** The
  registry and route manifest are freshness-checked on the real CI path; hostile `--name` input can no
  longer terminate a comment or become a compiled template expression.

The quality gate failed **three** times on the way here, and five of the findings it caught were
traced back to code this same branch introduced. That history is in the diff, not scrubbed from it.

# What changed

**Tool data** — `ToolMetadata` validated at the boundary; generated registry + route manifest;
runtime registry and search; URL-state codec with a symmetric 4 KiB cap on both encode and decode.
The category list and the slug rule each had **three** copies; both now have exactly one owner, with
tests that fail if a consumer drifts.

**Scaffolder** — five stub files per tool with `wx` flags, refuses any path escaping the output root,
returns a `Result` instead of throwing. All string content reaches generated files through
`JSON.stringify`; the only raw interpolation left is `args.slug`, validated by the shared
`isToolSlug`. The tool name is bound in `<script setup>` with every `<` emitted as `<`.

**Tool UI system** — shared action, dual-pane, file-drop, and state primitives; a composition boundary
with a local error boundary and bounded retry; registry-backed collection and detail routes with a
real 404 recovery path.

**PWA** — the `pockettools-pages` navigation cache is keyed by path, not query string, via a
`cacheKeyWillBeUsed` plugin that rewrites the key on read **and** write. Verified in the shipped
`.output/public/sw.js`, with the SSR output measured byte-identical across query variants so a shared
key serves no wrong content.

**Test harness + standards** — `bun test` takes `tests/unit/*.test.ts`, Playwright takes
`tests/e2e/*.pw.ts`, and `tests/unit/test-harness.test.ts` enforces it. `tests/e2e/helpers/` holds the
shared app-ready, axe, 44px, overflow, and bounded chunk-gate logic. `AGENTS.md` gains
`## Test standards` with ten anti-flake rules drawn from this mission's actual failures.

# Per-wave evidence

| Wave | Evidence |
|---|---|
| T1–T10 | Plan acceptance per task; ROADMAP 31/31 Phase 1 checkboxes, Phase 2+ byte-identical |
| Quality | Direct `tsc` gate restored; all measured complexity blockers removed |
| R1 anti-flake | Pattern deleted repo-wide; focused ×5, full ×3, one full under 8-process CPU saturation |
| R2 safety + freshness | Reverting the fix fails 8 tests, the `*/` case at the **execution** assertion; registry gate proven to exit 1 on four drift classes |
| R3 follow-ups | `retries: 0`; focused ×5 + full ×3 green |
| R4 single-sourcing + M-5 | Three duplicated rules single-sourced; per-tool path wired; 34-case equivalence corpus proves the accepted path language is unchanged; F-06 closed |
| R5 gate correctness | First NO-GO answered: new-code 84.99% → 89.08%, floor 0.84 → 0.85, aggregate replaced by the split; F-08 closed |
| R6 fail-closed | Second NO-GO answered; the `NaN` fail-open reproduced at the old SHA (exit 0, `PASSED`) and closed; floors pinned to config by a test |
| R7 PWA + licence + components | Byte-identity of SSR across query variants measured; licence claim corrected in **two** files; the false premise that anything imports `url-state.ts` found; F-03 and F-05 closed |
| R8 blind spot | Third NO-GO answered: the gate now fails when a new instrumentable file is absent from lcov, proved with 8 scratch cases including a reasonless-allowlist entry |

# Tests

- `bun run test` — **223 pass / 0 fail / 747 assertions / 17 files**.
- `bun run test:e2e` — **26 passed / 0 failed / 0 retried** at `retries: 0`, 4 workers.
- Coverage gate — **new 89.80% lines, 93.10% functions; modified 100.00%**, against floors of 85/90.
  The only floor that ever moved was **raised**.
- axe — **0 violations at any severity** on `/`, `/tools`, `/tools/json-formatter` (39/39/35 rules).
- Performance — initial JS **111,213 B** / 122,880; initial CSS **5,993 B** / 30,720.

# Checks

`bun run ci:local` at `3dc815d` — **exit 0**: format (84 files) · lint · typecheck · registry
freshness · coverage gate · audit (0 vulnerabilities) · unit · build (12 routes, 2.73 MB / 642 kB
gzip) · Playwright 26/26.

`playwright.config.ts`, `bun.lock`, `bunfig.toml`, `.oxlintrc.json`, `.oxfmtrc.json`, `.editorconfig`,
`tsconfig.json`, and `lefthook.yml` are byte-unchanged. **No dependency moved.**

- **Review (Robin): PASS, reliability A−** at `6824612`. All five original majors resolved.
- **Security (Jinbe): PASS** — **0 Critical / 0 High / 0 Medium**, one open Low (F-04). F-01, F-03,
  F-05, F-06, F-07, F-08, F-09 closed; **F-02 withdrawn as erroneous**.
- **Gates (Franky): NO-GO ×3, answered.** The diff-size gate **failed on measurement** at +7,567 net
  LOC against an unchanged ≤400 threshold and passes only under an explicit, mission-scoped human
  waiver. **`app/` is unchanged at 27 files / +1,551 across R7 and R8**, so the basis of the last
  re-confirmation still holds; the total moved by +608 of tests, config, and standards.

# Verdict

**Ready for review, with one item that is the human's alone: the W3 waiver.**

Known-open and carried deliberately: **F-04** at Low with no live caller; the **unconsumed
`url-state.ts` codec** (wiring it is product behaviour, out of scope here); **no render coverage** for
the three shared components, which have a compile-and-contract check only; a **redundant
`matchOptions.ignoreSearch`** line; and `README.md:33` enumerating 9 of the 12 MIT Prime packages.

Two things to weigh before approving:

1. **The diff-size gate failed and was waived**, most recently at +6,959 and now measuring +7,567.
   It is not a pass, and the waiver's approved number no longer matches the diff.
2. **The coverage gate has no authored rollback plan.** Removing `scripts/coverage-gate.ts` and its
   `ci:local` step restores the previous behaviour.

This PR does **not** claim the diff-size gate passed, and does **not** claim all findings are closed.

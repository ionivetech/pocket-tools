# Closure report — pockettools-phase1-core-infrastructure

- Mission: `pockettools-phase1-core-infrastructure`
- Branch: `feature/phase-1-core-infrastructure`
- Final SHA: `5d63a7cd881629cc9e19961784c397a20776166f`
- Base SHA: `cbd3f2044aa6a93377a78953cb33de04592560e7`
- Lane: full · Mode: auto · Heal cycles used: 2 of 3 (R1/R2/R3 ran **outside** the heal budget by explicit human authorization, `decisions.md` #38)
- Closed: 2026-09-26

## 1. Mission summary

Phase 1 of PocketTools: the core infrastructure that lets the catalog scale — tool metadata
contracts, a generated registry and route manifest, registry-backed routing, a Bun tool scaffolder,
a URL-state codec, the shared tool action/state component system, a local error boundary, and the
split Bun/Playwright test harness with axe and performance budgets. **No Phase 2 tool behaviour and
no user-facing `app/` change is in this diff** — the user-facing surface is byte-identical to the
base commit.

## 2. What shipped

| Area | Delivered |
|---|---|
| T1 | `ToolMetadata` contracts + validated source records |
| T2 | Generated registry + prerender route manifest, with a real freshness gate |
| T3 | Runtime registry and search helpers |
| T4 | Bun tool scaffolder producing five stub files per tool |
| T5 | URL-state codec |
| T6 | Shared tool action / state UI primitives |
| T7 | Tool layout composition + local error boundary with bounded retry |
| T8 | Registry-backed `/tools` and `/tools/[slug]` routes + route error state |
| T9 | Runner-separated test harness: `bun test` unit, Playwright `*.pw.ts` browser, axe, budgets |
| T10 | ROADMAP evidence for Phase 1 |

## 3. Remediation wave after the Flow 7 FAIL

The first review returned FAIL (1 blocker, 5 majors). The human authorized a bounded wave
(`decisions.md` #38) rather than a fourth heal cycle. Four commits followed:

| Commit | Change | Evidence |
|---|---|---|
| `7999bbd` | R1 — `tests/e2e/helpers/{app,chunk}.ts`; deleted the `route.fetch()` → `.text()` → `fulfill({ response })` pattern repo-wide | 5 focused × 7/7 and 3 full × 25/25, plus a full run under 8-process CPU saturation |
| `967f72a` | R1b — `## Test standards` + 10 anti-flake rules in `AGENTS.md`, README pointer | `fmt:check` clean; the four agent instruction files are mode `120000` symlinks to `AGENTS.md`, so they cannot drift |
| `89639a9` | R2 — removed raw `args.name` from JSDoc and Vue template; `ci:local` now runs `generate:registry -- --check`; hostile-input, drift, and harness-naming tests | Reverting the fix fails 8 tests, and the `*/ … /*` case fails at the **execution** assertion, not a parse check |
| `5d63a7c` | R3 — `retries: 0`, explicit navigation timeouts, route abort on failed chunk fetch, `__pwned` cleanup in a `finally`, `AGENTS.md` rule 3 amended | 5 focused × 7/7 + 3 full × 25/25 at `retries: 0`; captain re-ran `test:e2e` = 25 passed |

Two captain briefs were factually wrong and the executing agent caught both: a `*/` comment
break-out emits *valid* TypeScript that `transformSync` cannot reject, and changing a tool's
**name** cannot cause registry drift (only slug changes do). Both were adjudicated in the agent's
favour and the corrections are recorded in `decisions.md` #41.

## 4. Flow-stage outcomes

| Stage | Outcome |
|---|---|
| Flow 0–2 | Triage, spec bridge, 10-task / 7-wave plan (no re-plan needed on resume) |
| Flow 3 | T1–T10 executed; Q1 complexity refactor `ca9b5ec` |
| Flow 4 | Checkpoint PASS after heal cycles 2 and 3 |
| Flow 5 | Quality FAIL → Q1 resolved complexity blockers; the disposed-response race was human-waived at the time |
| Flow 6 | Gates **PASS-with-waiver** at `ca9b5ec`, re-run **PASS-with-waiver** at `5d63a7c` |
| Flow 7 | FAIL → remediation → Robin re-review **PASS** (reliability B → A−), Jinbe **PASS** |
| Flow 8 | Heal cycles 2 and 3 used; R1/R2/R3 deliberately outside the heal budget |
| Flow 9 | This report |

## 5. Gate verdicts (final, at `5d63a7c`)

Full `bun run ci:local` exit 0: format (78 files) · lint · typecheck · **registry freshness
(`4 tool definitions, 0 errors`)** · coverage **112 pass / 0 fail / 341 expect / 12 files** · audit
0 vulnerabilities · unit 112 / 0 · build 12 prerendered routes, 2.73 MB (642 kB gzip) ·
**Playwright 25 passed / 0 failed / 0 flaky / 0 retried**.

Coverage: new **92.64%** (≥85), modified **100.00%** (≥90). Raw `bun test` is also green at 112/0,
so runner separation holds.

**No gate was weakened.** Across `ca9b5ec..5d63a7c` exactly two config lines changed and both are
strengthenings: `ci:local` gained a failing-fast step, and `retries` went from `CI ? 1 : 0` to `0`.
`.oxlintrc.json`, `.oxfmtrc.json`, `tsconfig.json`, `bunfig.toml`, `.editorconfig`, `nuxt.config.ts`,
`.github/workflows/ci.yml`, `lefthook.yml`, and `bun.lock` are byte-unchanged — no dependency moved.

**Diff-size: FAIL on measurement, PASS only under waiver W3.** +4,295 net LOC / 4,809 churn / 56
files against an unchanged ≤400 threshold (10.74×). Zero `app/` files changed; +293 of the +310 from
the four remediation commits is tests, helpers, standards, and gate config. The human re-confirmed
the waiver at this measurement (`decisions.md` #45). **This gate failed and was waived — it did not
pass.** The waiver is mission-scoped, non-precedential, and expires at archive.

## 6. Review and security dispositions

| ID | Severity | Disposition |
|---|---|---|
| B-1 Playwright nondeterminism | blocker | **RESOLVED** — root cause deleted, not masked; human waivers #31/#33 are superseded by measurement |
| M-2 registry freshness | major | **RESOLVED** — gate on the real CI path; proven exit 1 on four drift classes |
| M-4 hostile `--name` injection | major | **RESOLVED** — interpolation removed; Jinbe's F-01 closed with it |
| M-1 category triplication | major | **OPEN — open-accepted**, pre-existing, outside the authorized wave |
| M-3 untested components | major | **OPEN — open-accepted**, evidence-claim gap, no runtime risk |
| M-5 unreachable `ToolComponent.vue` | major | **OPEN — priority raised**, see §8 |
| F-01 (security) | medium → closed | Generated-source injection sink removed; **security is now 0 Critical / 0 High / 0 Medium** |
| F-07 (security) | low → closed | Both halves: documented rule + `tests/unit/test-harness.test.ts` |
| F-02/03/04/05/06 | low | Open, unchanged, no live caller |

**The mission does not claim "all findings closed" or "no open blockers".** `state.json` records
`blockers_open: 0` because the savepoint counter does not recognise the open-accepted disposition;
this report and `blockers.md` are the truthful ledger.

## 7. Test evidence

- Unit: **112 / 0**, coverage 92.64% new, 100% modified.
- Browser: **25 / 0** at `retries: 0`, 4 workers.
- Cumulative determinism evidence at `retries: 0` across three independent agents: **9 focused + 8
  full green runs, 0 flakes, 0 retries consumed.** A green run now means first-attempt success.
- axe: **0 violations at any severity** on `/`, `/tools`, `/tools/json-formatter` (39 / 39 / 35
  passing rules) — re-measured at the final SHA, not carried forward.
- Performance: initial JS **111,212 B** / 122,880 budget (11 resources); initial CSS **5,680 B** /
  30,720 budget (1 resource).
- Screenshots: 6 retained (375 / 768 / 1440 × light / dark).

## 8. Residual risks

1. **M-5 is a tripwire, not cleanup.** The M-4 fix is sound *only* because no route renders the
   generated `ToolComponent.vue` — `componentPath` is pinned to `~/components/ToolPlaceholder.vue`.
   Closing M-5 in isolation would silently regress a proven fix. It must be reopened **together
   with** an explicit escaping strategy (a `<script setup>` binding with `</script>` and `<!--`
   neutralising, not a template interpolation). See `decisions.md` #42.
2. **M-1 / M-3** are known structural and evidence gaps, accepted rather than fixed.
3. **Tooling gap:** there is no `coverage-gate` script or coverage tool in the repo; the new/modified
   coverage split is a documented derivation, not an enforced gate. Restated, not papered over.
4. **Axe coverage is severity-complete but not rule-pinned** — no `withTags` set and no declared
   target conformance level.
5. The `globalThis.__pwned` marker in one unit test is deliberate test-only global mutation,
   cleaned in a `finally`; contained and not a rule-7 violation.

## 9. Rollback

Fully reversible — four commits on a feature branch, no migration, no schema, no data, no
dependency change, no deploy. `git revert 5d63a7c 89639a9 967f72a 7999bbd` returns the branch to
`ca9b5ec`; reverting past that reaches the base. Nothing was merged, so there is nothing to un-merge.
The one directional change to be aware of: removing the CI retry means a future genuine flake will
fail the build instead of being retried. That is the intended trade — a green gate now means the
test passed the first time.

## 10. Deferred to a future mission

M-1 (single-source categories + exhaustiveness guard), M-3 (consume or test `ToolActions` /
`ToolDualPane` / `ToolFileDrop`, or correct the ROADMAP evidence claim), M-5 (align the
`componentPath` contract together with an escaping strategy), the missing `coverage-gate` tool, and
F-06. None blocks this ship.

## 11. What the mission may and may not claim

**May claim:** Phase 1 core infrastructure delivered and evidence-backed; every gate green on fresh
execution; the browser suite deterministic **by measurement rather than by retry**; security free of
Critical, High, and Medium findings.

**May not claim:** that all findings are closed; that the diff-size gate passed; any Lighthouse
score; any Phase 2 capability.

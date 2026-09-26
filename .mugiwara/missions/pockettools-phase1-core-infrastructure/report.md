# Closure report — pockettools-phase1-core-infrastructure

- Mission: `pockettools-phase1-core-infrastructure`
- Branch: `feature/phase-1-core-infrastructure`
- Final SHA: `2343df1de5b750ab565611247be597dd5aa010e3`
- Base SHA: `cbd3f2044aa6a93377a78953cb33de04592560e7`
- Scope: full · Mode: auto · Heal cycles used: **2 of 3** — waves R1–R6 ran deliberately **outside** the heal budget by explicit human authorization (`decisions.md` #38, #48)

## 1. Mission summary

Phase 1 gave PocketTools the infrastructure the tool catalog scales on: validated tool metadata
contracts, a **generated** registry and prerender route manifest, registry-backed routing, a Bun
tool scaffolder, a URL-state codec, the shared tool action/state component system, a local error
boundary, and a test harness where Bun and Playwright collect disjoint file sets.

It then failed review, was remediated through **six** waves, and failed its own gate **twice** on the
way. That history is part of the record, not something to smooth over.

## 2. What shipped

| Area | Delivered |
|---|---|
| T1–T3, T5 | `ToolMetadata` contracts validated at the boundary; generated registry + route manifest; runtime registry and search; URL-state codec |
| T4 | Bun tool scaffolder — five stub files per tool, `wx` flags, refuses any path escaping the output root, `Result` over exceptions |
| T6–T8 | Shared action/dual-pane/file-drop/state primitives; tool composition boundary with bounded retry; registry-backed `/tools` and `/tools/[slug]` with a real 404 |
| T9 | Runner-separated harness: `bun test` collects `tests/unit/*.test.ts`, Playwright collects `tests/e2e/*.pw.ts`, enforced by a test |
| T10 | ROADMAP evidence for Phase 1 |

## 3. Remediation waves R1–R6 (18 commits)

| Wave | Commits | Outcome |
|---|---|---|
| R1 anti-flake | `7999bbd` | `tests/e2e/helpers/{app,chunk}.ts`; the `route.fetch()` → `.text()` → `fulfill({response})` pattern deleted repo-wide |
| R1b standards | `967f72a` | `AGENTS.md` `## Test standards` + 10 anti-flake rules; the four instruction files are mode `120000` **symlinks** to `AGENTS.md` and cannot drift |
| R2 safety + freshness | `89639a9` | raw `args.name` removed from JSDoc and Vue template; `ci:local` gained `generate:registry -- --check`; hostile-input, drift, and harness-naming tests |
| R3 reviewer follow-ups | `5d63a7c` | `retries: 0`; navigation timeouts; route abort on failed fetch; `__pwned` cleanup in a `finally`; rule 3 amended |
| R4 single-sourcing + M-5 | `046390f`, `a4b6982`, `6f95c62`, `04d8314`, `e97ab34`, `a952a63`, `7d5a2d1`, `17fc0e8` | categories and the slug rule single-sourced; per-tool component wired into the contract; `ROADMAP.md` evidence corrected; **F-06 closed**; a real coverage gate added |
| R5 gate correctness | `3118735`, `1750c2e`, `95bf73c` | gate enforces the configured new/modified split instead of a permissive aggregate; `fetch-depth: 0`; **F-08 closed**; trailing dots stripped, ZWNJ/ZWJ preserved |
| R6 fail-closed | `133a031`, `2343df1` | **F-09 closed** — the gate failed *open* on `NaN`; malformed coverage data now fails closed; `COVERAGE_GATE_REQUIRE_SPLIT` set in CI; floors pinned to `.mugiwara/config` by a test |

## 4. Two NO-GOs, both real

The gate owner returned **NO-GO** twice. Neither was a rubber stamp, and the second one is the most
useful finding in this report.

**First NO-GO (after R4).** The project's own written standard was red — new-code coverage 84.99%
against a configured `coverage_new=85` — while the newly added gate reported green. The cause was
one file: `scripts/coverage-gate.ts` entered the new-code set at 53.49%. The wave that added the
coverage gate is what pushed the metric under the floor. The gate's floor also sat at `0.84` while
the standard said `85`, and the repo aggregate it enforced was the *more generous* number. Principle
adopted verbatim: *a gate green where the standard is red is precisely what gates exist to prevent.*

**Second NO-GO (after R5).** Bookkeeping, not defects: the W3 waiver's approved number no longer
described the diff, and four ledger rows were stale. The gate owner explicitly refused three things
it could have made easy — extending the waiver, changing the 400 threshold, and re-anchoring
evidence it had not re-measured.

**A fail-open the security review caught in between.** R5's gate recorded shortfalls with
`if (ratio.lines < min)`. A non-numeric coverage count yields `NaN`, and every `NaN` comparison is
false — so the class recorded **no shortfall** and the gate printed `PASSED` with zero coverage. The
pre-split gate used `>=` and failed closed, so **R5 introduced this**. Root cause was structural:
`runGate` open-coded a second comparison path instead of routing through the already-exported
`isCoverageAcceptable`. Fixed by unifying to one comparison, not by adding a second guard.

## 5. Gate verdicts (final, measured at `2343df1`)

`bun run ci:local` exit 0: format (83 files) · lint · typecheck · registry freshness
(`4 tool definitions, 0 errors`) · **coverage gate: new 89.45% lines / 93.01% functions (min 85/90),
modified 100.00% (min 90)** · audit 0 vulnerabilities · unit **208 pass / 0 fail / 684 expect / 16
files** · build 12 routes, 2.73 MB (642 kB gzip) · **Playwright 25 passed / 0 failed / 0 retried**.

The coverage criterion is **green on the configured metric**, measured first-hand by the gate owner
with an independent parser, not cited from the implementer. Headroom is 55 uncovered lines at the
85% floor, versus 18 before R5.

**No gate was weakened.** Across the whole mission only four config files changed: `package.json`
(gate script), `.github/workflows/ci.yml` (`fetch-depth: 0`, `COVERAGE_GATE_REQUIRE_SPLIT`),
`.mugiwara/config` (mode only), and the gate's own floors — which were **raised** from 0.84 to 0.85.
`playwright.config.ts`, `bun.lock`, `nuxt.config.ts`, `bunfig.toml`, `.oxlintrc.json`, `.oxfmtrc.json`,
`.editorconfig`, `tsconfig.json`, and `lefthook.yml` are byte-unchanged. No dependency moved.

## 6. Review and security dispositions

| ID | Severity | Disposition |
|---|---|---|
| B-1 Playwright nondeterminism | blocker | **RESOLVED** at the root; waivers #31/#33 superseded by measurement |
| M-2 registry freshness | major | **RESOLVED** — proven to exit 1 on four drift classes |
| M-4 hostile `--name` injection | major | **RESOLVED** — the injection sink was removed, not escaped |
| M-1 category triplication | major | **RESOLVED** — single-sourced; the #42/#50 tripwire discharged |
| M-3 shared component coverage | major | **RESOLVED as an evidence correction** — the claim is now true; render tests are *not* fixed and are not claimed to be |
| M-5 unreachable `ToolComponent.vue` | major | **RESOLVED** — landed *with* the escaping strategy, so closing it cannot regress M-4 |
| F-01 generated-source injection | medium | **CLOSED** |
| F-02 URL-state decode cap | Low | **WITHDRAWN — the finding was wrong.** It cited `url-state.ts:122` as proof the guard was encode-only; line 122 **is** the decode guard, the file is byte-identical since its single commit, and the guard precedes both decode steps |
| F-06 download filename charset | Low | **CLOSED** — both prescribed halves |
| F-07 uncollected browser tests | Low | **CLOSED** |
| F-08 trailing dot in filename | Low | **CLOSED** in `1750c2e` |
| F-09 coverage gate fail-open | Low | **CLOSED** in `133a031` |
| F-03, F-04, F-05 | Low | Open, unchanged, no live caller |
| — | Low | 2 rows **To Review** — provenance was a lost transcript; no IDs invented to balance the count |

**Security: 0 Critical / 0 High / 0 Medium.** Reliability **A**.

## 7. Test evidence

- Unit **208 / 0** / 684 assertions / 16 files. Browser **25 / 0** at `retries: 0`, 4 workers.
- Browser determinism: **9 focused + 8 full green runs, 0 flakes, 0 retries**, across three
  independent agents. A green run means first-attempt success.
- axe: **0 violations at any severity** on `/`, `/tools`, `/tools/json-formatter` (39/39/35 rules).
- Performance: initial JS **111,213 B** / 122,880; initial CSS **5,993 B** / 30,720.
- Both evidence files were **re-measured**, not relabelled — the CSS figure genuinely moved because
  `app/data/tools.ts` changed in R4.

## 8. Residual risks

1. **W3 waiver needs re-confirmation.** Approved at +4,295 / 4,809 / 56 files with `app/` untouched;
   the diff is now **+6,959 / 7,495 / 66 files** with `app/` at 27 files / +1,551. The waiver lapsed
   by its own clause. The gate owner refuses to extend it; only the human can.
2. **The per-tool component path is contract-proven, not Vite-proven.** No scaffolded tool exists in
   the repo, so the nested `~/tools/<slug>/ToolComponent.vue` shape is not exercised at runtime. The
   four shipped tools still point at `ToolPlaceholder.vue`, so nothing user-facing depends on it, and
   the failure mode would be a loud build-time resolve error.
3. **The coverage gate's shape guard is not the control.** `count()` is; the guard is textual and
   defeatable by aliasing. Recorded in `security.md` so no future reader over-trusts it.
4. **`ci:local` runs the unit suite twice** — once inside `coverage:gate`, once as `bun run test`.
   Referred to the gate owner rather than unilaterally removed.
5. **The 170-`\p{Cf}` filter preserves U+200C/U+200D**, which is correct for Persian, Indic, and emoji
   names. Residual is a display-vs-bytes mismatch of the same Low class already tracked.
6. **No `coverage-gate` blind spots are closed**: an untested new source file can be absent from lcov
   entirely and therefore invisible to the split. 21 uninstrumented diff files are named on each run.

## 9. Rollback

Fully reversible. 30 commits on an unmerged feature branch; no migration, schema, data, or dependency
change; nothing deployed. `git revert` back through the R6 → R1 → T-series commits returns the branch
to `cbd3f20`. Nothing was merged, so there is nothing to un-merge. The one directional change to
note: removing the CI retry means a future genuine flake fails the build instead of being retried —
that is the intended trade.

## 10. Deferred

F-03 (PWA `NetworkFirst` navigate rule lacks `ignoreSearch`), F-04 (dynamic `import()` of a registry
component), F-05 (`node_modules` drift vs `bun.lock`, and the PrimeVue/PrimeUI MIT claim in
`AGENTS.md:9`), two security rows **To Review**, real render coverage for the three shared
components, and the coverage gate's lcov blind spot for uninstrumented files. None blocks this ship.

## 11. What the mission may and may not claim

**May claim:** Phase 1 core infrastructure delivered and evidence-backed; the coverage gate green on
the project's own configured metric; the browser suite deterministic **by measurement rather than
by retry**; security free of Critical, High, and Medium findings; all three original review majors
resolved.

**May not claim:** that the diff-size gate passed — it **failed** and was waived, and the waiver
needs re-confirmation; that all security findings are closed; that the shared components have render
coverage; any Lighthouse score; any Phase 2 capability.

## 12. Corrections on the record

Four times an agent's evidence overruled a captain's premise, and the record says so: a
trailing-newline claim that was false in JavaScript (`$` without `m` asserts true end-of-input); an
ASCII filename allowlist that would have broken `café.txt` and `简历.pdf`; a "dead code" `??` that
`noUncheckedIndexedAccess: true` made a required narrowing, proved by mutation (`TS2345`); and a
`vue/compiler-sfc` undeclared-dependency finding that was a false positive — it is a declared
subpath of the declared `vue` package. The captain also corrected the reviewer's M-1 severity
downward (`decisions.md` #49), and the reviewer **disputed the stated basis** and was right on the
failure mode (#50). One security finding survived four waves because nobody re-read the file it
concerned; it was found and withdrawn.

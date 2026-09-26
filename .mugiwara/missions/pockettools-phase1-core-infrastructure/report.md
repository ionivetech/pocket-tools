# Closure report — pockettools-phase1-core-infrastructure

- Mission: `pockettools-phase1-core-infrastructure`
- Branch: `feature/phase-1-core-infrastructure`
- Code final SHA: `3dc815d`
- Base SHA: `cbd3f2044aa6a93377a78953cb33de04592560e7`
- Scope: full · Mode: auto · Heal cycles used: **2 of 3** — waves R1–R8 ran deliberately **outside** the heal budget by explicit human authorization (`decisions.md` #38, #48, #58)

## 1. Mission summary

Phase 1 gave PocketTools the infrastructure the tool catalog scales on: validated tool metadata
contracts, a **generated** registry and prerender route manifest, registry-backed routing, a Bun tool
scaffolder, a URL-state codec, the shared tool action/state component system, a local error
boundary, and a test harness where Bun and Playwright collect disjoint file sets.

It then failed review, was remediated through **eight** waves, failed its own gate **three** times, and
had **five** gate findings traced back to code the mission itself introduced. That history is the
record, not something to smooth over.

## 2. What shipped

| Area | Delivered |
|---|---|
| T1–T3, T5 | `ToolMetadata` validated at the boundary; generated registry + route manifest; runtime registry and search; URL-state codec (delivered and unit-tested, **not yet consumed** — see §8) |
| T4 | Bun tool scaffolder — five stub files per tool, `wx` flags, refuses any path escaping the output root, `Result` over exceptions |
| T6–T8 | Shared action/dual-pane/file-drop/state primitives; tool composition boundary with bounded retry; registry-backed `/tools` and `/tools/[slug]` with a real 404 |
| T9 | Runner-separated harness, enforced by a test: `bun test` takes `tests/unit/*.test.ts`, Playwright takes `tests/e2e/*.pw.ts` |
| T10 | ROADMAP evidence for Phase 1 |

## 3. Remediation waves R1–R8 (22 commits)

| Wave | Outcome |
|---|---|
| R1 anti-flake | `tests/e2e/helpers/{app,chunk}.ts`; the `route.fetch()` → `.text()` → `fulfill({response})` pattern deleted repo-wide |
| R1b standards | `AGENTS.md` `## Test standards` + 10 anti-flake rules; the four instruction files are mode `120000` **symlinks** and cannot drift |
| R2 safety + freshness | raw `args.name` removed from JSDoc and Vue template; `ci:local` gained `generate:registry -- --check` |
| R3 follow-ups | `retries: 0`; navigation timeouts; route abort on failed fetch; `__pwned` cleanup in a `finally` |
| R4 single-sourcing + M-5 | categories and the slug rule single-sourced (three copies each, found one at a time); per-tool component wired into the contract; ROADMAP evidence corrected; F-06 closed; a real coverage gate added |
| R5 gate correctness | gate enforces the configured new/modified split instead of a permissive aggregate; `fetch-depth: 0`; F-08 closed |
| R6 fail-closed | **F-09 closed** — the gate failed *open* on `NaN` |
| R7 PWA + licence + components | navigation cache keyed by path, not query string; the false MIT claim corrected in two files; compile-and-contract verification for the three shared components; F-03 and F-05 closed |
| R8 blind spot | the coverage gate now **fails** when a new instrumentable source file is invisible to the split |

## 4. Gate verdicts (final, measured at `3dc815d`)

`bun run ci:local` exit 0, all nine stages: format (84 files) · lint · typecheck · registry freshness
(`4 tool definitions, 0 errors`) · **coverage gate: new 89.80% lines / 93.10% functions (min 85/90),
modified 100.00% (min 90)** · audit 0 vulnerabilities · unit **223 pass / 0 fail / 747 expect / 17
files** · build 12 routes, 2.73 MB (642 kB gzip), PWA precache 32 entries / 448.02 KiB ·
**Playwright 26 passed / 0 failed / 0 retried**.

The gate owner verified independently, with its own parser, that the coverage figures are what the
gate reports, and that **the gate script appears in its own lcov** (97.22% functions, 91.44% lines) —
the check that would expose a gate which has stopped measuring itself.

**No gate was weakened.** Only `nuxt.config.ts` (+14, a cache rule) and `package.json` (a script)
changed as config across R7–R8. `playwright.config.ts`, `bun.lock`, `bunfig.toml`, `.oxlintrc.json`,
`.oxfmtrc.json`, `.editorconfig`, `tsconfig.json`, and `lefthook.yml` are byte-unchanged. No
dependency moved. The one floor that ever moved was **raised**, 0.84 → 0.85.

## 5. Three NO-GOs, and what each one caught

**NO-GO 1 — after R4.** The project's own written standard was red: new-code coverage **84.99%**
against a configured `coverage_new=85`, while the newly added gate reported green. The cause was one
file — `scripts/coverage-gate.ts` entered the new-code set at **53.49%**. The wave that added the
coverage gate is what pushed the metric under the floor, and its floor (`0.84`) sat below the
standard while the repo aggregate it enforced was the *more generous* number. Principle adopted
verbatim: *a gate green where the standard is red is precisely what gates exist to prevent.*

**NO-GO 2 — after R5.** Bookkeeping: the waiver's approved number no longer described the diff, and
four ledger rows were stale. The gate owner also refused to sign an evidence re-pin, in terms worth
repeating: *relabelling a `5d63a7c` measurement as a `2343df1` one is falsifying evidence.* It was
right, and re-measuring showed CSS had genuinely moved 5,680 → 5,993 B.

**NO-GO 3 — after R7/R8.** Bookkeeping again, and the sharpest finding of the three was aimed at the
captain's own artifacts: `report.md` and `pr-verdict.md` still claimed 25 Playwright / 208 unit /
+6,959 LOC when the truth was 26 / 215 / +7,220, and a `review.md` banner pointed at a section that
did not exist. A missing review is an honest gap; a banner claiming it is done is a gap wearing a
PASS. Both are fixed in this revision.

## 6. Review and security dispositions

| ID | Severity | Disposition |
|---|---|---|
| B-1 Playwright nondeterminism | blocker | **RESOLVED** at the root; waivers #31/#33 superseded by measurement |
| M-1 category triplication | major | **RESOLVED** — single-sourced |
| M-2 registry freshness | major | **RESOLVED** — proven to exit 1 on four drift classes |
| M-3 shared component coverage | major | **RESOLVED as an evidence correction**; the render-coverage residual stays **open and disclosed** |
| M-4 hostile `--name` injection | major | **RESOLVED** — the sink was removed, not escaped |
| M-5 unreachable `ToolComponent.vue` | major | **RESOLVED** — landed *with* the escaping strategy, so closing it cannot regress M-4 |
| F-01 generated-source injection | medium | **CLOSED** |
| F-02 URL-state decode cap | Low | **WITHDRAWN — the finding was wrong.** It cited `url-state.ts:122` as proof the guard was encode-only; line 122 **is** the decode guard, the file is byte-identical since its single commit, and the guard precedes both decode steps |
| F-03 PWA cache keying | Low | **CLOSED** in `25a107e`, verified in the shipped `.output/public/sw.js` |
| F-05 licence claim | Low | **CLOSED** in `ea23491` — twelve lockfile-pinned Prime packages, all MIT; the four Community-Licence packages are absent from the lock, undeclared, unimported, 0 in `.output` |
| F-06 download filename charset | Low | **CLOSED** — both prescribed halves |
| F-07 uncollected browser tests | Low | **CLOSED** |
| F-08 trailing dot in filename | Low | **CLOSED** in `1750c2e` |
| F-09 coverage gate fail-open | Low | **CLOSED** in `133a031` |
| F-04 dynamic `import()` of a registry component | Low | **OPEN, accepted** — same principal, no live caller |
| — | Low | 2 rows settled: one closed as documented (subprocess invocation), one closed **unrecoverable** rather than reconstructed |

**Security: 0 Critical / 0 High / 0 Medium, one open Low.** Review reliability **A−**.

## 7. Test evidence

- Unit **223 / 0** / 747 assertions / 17 files. Browser **26 / 0** at `retries: 0`, 4 workers.
- Browser determinism: **14 focused + 13 full green runs, 0 flakes, 0 retries**, across four
  independent agents. A green run means first-attempt success.
- axe: **0 violations at any severity** on `/`, `/tools`, `/tools/json-formatter` (39/39/35 rules).
- Performance: initial JS **111,213 B** / 122,880; initial CSS **5,993 B** / 30,720.
- Both evidence figures were **re-measured** at the final SHA, and are byte-identical to the previous
  measurement — R7/R8 touched docs, config, and the gate script, not the page bundle. Measured, not
  assumed.

## 8. Residual risks

1. **W3 waiver needs a final re-confirmation.** Last confirmed at `2343df1`'s numbers (+6,959 / 7,495
   / 66). The diff is now **+7,567 / 8,109 / 68**. The decisive basis is **intact** — `app/` is
   unchanged at 27 files / +1,551 net, and R7–R8 touched **zero** `app/` files. Only the gate owner
   and the human can move this.
2. **`app/utils/url-state.ts` is delivered, unit-tested, and unconsumed** — nothing imports it.
   Wiring it is product behaviour and was deliberately not done. The navigate-cache fix anticipates
   it rather than reacting to current traffic. Tracked as `u-1`, open.
3. **The three shared components have no render coverage.** They now have a compile-and-contract
   check, which adds no coverage number because Bun does not instrument `.vue`. A component that
   compiles and then behaves wrongly would still pass. Closing this needs a component-rendering test
   runner (a dev dependency) or a test-only route — both need an ADR.
4. **The per-tool component path is contract-proven, not Vite-proven.** No scaffolded tool exists to
   exercise the nested `~/tools/<slug>/ToolComponent.vue` shape. The four shipped tools still point at
   `ToolPlaceholder.vue`, so nothing user-facing depends on it and a mistake would be a loud
   build-time resolve error.
5. **`matchOptions: { ignoreSearch: true }` is redundant.** The `cacheKeyWillBeUsed` plugin alone fixes
   both the read and the write path; the harm is epistemic, not runtime — an inert line advertising
   itself as necessary already produced three false mechanism-claims. Tracked for removal.
6. **`README.md:33` enumerates 9 of the 12** MIT Prime packages. No conclusion in the document is
   wrong; a list presenting as exhaustive is not exhaustive.
7. **F-04** (dynamic `import()`) stays open and accepted. **The coverage gate has no rollback plan
   authored** — moot until the waiver is ruled on.

## 9. Rollback

Fully reversible. 30+ commits on an unmerged feature branch; no migration, schema, data, or
dependency change; nothing deployed. `git revert` back through the R8 → R1 → T-series commits
returns the branch to `cbd3f20`. Nothing was merged, so there is nothing to un-merge. One directional
change to note: removing the CI retry means a future genuine flake fails the build instead of being
retried — the intended trade.

## 10. Deferred

F-04, the `u-1` codec wiring, real render coverage for the three components, the redundant
`matchOptions` line, the 9-of-12 enumeration, the Vite-proving of the per-tool path, and a rollback
plan for the coverage gate. None blocks this ship except the waiver.

## 11. What the mission may and may not claim

**May claim:** Phase 1 core infrastructure delivered and evidence-backed; the coverage gate green on
the project's own configured metric and measuring itself; the browser suite deterministic **by
measurement rather than by retry**; security free of Critical, High, and Medium findings; all five
original review majors resolved.

**May not claim:** that the diff-size gate passed — it **failed on measurement** and was waived, and
the waiver needs a final re-confirmation; that all security findings are closed; that the shared
components have render coverage; any Lighthouse score; any Phase 2 capability.

## 12. Corrections on the record

**Five gate findings traced to code this mission introduced** — the coverage gate's permissive
aggregate (F-2), its `NaN` fail-open (F-09), the empty navigation-cache key the `ignoreSearch`
premise assumed, the licence claim copied into two files, and the blind spot that let an untested new
module stay invisible. **Four times an agent's evidence overruled a captain's premise**: a
trailing-newline claim false in JavaScript; an ASCII filename allowlist that would have broken
`café.txt` and `简历.pdf`; a "dead code" `??` that `noUncheckedIndexedAccess: true` made required,
proved by mutation; and the canonical Workbox recipe, which throws in Chromium for navigate-mode
requests. The captain also corrected a reviewer's severity downward — and the reviewer **disputed the
stated basis and was right** on the failure mode. Two security findings were retracted: one reviewer
finding was a false positive (`vue/compiler-sfc` is a declared subpath of a declared dependency), and
one security finding survived four waves because nobody re-read the file it concerned — it was
withdrawn.

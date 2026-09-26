# Phase 1 Axe Evidence

- Measured at: `3dc815d`
- Command: measured with `@axe-core/playwright` against the built app, mirroring `expectNoSeriousAxeViolations` in `tests/e2e/helpers/app.ts`
- Routes: `/`, `/tools`, `/tools/json-formatter`
- Result: **0 violations at any severity** on all three routes — 39 / 39 / 35 passing rules respectively
- Additional route checks: visible controls meet 44px; keyboard focus indicator is visible
- Enforced by: `tests/e2e/accessibility.pw.ts`

**Re-measured, not carried forward.** The figures are byte-identical to the `2343df1` measurement
(JS 111,213 B, CSS 5,993 B, 39/39/35 rules) because waves R7 and R8 touched documentation, the PWA
cache rule, and the coverage gate script — **zero `app/` files** — so the page bundle did not move.
That was verified by re-running the measurement, not inferred from the diff.

History: this file previously reported `0 critical, 0 serious` — the exact filter the test applies,
which understated real coverage — and carried a "human waiver" note about the intermittent
`Response has been disposed` race. That note was **deleted**; the race is root-cause fixed in
`7999bbd` and measured over 14 focused + 13 full green Playwright runs at `retries: 0`.

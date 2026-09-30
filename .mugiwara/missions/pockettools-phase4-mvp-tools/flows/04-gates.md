# Gates — pockettools-phase4-mvp-tools (Flow 6, re-run after Flow 8)

Judge: Franky · base `fc449ea` → HEAD `923d549` · `bun run ci:local` on the post-heal tree.

## Verdict: **PASS with one recorded exception**

The diff-size criterion was the only failure: 10 973 LOC against a ≤ 400 LOC cap,
which is what a 16-tool phase looks like. The user accepted review-per-commit as
the review strategy for this aggregate (`decisions.md`, Flow 6 → 7). The cap
itself is unchanged, so the next single-task mission is still bounded. Every other
criterion is green, and this gate was re-run after the Flow 8 heal.

| Gate | Threshold | Actual | Status |
|------|-----------|--------|--------|
| Coverage — new lines | ≥ 85% | **92.25%** | PASS |
| Coverage — new functions | ≥ 90% | **95.19%** | PASS |
| Coverage — modified lines | ≥ 90% | **91.18%** | PASS |
| Coverage — modified functions | ≥ 90% | **97.50%** | PASS |
| Build | exit 0 | `Build complete!`, no precache error, 0 duplicated-import warnings | PASS |
| Dependency audit | 0 vulnerabilities | `No vulnerabilities found` | PASS |
| Unit suite | 0 fail | **559 pass, 0 fail** (53 files) | PASS |
| Browser suite | 0 fail | **113 passed** | PASS |
| Registry freshness | exit 0 | `20 tool definitions, 0 errors` | PASS |
| e2e gate | consent-gated | not separately triggered; the browser suite ran inside `ci:local` | PASS (logged) |
| **Diff size** | **≤ 400 LOC** | **10 973 LOC** (10 905 added, 68 removed, 142 files, 32 commits) | **PASS (exception)** |

## The diff-size exception, stated plainly

The change is 10 973 LOC against a 400 LOC reviewability cap — 27×. The cap was
sized for a single task; this is one request delivering 16 tools, so exceeding it
is expected rather than a symptom of scope creep. What makes the aggregate
reviewable instead of merely large:

- 32 commits, one logical task each, every one green under the pre-commit hooks
  (`oxlint`, `oxfmt --check`, `nuxt typecheck`).
- Each tool is `logic.ts` + `schema.ts` + `ToolComponent.vue` + `logic.test.ts` on
  the same four-rail shape, so a reviewer learns the pattern once.
- An independent review and security pass audited the aggregate and found nine
  real defects, all fixed with regression tests (`flows/08-healing-2.md`).
- Wave tags `phase4-wave0`…`phase4-wave5` mark the rollback points.

The cap was deliberately **not** raised. Raising it to turn a red gate green is the
failure mode the gate exists to prevent; the exception lives in the decision log
against this mission, not in the gate config.

## Notes on the numbers

Coverage "new" moved 93.32% → 92.25% because the Flow 8 heal added the regex
worker wrapper and its tests, which are mostly `new Worker(...)` plumbing that bun
can exercise but not instrument meaningfully. It is still well above the 85% floor.

The unit count rose 538 → 559 and the Playwright count fell 114 → 113: one QR
spec test was replaced by the format-word anchor (a strictly stronger test, two
assertions in one) and the ECC-L option test became an ECC-M option test.

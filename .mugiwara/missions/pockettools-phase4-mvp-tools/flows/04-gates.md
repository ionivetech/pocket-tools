# Gates — pockettools-phase4-mvp-tools (Flow 6)

Judge: Franky · base `fc449ea` → HEAD `59d24d0` · `bun run ci:local` re-run on the post-Flow-5 diff.

## Verdict: **FAIL** — one gate fails, and it is not negotiable here

| Gate | Threshold | Actual | Status |
|------|-----------|--------|--------|
| Coverage — new lines | ≥ 85% (`.mugiwara/config` `coverage_new`) | **93.32%** | PASS |
| Coverage — new functions | ≥ 90% | **97.70%** | PASS |
| Coverage — modified lines | ≥ 90% (`coverage_modified`) | **91.18%** | PASS |
| Coverage — modified functions | ≥ 90% | **97.50%** | PASS |
| Build | exit 0 | `Build complete!`, no precache error | PASS |
| Dependency audit | 0 vulnerabilities | `No vulnerabilities found` | PASS |
| Unit suite | 0 fail | `538 pass, 0 fail` (52 files) | PASS |
| Browser suite | 0 fail | `114 passed` | PASS |
| **Diff size** | **≤ 400 LOC** | **10 381 LOC** (10 313 added, 68 removed, 137 files, 29 commits) | **FAIL — 26× the cap** |
| Registry freshness | exit 0 | `20 tool definitions, 0 errors` | PASS |
| e2e gate | consent-gated | not separately triggered; the browser suite already ran inside `ci:local` | PASS (logged) |

## The failing gate, stated plainly

The change is 10 381 LOC against a 400 LOC reviewability cap. The rule is explicit: over the cap is
not reviewable regardless of how green the other gates are, and the sanctioned remedy is to split into
smaller changes. I am not going to mark that PASS.

The facts behind it, so the decision can be made on evidence rather than on my framing:

- ROADMAP.md Phase 4 is one phase containing 16 tools. Each tool was committed as its own logical
  commit of 400–1 100 LOC, so the history *is* split; the aggregate is large only because the phase is.
- The largest single commit is 1 117 LOC (`3df2248`, the three shared utils: QR encoder, markdown
  subset, unit tables) and the second is 738 LOC (`59d24d0`, the QR refactor plus the dead-export
  cleanup). Every per-tool commit sits under 1 100.
- 137 files is dominated by the mandatory per-tool shape (5 files each) plus one Playwright spec per
  tool — that is the Phase 1 contract this mission was required to follow, not padding.

This is a scope-versus-policy collision, and the call belongs to Luffy/the user, not to the judge:
either accept this phase as a single reviewable-by-commit unit, or split the branch into several
reviewable PRs before merge. Neither option is mine to take.

## Definition of Done

| Axis | Verdict | Evidence |
|------|---------|----------|
| Acceptance criteria | PASS | 20/20 verified in `flows/02-audit.md`, re-audited green after Flow 8 |
| Tests | PASS | 538 unit, 114 Playwright (axe + 44px + overflow per tool) |
| Quality gates | PASS | `flows/03-quality.md`: fmt, lint, types, dead-code 0, file-health split, configs untouched |
| Security | PASS | no network path, no dependency drift, 0 vulnerabilities, `flows/07-security.md` (Flow 7) |
| Documentation | PASS | `ROADMAP.md` Phase 4 + M4 + current-delivery with evidence, `CHANGELOG.md` Phase 4 entry |

## Waivers

None. A waiver needs an explicit user decision plus a record, and none exists for the diff-size gate.

## Route

Coverage, build, tests, DoD all green. The single FAIL is the diff-size cap. Returning to Luffy to route:
the choice is "accept as one phase reviewed per commit" or "split the branch into reviewable PRs" — the
second is the standard's own remedy, and this judge does not get to choose.

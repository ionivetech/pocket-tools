# Closure report — pockettools-phase4-mvp-tools

Captain: Luffy · base `fc449ea` → HEAD `923d549` · branch `feature/phase-4-mvp-tools`
· lane `full` · mode `auto` · heal cycles used: 2 of 3.

## Mission summary

Phase 4 of PocketTools: an MVP toolkit of 16 tools plus one shell fix. Requested
by the user in one message, with three standing constraints — apply the
`design-taste-frontend` taste skill, make the UI/UX uniform across every tool,
and fix dialog initial focus — plus "keep going until finished" and "update
ROADMAP before you push". No new runtime dependency was permitted without an ADR,
though the user allowed native-first or a package where it was justified.

The catalog now holds 20 tools (14 new, 2 placeholders finished).

## Per-flow-stage outcomes

| Flow | Owner | Outcome | Evidence |
|---|---|---|---|
| 0 triage | Luffy | Full lane, solo, `auto` | `decisions.md` — 5-way classification, lane rationale, tool-surface inventory |
| 1 spec | Usopp | Spec written | `spec.md` |
| 2 plan | Nami | GO, 20 tasks, no unanswerable question | `plan.md` |
| 3 execute | Zoro | All 20 tasks, 29 commits, 20 responsive screenshots | `flows/01-execution.md` |
| 4 audit | Chopper | **FAIL** on QR — RS divisor order | `flows/02-audit.md` |
| 5 quality | Sanji | QR RS fixed, 313→247 LOC refactor, dead exports removed | `flows/03-quality.md` |
| 6 gates | Franky | FAIL, diff-size only | `flows/04-gates.md` |
| 7 review + security | Robin + Jinbe | **FAIL** — 2 blockers + 9 security findings | `flows/08-healing-2.md` |
| 8 heal | Brook | All 9 fixed, cycle 2 of 3 | `8fccd9b`, `923d549` |
| 6 re-gate | Franky | PASS with recorded diff exception | `flows/04-gates.md` |

## Gate verdicts

- `bun run ci:local` — **exit 0**: 559 unit, 113 Playwright, coverage 92.25% new
  / 91.18% modified, build clean, `bun audit` clean, 20 tool definitions.
- **Diff-size cap** — the one exception. 10 973 LOC vs ≤ 400. Accepted by the
  user as review-per-commit; the cap itself is unchanged.

## Review and security dispositions

Robin reported 2 blockers and Jinbe 2 blocking availability defects plus 7
findings. Both independently named the markdown freeze as the worst defect.

Fixed: markdown infinite loop, regex ReDoS, QR level L removed, JWT token no
longer persisted to URL or localStorage, UTF-8 Basic auth, 40 MP image ceiling,
dead PWA glob, NUL placeholder collision, out-of-range date RangeError.

Jinbe's "no user data leaves the browser" claim held and still holds.

Two of my own earlier claims were **retracted** after verification, both recorded
in `decisions.md` Flow 7 → 8 and `flows/08-healing-2.md`:

1. The format-information bit order was not reversed — my reader was mirrored, and
   the wrong fix survived a review because reader and writer shared an assumption.
   A self-confirming test. Now pinned to a literal format word.
2. The PWA glob reasoning was wrong in both halves: built CSS is
   `ToolComponent.HASH.css` (dot) and no tool JS chunk carries a component name, so
   it is not excludable by glob. The dead pattern was deleted, not "fixed".

One Robin finding is a **false positive**: "image controls are inert". `plan` is a
`computed` over `targetWidth`, so the estimate updates live. Not "fixed" because
there is nothing to fix.

## Tests

559 unit (53 files) and 113 Playwright specs, all green. New this cycle: 10
markdown termination inputs, the format-word anchor plus a mirrored-arrangement
rejection, curl UTF-8, image pixel budget, datetime range, JWT non-persistence
(e2e), ReDoS abandonment (e2e), regex worker reuse and request-id routing.

Stability evidence is the pre-existing one for the untouched surface: the
focus suite ran 5× green and the full browser suite 3× green during Flow 3, and
this cycle's `ci:local` runs were green on every attempt.

Out of tree, not a repo dependency: jsQR read **7/7** generated M matrices,
including a unicode string and a realistic order line.

## Risks and rollback

| Risk | Severity | Mitigation |
|---|---|---|
| QR output unreadable by a third-party scanner | was critical, now verified | M proved by jsQR; L removed rather than shipped unproven |
| ReDoS still reachable with a slow-but-not-catastrophic pattern | low | any slow pattern is abandonable after 2s by design |
| `pockettools-assets` runtime cache cap (60 entries) vs 20 tool chunks | low | cache-first refills on demand; no offline regression observed in the PWA suite |
| Aggregate diff reviewability | accepted | 32 atomic commits, wave tags `phase4-wave0`…`wave5` |
| Roadmap marked Phase 4 done before the review findings | resolved | ROADMAP and CHANGELOG rewritten with the healed state before push |

Rollback: `git reset --hard phase4-wave0` returns to the shell-only state;
`phase4-wave3` returns to the tools without the dialog-focus fix. There is no
migration, no deploy step, and no external state.

## Deferred, on purpose

- **QR level L** — needs a fixed data layout plus third-party decoder proof.
- **QR level Q/H** — out of scope since the start.
- **Markdown beyond the labeled subset** — no CommonMark claim is made in the UI.
- **JWT signature verification** — decode-only, and the UI says so.
- **EXIF preservation on image re-encode** — stated in the tool.
- **Real worker unit coverage** — `app/workers/regex-tester.worker.ts` is
  allowlisted in the coverage gate because only the `Worker` constructor loads it;
  the wrapper around it is unit-tested against a real bun `Worker`, and the browser
  path is covered end to end.

## Next steps

1. Open the PR from `feature/phase-4-mvp-tools` (the crew does not create PRs).
2. Review the 32 commits, not the 10 973-line diff.
3. Phase 5 stays untouched and unstarted.

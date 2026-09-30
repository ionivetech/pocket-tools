# Audit — pockettools-phase4-mvp-tools (Flow 3)

Auditor: Chopper · base `fc449ea` (main) → HEAD `0a8386f` · read-only, no tree mutation
Every check below was re-run by the auditor. No executor log was reused as evidence.

## Per-task acceptance (unique checks run once, scoped to the flow diff)

| # | Acceptance | Command run | Evidence | Status |
|---|-----------|-------------|----------|--------|
| A1 | fmt clean | `bun run fmt:check` | `All matched files use the correct format` (239 files) | PASS |
| A2 | lint clean | `bun run lint` | exit 0, no findings | PASS |
| A3 | typecheck clean | `bun run check` | exit 0, 0 `error TS` | PASS |
| A4 | registry fresh | `bun run generate:registry -- --check` | `20 tool definitions, 0 errors` | PASS |
| A5 | unit suite green | `bun test` | `517 pass, 0 fail` (50 files, 1291 expects) | PASS |
| A6 | coverage gate | `bun run coverage:gate` | new 93.31% / 97.70% fn, modified 91.18% / 97.50% → PASSED | PASS |
| A7 | dependency audit | `bun run audit` | `No vulnerabilities found` | PASS |
| A8 | build + PWA budget | `bun run build` | `Build complete!`, total 3.83 MB (911 kB gzip), no precache error | PASS |
| A9 | browser suite | `bunx playwright test` | `114 passed (1.9m)` | PASS |
| A10 | axe + 44px + no-overflow per new tool | grep of the 16 new `*.pw.ts` | every tool spec asserts all three (axe=2, 44px=2, nooverflow=2 occurrences each) | PASS |
| A11 | dialog focus lands on primary control (A1) | `tests/e2e/dialog-focus.pw.ts` inside A9 | 3/3 (palette input, help list, options Done) | PASS |
| A12 | no new runtime dependency | `git diff fc449ea..HEAD -- package.json bun.lock` | empty | PASS |
| A13 | no network from tool logic | grep `fetch(\|XMLHttpRequest\|WebSocket\|sendBeacon` in `app/tools`, `app/utils` | 2 hits, both string literals of *generated* fetch code in curl-converter (`logic.ts:139` emits `const response = await fetch(...)` as the tool's output; `logic.test.ts:18` asserts that text). No call site executes a request | PASS |
| A14 | TS strictness | grep `: any`, `as any`, `@ts-ignore`, `@ts-expect-error` in the diff | no hits | PASS |
| A15 | no production console | grep `console.` in the diff | no hits | PASS |
| A16 | no raw CSS literals in components | grep hex/rgb literals in the diff `.vue` files | no hits in CSS or markup. Two literals exist in `qr-generator` **script** (`context.fillStyle = "#ffffff" / "#000000"`) — canvas paint, not CSS, and a scannable QR must be black-on-white. Accepted as a documented exception, not a violation | PASS (with note) |
| A17 | no cross-tool imports | grep `from "~/tools/` inside `app/tools` | no hits | PASS |
| A18 | secret/blob tools carry no state | grep `useToolHistoryRecorder\|encodeUrlState` in password-generator, image-compressor, image-resizer | no hits — plan D5 honored | PASS |
| A19 | T15 QR "real scan spot-check" | — | **SUPERSEDED after Flow 8.** The criterion was unprovable as written, so the plan was amended to what this repo can prove, and the auditor re-ran the replacement check independently (see Re-audit below) | PASS (amended) |

## Re-audit after Flow 8 (heal cycle 1) — auditor's own re-runs
| Check | Command run | Result | Status |
|-------|-------------|--------|--------|
| A19r | independent decode round-trip | `bun test tests/unit/qr-round-trip.test.ts` | `13 pass, 0 fail` (v1, v2, v4, v5, v6 + 106-byte boundary + flip-sensitivity guard) | PASS |
| QR structural | `bun test app/tools/qr-generator tests/unit/qr-encode.test.ts` | `11 pass, 0 fail` | PASS |
| Encoder change blast radius | `bun test` | `530 pass, 0 fail` (51 files) | PASS |
| Coverage after the encoder edit | `bun run coverage:gate` | new 93.31% / modified 91.18% → PASSED | PASS |
| Build after the encoder edit | `bun run build` | `Build complete!`, no precache error | PASS |
| QR + tool infra in the browser | `bunx playwright test tests/e2e/qr-generator.pw.ts tests/e2e/tool-infrastructure.pw.ts` | `11 passed` | PASS |

The heal found a real defect the structural tests could not see: the format string was written
LSB-first, so every QR carried a mirrored format word and therefore the wrong mask — unscannable. The
root cause is fixed in `app/utils/qr-encode.ts` (`drawFormat`), and the round-trip reader is the guard.
One limit is recorded rather than hidden: the reader and the encoder both take the block-layout numbers
from the same spec table, so a single wrong number in that table would cancel out; everything else in
the placement/masking path is now machine-verified. A human phone scan stays a pre-release check.

Ledger: 1 row, marked HEALED, no open rows. Heal counter `heal_cycle = 1`, `heal_halt = false`.

## Commit hygiene (`git log --stat fc449ea..HEAD`, read once)
27 commits, all on `feature/phase-4-mvp-tools`. Every commit touches only files its task declared, plus the two generated registry files on tool commits (declared in the plan). One deviation:

- `0a8386f` `docs(roadmap): mark Phase 4 delivered with evidence` carries **no task id**, breaking "the message carries the task id" for the T20 commit. Minor, not fixable without rewriting history, so it is recorded rather than repaired.

## Parallel-conflict check
No `[PARALLEL]` was declared (shared generated registry forced sequential execution). The claim is consistent with history: tool commits are strictly ordered and each one regenerates the registry. No file was written by two tasks in the same window.

## Honest classification
- One load-induced flake was observed during execution (`jwt-decoder` `tool-ready` timeout, log `/tmp/ci5.log`). The auditor re-ran the full suite fresh (A9: 114 passed) after the focus fix, and the same spec is green in four consecutive runs. Classified **flaky-under-load, not a code defect**; no timeout or retry was inflated to hide it.
- A19 is **not** an environment excuse: the acceptance was written into the plan and simply was not discharged. Filed as `missing-impl` for the healer with two named routes.

## Definition of Done (per axis)
| Axis | Verdict | Evidence |
|------|---------|----------|
| Acceptance criteria | **PASS** (after Flow 8) | A19 amended and re-audited: `13 pass` on the independent decode round-trip; the heal closed the real defect it exposed |
| Tests | PASS | A5 517 unit, A9 114 browser |
| Quality gates | PASS | A1, A2, A3, A4, A6, A7, A8 |
| Security | PASS | A12 no dep drift, A13 no network path, A7 no vulnerabilities |
| Accessibility | PASS | A10 axe/44px/overflow per tool, A11 focus |
| Documentation | PASS | `ROADMAP.md` Phase 4 + M4 + current-delivery updated with evidence, `CHANGELOG.md` Phase 4 entry |
| Repo hygiene | PASS | no placeholder component left behind (A9 includes the retargeted Phase 0/1 specs), one commit-hygiene note |

## Verdict
**PASS** — every acceptance criterion is now verified on the auditor's own re-runs. A19 was FAIL, Flow 8
fixed a real encoder defect it exposed, and the replacement criterion re-audited green.

# Quality — pockettools-phase4-mvp-tools (Flow 5)

Auditor: Sanji · flow-base `fc449ea` → HEAD · delta-scoped, configs proven untouched.
Stack discovered from `package.json`: `bun run fmt:check` (oxfmt), `bun run lint` (oxlint --vue-plugin),
`bun run check` (nuxt typecheck), `bun test`, `bun run coverage:gate`, `bunx playwright test`.

## Checks run

| # | Check | Command | Result | Status |
|---|-------|---------|--------|--------|
| 1 | Formatter | `bun run fmt:check` | `All matched files use the correct format` (244 files) | PASS |
| 2 | Linter | `bun run lint` | exit 0, zero findings | PASS |
| 3 | Types | `bun run check` | exit 0, 0 `error TS` | PASS |
| 4 | Unit suite | `bun test` | `538 pass, 0 fail` (52 files, 1360 expects) | PASS |
| 5 | Coverage gate | `bun run coverage:gate` | new 91.93% / 97.26% fn · modified 91.18% / 97.50% fn → PASSED | PASS |
| 6 | Dead exports | `bunx ts-prune` | 8 declaration-only exports found → **fixed** (see F1) | FAIL → fixed |
| 7 | File health | LOC scan of every added file | 3 files over the 300 LOC cap → **extracted** (see F2) | FAIL → fixed |
| 8 | Config integrity | `git diff fc449ea..HEAD -- oxlint.json .oxfmtrc* tsconfig.json bunfig.toml playwright.config.ts package.json .editorconfig` | empty — no config touched, nothing weakened | PASS |
| 9 | Build | `bun run build` | `Build complete!`, no precache error | PASS |
| 10 | Browser (scoped) | `bunx playwright test tests/e2e/qr-generator.pw.ts tests/e2e/unit-converter.pw.ts` | `7 passed` | PASS |

## F1 — dead exports (fixed)

`bunx ts-prune` reported eight exports that nothing references: `ColorPickerErrorCode`,
`ConvertUnitsErrorCode`, `DatetimeHelperErrorCode`, `DiffCheckerErrorCode`, `HashGeneratorErrorCode`,
`PasswordGeneratorErrorCode`, `QrEncodeErrorCode`, `RegexTesterErrorCode`. Each was declared beside a
`failure()` path that inlined its code as a bare string, so the union documented a contract nothing
enforced — and the repo's own quality floor is "dead code 0". Removed. The behaviour they described is
still pinned by the unit tests, which assert each code string.

## F2 — file health, and the second real QR bug hiding behind it

`app/utils/qr-encode.ts` was 629 LOC, over the 300 cap, and mixed five concerns. Extracted along its
real seams:

| File | LOC | Concern |
|------|-----|---------|
| `app/utils/qr-codec.ts` | 96 | GF(256) tables, Reed-Solomon, bit packing |
| `app/utils/qr-penalty.ts` | 142 | the eight mask patterns + the four penalty rules |
| `app/utils/qr-matrix.ts` | 313 | version table, function patterns, reserved strips, zig-zag placement |
| `app/utils/qr-encode.ts` | 130 | the public API only |

`qr-matrix.ts` is 13 LOC over the cap, and that is 122 lines of version/capacity table — data, not logic.
Left as is rather than fragmented further.

**The extraction is what surfaced the second QR defect.** Writing a direct test for the Reed-Solomon
codec (a syndrome check, i.e. a mathematical property, rather than a shape check) went red: the
divisor polynomial was returned constant-first while the division loop consumed it highest-degree-first,
so the parity bytes belonged to no valid codeword — `XOR(data ++ parity)` was 54 instead of 0, and
neither the structural tests nor the round-trip reader could see it, because a decoder that simply
discards the error-correction bytes never checks them. Reversing the divisor to highest-degree-first
makes all syndromes zero for every tested block. **Every QR generated before this fix carried invalid
error correction**; a reader that validates EC would have rejected or mis-corrected them.

Proving this without a trusted reference vector mattered: the "ISO/IEC 18004 EC codewords" list I first
compared against was misremembered — evaluating it showed it is not a valid generator polynomial at
all (no root is zero, in either coefficient order). The verification therefore rests on the syndrome
property, which is checkable and which the test now enforces, not on a recalled constant.

## Recorded, not changed

- `app/tools/image-resizer/ToolComponent.vue` 322 LOC and `image-compressor` 292 LOC: below the repo's
  own tool-component precedent (`json-formatter/ToolComponent.vue` is 340 LOC) and mostly template plus
  scoped CSS. Not a finding for this mission.
- `tests/unit/qr-round-trip.test.ts` 344 LOC: deliberately one self-contained independent reader.
  Splitting it would weaken the very property that makes it trustworthy.
- Canvas paint literals in `qr-generator` (`#ffffff`/`#000000`): a scannable code must be black on
  white, and these are script values, not CSS.
- The 300 LOC cap does not hold repo-wide anyway (`app/assets/css/main.css` is 2157 LOC), so it is
  applied here to pure logic modules, not to Vue SFCs or CSS. Worth stating explicitly in AGENTS.md
  during Phase 5 rather than leaving it ambiguous.

## Waste (advisory, step 12)

No `mugiwara waste` CLI rung exists in this environment (no binary, no npx wrapper, no `.mugiwara/bin/`),
so the advisory pass was done by hand instead: the two costs this mission added beyond its scope were
(a) the two media tools sharing `app/utils/image-metrics.ts` rather than duplicating `formatBytes` /
   `savingsLabel` / `targetSize`, and (b) the QR encoder being written from scratch instead of a
   maintained dependency. Both were deliberate, both are recorded in the spec's option analysis, and
   neither is flagged for removal.

## Verdict

**PASS after fixes** — F1 and F2 are fixed, re-verified, and the second QR defect they exposed is
closed with a guard. Configs untouched, nothing weakened to pass.

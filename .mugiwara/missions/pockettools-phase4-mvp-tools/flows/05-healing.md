# Healing — pockettools-phase4-mvp-tools (Flow 8)

Healer: Brook · cycle 1 of 3 · ledger: [blockers.md](../blockers.md) (1 row)

## Row: T15 QR generator — `missing-impl`, "real scan spot-check" never discharged

**Preserve.** The audit's re-run output is quoted verbatim in the ledger row; the failing state was
`format information failed its BCH check (raw 19247)` from the new reader, captured before any fix.

**Reproduce.** The gap was not a failing check — it was an *unprovable* acceptance. Route (a) from the
ledger was chosen: build the proof. `tests/unit/qr-round-trip.test.ts` contains a QR **reader** written
from ISO/IEC 18004, deliberately not sharing the encoder's tables:

- block layout (`blocks`, `dataPerBlock`, `ecPerBlock`, `remainder`) hard-coded per version, M, v1-6;
- the function-module map rebuilt from spec geometry (finders + separators, timing, alignment with the
  three finder-overlapping patterns omitted, both format strips);
- format info read MSB-first, XOR-masked, and BCH-verified by rebuilding the whole 15-bit word;
- zig-zag data walk, mask removal, byte-ification, block de-interleave, byte-mode parse.

**Localize / root cause.** The reader went red immediately and named the defect: the encoder wrote the
format string **LSB-first** (`bit(index)`), while ISO/IEC 18004 places the 15 format bits MSB-first
(`bit(14 - index)`). Both copies and the dark module were affected. Consequence: every QR shipped a
mirrored format word, so a scanner read the wrong ECC level and the wrong mask — the data region was
masked with the wrong pattern and the code was **unscannable**. The structural tests could never catch
this, because the matrix is perfectly well-formed; only reading the bits back can.

**Fix (root cause, one line per placement, no drive-by).** `app/utils/qr-encode.ts` `drawFormat()` now
writes `bit(14 - index)` at every position and sets the dark module at `(8, size - 8)`, with a comment
recording why.

**Red → green proof.**
- Red before the fix: `format information failed its BCH check (raw 19247)` on 8 of 13 cases.
- Green after: `bun test tests/unit/qr-round-trip.test.ts` → `13 pass`, covering v1, v2, v4, v5, v6
  payloads plus the 106-byte capacity boundary at M.
- Sensitivity guard (so the test cannot become self-fulfilling): flipping one data module must change
  what the reader sees, and it does — `the reader really reads the matrix, not the input`.
- Regression surface: `bun test` → `530 pass, 0 fail` (51 files, up from 517/50 — the 13 new tests);
  coverage gate still PASSED (new 93.31%, modified 91.18%); `bun run build` green; QR browser spec 4/4.

**Plan amendment (route b, applied as well).** The promise itself was wrong for this repo, so
`plan.md` T15 now states the provable criterion (independent decode round-trip + finder/timing
invariants) and records a human phone scan as a recommended pre-release check, not a done item.

## Escalated
None. Heal cycle 1 of 3; no `heal_halt`.

## Honest limits
The reader shares one unavoidable input with the encoder: the block-layout numbers. Both are written
from the spec rather than imported, so a mistake made once in the spec table would cancel out. What the
round trip does rule out is the whole class of implementation bugs it targets — mask selection and
placement, zig-zag order, mask application/removal, interleave order, terminator and pad bytes,
format-info placement and BCH, and capacity-driven version choice. A physical phone scan is still the
last mile and is recorded as such.

# pockettools-phase4-mvp-tools

## Key decisions
- D1 Single plan, no sub-plan split (solo, one branch, shared generated registry forces sequential work; Phase 3 precedent). Contingency: if Wave 1 slips past its gate twice, defer 4.4 media (T15-T17) to a follow-up mission via Luffy decision.
- D2 Native-first per spec; new dependency only via ADR + measured need (A2). Pre-approved ADR fallbacks (markdown `marked`+sanitizer, maintained QR dep) may be taken without re-ask when native fails acceptance.
- D3 QR = vendored pure encoder `app/utils/qr-encode.ts`; markdown = hand-rolled safe subset `app/utils/markdown-subset.ts`; units = `app/utils/unit-tables.ts`. One shared file each, never per-tool forks.
- D4 `color-picker` stays in category `Media` (existing metadata, avoids churn); ROADMAP lists it under Everyday but the registry is the contract.
- D5 `password-generator` and both image tools wire NO history recorder (secret hygiene; blob URLs are useless history) and NO URL-state watcher. All other tools reuse the json-formatter watcher idiom; the codec's 4096-byte cap is the overflow behavior (param dropped, never truncated).
- D6 T0 dialog-focus fix ships first (A1): focus `[data-autofocus-target]` on open; visible focus stays (WCAG) but on the right element.
- D7 Uniformity (A3) is a gate criterion: per-tool UI checklist in every tool task + T19 side-by-side pass at 375px + dark mode, audited by Chopper.
- Answers to spec open questions: slugs/metadata in Task index below; URL-state per tool in D5 + task steps; shared util paths in D3/T1; e2e = one `tests/e2e/<slug>.pw.ts` per tool reusing `helpers/app.ts` (+ `dialog-focus.pw.ts` for T0); wave order + commits in Waves (one task = one commit on `feature/phase-4-mvp-tools`).

## Architecture overview
Proven Phase 2 rails, unchanged: scaffold → `app/tools/<slug>/{metadata,schema,logic,ToolComponent}.vue + logic.test.ts` → `bun run generate:registry` → lazy route `/tools/<slug>` via `ToolHost` → `ToolDualPane` (toolbar/input/output/footer) + `ToolActions` + global `ToolHistory` (already rendered by `app/pages/tools/[slug].vue`) + optional URL-state watcher + `useToolHistoryRecorder`. Pure logic stays framework-independent and unit-tested; components are thin PrimeVue layers using project tokens only. No cross-tool imports: tools import only `~/utils/*`, `~/composables/*`, `~/components/*`, `~/data/*`.

## Non-goals
Phase 5+ (workspace tabs, settings, PWA polish beyond precache of new chunks), Phase 6-8 (deploy, SEO beyond per-tool title/description, v1.1/v2 tools), full CommonMark, JWT verify, bcrypt/argon2, multi-flavor regex, 3-way diff, cron seconds/years/TZ-DB, full curl flag matrix, xlsx import, live currency rates, batch/EXIF image pipelines, workers/Comlink, Dexie, i18n, sync, landing rework.

## Project structure
New files (verified parent dirs exist):
- `app/composables/use-dialog-focus.ts` (T0; DOM-only, coverage-allowlisted with reason)
- `app/utils/qr-encode.ts`, `app/utils/markdown-subset.ts`, `app/utils/unit-tables.ts` (T1)
- `app/tools/{jwt-decoder,hash-generator,regex-tester,diff-checker,cron-helper,curl-converter,markdown-preview,table-to-markdown,case-converter,unit-converter,datetime-helper,qr-generator,image-compressor,image-resizer}/*` (14 × scaffolded 5-file sets)
- `app/tools/{password-generator,color-picker}/{schema,logic,ToolComponent}.vue,ts + logic.test.ts` (finish placeholders; metadata kept, only `componentPath` flips to own component)
- `tests/unit/{qr-encode,markdown-subset,unit-tables}.test.ts` (T1)
- `tests/e2e/{dialog-focus,<14 slugs>,password-generator,color-picker}.pw.ts`
- Modified: `app/components/{PaletteDialog,ShortcutHelp,ToolDualPane}.vue`, `scripts/coverage-gate.ts` (T0 allowlist), `app/data/tool-registry.generated.ts` + `tool-routes.generated.ts` (regen only, never hand-edited), `ROADMAP.md`, `CHANGELOG.md` (T20).

## Waves
| Wave | Focus | Tasks | Gate |
|------|-------|-------|------|
| 0 | Branch + dialog focus (A1) + shared seams | T0-T1 | `bun test tests/unit/use-dialog-focus 2>/dev/null; bun test tests/unit/qr-encode.test.ts tests/unit/markdown-subset.test.ts tests/unit/unit-tables.test.ts` → 3 files pass; `playwright test tests/e2e/dialog-focus.pw.ts` → green; tag `phase4-wave0` |
| 1 | 4.1 Data/dev tools | T2-T7 | `bun test app/tools/{jwt-decoder,hash-generator,regex-tester,diff-checker,cron-helper,curl-converter}` → 0 fail; 6 e2e files green; tag `phase4-wave1` |
| 2 | 4.2 Text tools | T8-T10 | `bun test app/tools/{markdown-preview,table-to-markdown,case-converter}` → 0 fail; 3 e2e files green; tag `phase4-wave2` |
| 3 | 4.3 Everyday tools | T11-T14 | `bun test app/tools/{password-generator,unit-converter,color-picker,datetime-helper}` → 0 fail; 4 e2e files green; palette/paste regression green; tag `phase4-wave3` |
| 4 | 4.4 Media tools | T15-T17 | `bun test app/tools/{qr-generator,image-compressor,image-resizer}` → 0 fail; 3 e2e files green; tag `phase4-wave4` |
| 5 | Stability + uniformity (A3) + roadmap + closure evidence | T18-T20 | `bun run ci:local` → exit 0; full Playwright green; `git diff --stat` shows ROADMAP.md + CHANGELOG.md; tag `phase4-wave5` |

## CODEOWNERS
| Area | Owner task(s) |
|------|---------------|
| `app/components/PaletteDialog.vue`, `app/components/ShortcutHelp.vue`, `app/components/ToolDualPane.vue`, `app/composables/use-dialog-focus.ts`, `tests/e2e/dialog-focus.pw.ts`, `scripts/coverage-gate.ts` | T0 |
| `app/utils/qr-encode.ts`, `app/utils/markdown-subset.ts`, `app/utils/unit-tables.ts`, `tests/unit/qr-encode.test.ts`, `tests/unit/markdown-subset.test.ts`, `tests/unit/unit-tables.test.ts` | T1 |
| `app/tools/jwt-decoder/*`, `tests/e2e/jwt-decoder.pw.ts` | T2 |
| `app/tools/hash-generator/*`, `tests/e2e/hash-generator.pw.ts` | T3 |
| `app/tools/regex-tester/*`, `tests/e2e/regex-tester.pw.ts` | T4 |
| `app/tools/diff-checker/*`, `tests/e2e/diff-checker.pw.ts` | T5 |
| `app/tools/cron-helper/*`, `tests/e2e/cron-helper.pw.ts` | T6 |
| `app/tools/curl-converter/*`, `tests/e2e/curl-converter.pw.ts` | T7 |
| `app/tools/markdown-preview/*`, `tests/e2e/markdown-preview.pw.ts` | T8 |
| `app/tools/table-to-markdown/*`, `tests/e2e/table-to-markdown.pw.ts` | T9 |
| `app/tools/case-converter/*`, `tests/e2e/case-converter.pw.ts` | T10 |
| `app/tools/password-generator/*`, `tests/e2e/password-generator.pw.ts` | T11 |
| `app/tools/unit-converter/*`, `tests/e2e/unit-converter.pw.ts` | T12 |
| `app/tools/color-picker/*`, `tests/e2e/color-picker.pw.ts` | T13 |
| `app/tools/datetime-helper/*`, `tests/e2e/datetime-helper.pw.ts` | T14 |
| `app/tools/qr-generator/*`, `tests/e2e/qr-generator.pw.ts` | T15 |
| `app/tools/image-compressor/*`, `tests/e2e/image-compressor.pw.ts` | T16 |
| `app/tools/image-resizer/*`, `tests/e2e/image-resizer.pw.ts` | T17 |
| stability proof + screenshots `evidence/screenshots/*` | T18 |
| uniformity pass (no source change expected; fixes fold into owning tool task commits) | T19 |
| `ROADMAP.md`, `CHANGELOG.md` | T20 |

No `[PARALLEL]` anywhere: every tool task regenerates `app/data/tool-registry.generated.ts` (same file) and extends the shared tools catalog — sequential by file proof.

## Implementation graph
- L0 (no deps): T0 (branch + focus seam), T1 (shared pure utils).
- L1 (tools; each consumes scaffold shape + registry regen; stated waits): T2-T7 wait on L0 branch only; T8 waits on T1 (`renderMarkdownSubset` from `app/utils/markdown-subset.ts`); T9-T11 wait on L0 only; T12 waits on T1 (`convertUnits` from `app/utils/unit-tables.ts`); T13-T14 wait on L0 only; T15 waits on T1 (`encodeQr` from `app/utils/qr-encode.ts`); T16-T17 wait on L0 only.
- L2: T18 waits on all L1 (full suite + screenshots); T19 waits on all L1 (side-by-side); T20 waits on T18-T19 (evidence for roadmap entries).
- Critical path: T0 → T1 → T8/T12/T15 → T18 → T19 → T20.

## Task index
| # | Task | Files | Size | Depends-on | Unblocks | Acceptance |
|---|------|-------|------|------------|----------|------------|
| T0 | Branch + dialog initial focus (A1) | 3 vue + composable + gate + e2e | M | — | all (branch) | dialog-focus.pw.ts green, axe clean |
| T1 | Shared pure utils (QR/MD/units) | 3 utils + 3 unit tests | M | T0 | T8,T12,T15 | 3 unit files pass, coverage gate green |
| T2 | JWT decoder | jwt-decoder set + e2e | M | T0 | T18 | unit + e2e green, decode-only labeled |
| T3 | Hash generator | hash-generator set + e2e | M | T0 | T18 | SHA-256 vector matches, loading state |
| T4 | Regex tester | regex-tester set + e2e | M | T0 | T18 | JS-only, caps documented + tested |
| T5 | Diff checker | diff-checker set + e2e | M | T0 | T18 | line 2-way, ignore-ws toggle |
| T6 | Cron helper | cron-helper set + e2e | M | T0 | T18 | 5-field + next-3-runs + TZ label |
| T7 | cURL converter | curl-converter set + e2e | M | T0 | T18 | subset → fetch snippet, copy works |
| T8 | Markdown preview | markdown-preview set + e2e | M | T1 | T18 | subset list shown, HTML escaped |
| T9 | Table to Markdown | table-to-markdown set + e2e | M | T0 | T18 | CSV/TSV → table, copy works |
| T10 | Case converter | case-converter set + e2e | M | T0 | T18 | 6 cases incl. per-variant copy |
| T11 | Password generator (finish) | placeholder set + e2e | M | T0 | T18 | crypto RNG, no history/URL state |
| T12 | Unit converter | unit-converter set + e2e | M | T1 | T18 | tables explicit, no network |
| T13 | Color picker (finish) | placeholder set + e2e | M | T0 | T18 | hex/rgb/hsl + picker + contrast hint |
| T14 | Date/time helper | datetime-helper set + e2e | M | T0 | T18 | ts↔ISO↔relative + TZ label |
| T15 | QR generator | qr-generator set + e2e | M | T1 | T18 | real scan spot-check + PNG/SVG |
| T16 | Image compressor | image-compressor set + e2e | M | T0 | T18 | canvas quality slider, ≤10MB guard |
| T17 | Image resizer | image-resizer set + e2e | M | T0 | T18 | size + PNG/JPEG/WebP convert |
| T18 | Stability + screenshots | evidence only | S | all L1 | T20 | 5x focused + 3x full green |
| T19 | Uniformity pass (A3) | none (fixes → owner tasks) | S | all L1 | T20 | checklist signed, 375px + dark |
| T20 | ROADMAP + CHANGELOG | 2 docs | XS | T18,T19 | closure | diff present with evidence |

Scaffold invocations (run from repo root, one per new slug, before implementing its task):
`bun run scaffold:tool -- --slug <slug> --name "<name>" --description "<description>" --category <cat> --keywords "<k1,k2,k3>"`
Slugs/names/descriptions/categories/keywords/icons/accents:
- `jwt-decoder` / JWT decoder / Read what is inside a login token, safely in your browser. / Developer / jwt,token,decode / shield / blue
- `hash-generator` / Hash generator / Make a SHA fingerprint for any text. / Developer / hash,sha,checksum / code / blue-strong
- `regex-tester` / Regex tester / Try a search pattern and see every match live. / Developer / regex,pattern,match / search / blue-soft
- `diff-checker` / Diff checker / Compare two texts line by line. / Developer / diff,compare,changes / align-left / blue-muted
- `cron-helper` / Cron helper / Build a schedule and read it in plain words. / Developer / cron,schedule,task / moon / blue
- `curl-converter` / cURL converter / Turn a curl command into copy-ready fetch code. / Developer / curl,fetch,api / arrow-up-right / blue-strong
- `markdown-preview` / Markdown preview / Write simple markdown and see it rendered. / Text / markdown,preview,text / bars / blue
- `table-to-markdown` / Table to Markdown / Paste spreadsheet cells, get a markdown table. / Text / table,csv,markdown / arrow-right / blue-soft
- `case-converter` / Case converter / Switch text between UPPER, lower, Title and code cases. / Text / case,upper,lower / arrow-up / blue-muted
- `unit-converter` / Unit converter / Convert length, weight, temperature and more. / Everyday / units,convert,measure / refresh / blue
- `datetime-helper` / Date and time helper / Convert timestamps and see dates in plain words. / Everyday / date,time,timestamp / sun / blue-soft
- `qr-generator` / QR generator / Make a QR code for a link or text, offline. / Media / qr,code,share / circle-fill / blue-strong
- `image-compressor` / Image compressor / Shrink a photo so it is easier to share. / Media / image,compress,photo / star / blue
- `image-resizer` / Image resizer / Change image size and format. / Media / image,resize,convert / star-fill / blue-soft
All icon names verified members of `AppIconName` in `app/types/tool.ts`; all categories verified members of `toolCategoryValues`.

## Detail tasks

**Task T0: branch + dialog initial focus** `[SEQUENTIAL, depends-on: none]`
- Files: create branch `feature/phase-4-mvp-tools` (`git checkout -b`); modify `app/components/PaletteDialog.vue`, `app/components/ShortcutHelp.vue`, `app/components/ToolDualPane.vue`; create `app/composables/use-dialog-focus.ts`, `tests/e2e/dialog-focus.pw.ts`; modify `scripts/coverage-gate.ts` (one `ABSENT_FROM_LCOV_ALLOWLIST` entry: DOM-only focus helper, Playwright-covered, precedent: shell composables).
- Interfaces: produces `useDialogFocus(target: Ref<HTMLElement | null>)` focusing `[data-autofocus-target]` on dialog open (nextTick + rAF, no PrimeVue private API); consumed by the three dialogs. I/O example: open palette → `document.activeElement` is the search input.
- Size: M. Effort: M — 6 files, three dialogs, one allowlist entry, one e2e file.
- Break: none.
- Steps: [ ] create branch [ ] failing e2e (assert activeElement on open) → run `playwright test tests/e2e/dialog-focus.pw.ts` → implement → run → commit `fix(a11y): ...`.
- Acceptance: `playwright test tests/e2e/dialog-focus.pw.ts` green + `expectNoSeriousAxeViolations` in-file + Esc still closes + invoker focus restored.
- Risk: PrimeVue focus-trap fights manual focus → counter: focus inside `@show`/open watcher after paint; e2e asserts the end state, not the mechanism.

**Task T1: shared pure utils** `[SEQUENTIAL, depends-on: T0 (file: branch exists)]`
- Files: create `app/utils/qr-encode.ts` (`encodeQr(text, ecc): { modules: boolean[][]; size: number }`-shaped pure API, JSDoc + @example), `app/utils/markdown-subset.ts` (`renderMarkdownSubset(md): string` returning escaped HTML, supported-syntax list exported), `app/utils/unit-tables.ts` (`convertUnits(amount, from, to)` + table metadata); create `tests/unit/qr-encode.test.ts`, `tests/unit/markdown-subset.test.ts`, `tests/unit/unit-tables.test.ts`.
- Interfaces: produces the three functions above for T8 (markdown), T12 (units), T15 (QR). I/O examples in JSDoc (e.g. `convertUnits(1, "km", "m").value; // 1000`).
- Size: M. Effort: M — QR matrix math is the heavy part; keep byte-mode + ECC L/M only, kill line: full QR modes → ADR fallback.
- Break: split T1 if QR encoder exceeds ~400 lines (T1a encoder core, T1b the other two utils).
- Steps: [ ] failing unit vectors (QR: known small payload matrix spot-check + round-trip dimensions; MD: headings/bold/code/lists + `<script>` escaped; units: km→m, C→F, incompatible → error) → `bun test tests/unit/qr-encode.test.ts tests/unit/markdown-subset.test.ts tests/unit/unit-tables.test.ts` → implement → run → commit `feat(tools): ...`.
- Acceptance: the command above → 0 fail; `bun run coverage:gate` → PASSED; no `any`, JSDoc on every export.
- Risk: QR edge cases → counter: spec kill line + ADR fallback pre-approved (A2).

**Tasks T2-T7 (4.1), T8-T10 (4.2), T11-T14 (4.3), T15-T17 (4.4): one tool each** `[SEQUENTIAL, depends-on: T0 (branch); T8/T12/T15 also T1 (file: app/utils/<util>.ts)]`
- Files per new tool: scaffold 5 (`metadata.ts`, `schema.ts`, `logic.ts`, `ToolComponent.vue`, `logic.test.ts`) then replace logic + component; create `tests/e2e/<slug>.pw.ts`; regen (`bun run generate:registry`, output files only). Placeholders (T11/T13): keep `metadata.ts` (flip only `componentPath`), add `schema.ts`, `logic.ts`, `ToolComponent.vue`, `logic.test.ts`.
- Interfaces: consumes registry (`findTool("<slug>")` resolves; `bun run generate:registry -- --check` green) → produces route `/tools/<slug>` rendering `ToolComponent.vue` inside `ToolHost` (`data-tool-ready`).
- Size: M each (6-7 files). Effort: M — logic + component + both test layers per tool.
- Break: none (one tool never exceeds 8 files).
- Steps (identical per tool): [ ] scaffold (new slugs only) [ ] failing `logic.test.ts` (empty input, invalid input, one golden vector, error codes) → `bun test app/tools/<slug>` → implement `logic.ts` + `schema.ts` → failing e2e (happy path + empty + error + copy toast) → implement `ToolComponent.vue` on `ToolDualPane` with UI checklist (below) → `playwright test tests/e2e/<slug>.pw.ts` → regen + `bun run generate:registry -- --check` → commit `feat(tool): add <slug>`.
- Per-tool logic contracts: T2 JWT decode-only (header/payload JSON, UI labels "signature not checked"); T3 WebCrypto SHA-256/384/512 + hex/base64, async + loading state; T4 JS RegExp only, flag toggles, input/size caps + ReDoS note; T5 line Myers/LCS 2-way + ignore-whitespace; T6 5-field cron + presets + human sentence + next 3 runs + local-TZ label; T7 curl subset (method/URL/headers/data/basic-auth) → fetch snippet; T8 `renderMarkdownSubset` + supported-syntax note + escaped-HTML proof test; T9 CSV/TSV→MD table + delimiter detect; T10 six cases + per-variant copy; T11 `crypto.getRandomValues`, length/sets/exclude-ambiguous + strength hint, NO history/URL wiring; T12 `convertUnits` tables (length/mass/temp/volume/speed/data), explicit rounding; T13 hex/rgb/hsl + native picker input + contrast hint (finishing live paste-suggest path — existing shell-features e2e must stay green); T14 timestamp↔ISO↔local + relative + TZ label; T15 canvas render + PNG/SVG download + documented real-scan spot-check; T16 canvas quality slider + ≤10 MB guard + loading state; T17 target W×H + keep-ratio + PNG/JPEG/WebP via canvas `toBlob` + download.
- UI checklist (A3, every tool): `ToolDualPane` slots in order toolbar/input/output/footer; options in `pt-option-group` fieldsets with legends; real `<label>` per control; verb-first buttons (`Copy`, `Download`, `Clear input`, `Load sample`); status line (`role=status`/`alert`) + stats line placement per json-formatter; `ToolActions` with filename; history recorder except T11/T16/T17; URL watcher except T11/T16/T17; testids `<slug>-{input,output,status,...}`; 375px single column via existing workspace CSS; dark parity via tokens; reduced-motion respected; no raw literals.
- Acceptance per tool: `bun test app/tools/<slug>` → 0 fail AND `playwright test tests/e2e/<slug>.pw.ts` → green (incl. axe + 44px + no-overflow at 375px) AND `bun run generate:registry -- --check` → exit 0.
- Risk: scope creep per spec kill lines → counter: kill line enforced at review; overflow goes to v1.1, never into the task.

**Task T18: stability + screenshots** `[SEQUENTIAL, depends-on: all L1]`
- Files: `evidence/screenshots/<slug>-375-light.png` (16) + dark shots for qr-generator, markdown-preview, image-compressor, datetime-helper; no source changes.
- Steps: [ ] run focused file 5x per new/changed e2e file [ ] run full suite 3x [ ] capture screenshots.
- Acceptance: 5x focused green per file, 3x `playwright test` green full suite, 20 screenshots present.
- Risk: flaky browser test → counter: AGENTS anti-flaky rules; never raise retries (fix root cause).

**Task T19: uniformity pass (A3)** `[SEQUENTIAL, depends-on: all L1]`
- Files: none (fixes found here are implemented as amendments inside the owning tool task's commit, never as a drive-by).
- Steps: [ ] open all 16 tool views at 375px light + dark [ ] check spacing/hierarchy/copy/touch/focus against the T-checklist [ ] file findings to owning tasks.
- Acceptance: checklist signed in `flows/` evidence note with per-tool OK/notes rows; zero open uniformity notes at gate.
- Risk: taste drift across 16 views → counter: this task exists; Chopper re-audits it.

**Task T20: ROADMAP + CHANGELOG** `[SEQUENTIAL, depends-on: T18, T19]`
- Files: modify `ROADMAP.md` (Phase 4 boxes 4.1-4.4 → `[x]` with evidence strings, M4 → `[x]`, Current delivery line), `CHANGELOG.md` (Phase 4 entry).
- Steps: [ ] edit both [ ] `git diff --stat` shows exactly the two docs (+ mission evidence already committed).
- Acceptance: `git diff --stat` lists ROADMAP.md + CHANGELOG.md; every `[x]` carries an evidence pointer; no push without this diff (Luffy enforces at closure).
- Risk: none.

## Baseline
- `bun test` → 418 pass, 0 fail, 30 files (2026-09-30, pre-plan, clean tree).
- `bun run check` (`nuxt typecheck`) → exit 0.
- `git status` → clean except `.mugiwara/missions/pockettools-phase4-mvp-tools/`; branch `main`.
- Flow 3 must start from this baseline on the new branch; any red aborts the wave.

## Execution posture
`inline-sequential`, one task = one commit, Conventional Commits (`feat(tool):`, `fix(a11y):`, `docs(roadmap):`). No `[PARALLEL]` (shared generated registry proof above). Zoro flips host todos `pending→in_progress→completed` per wave in the same response as evidence.

## Risk & rollback
- R1 Breadth (16 tools): wave gates bound it; rollback point per wave = tag `phase4-waveN` (hash logged to decisions.md). Failed gate → fix forward; history rewrite never; multi-wave revert = `git revert --no-commit <wave-range>` + new commit, only via Luffy decision.
- R2 QR/markdown/image correctness: kill lines + pre-approved ADR fallbacks (A2); dep adds need ADR row + license check + precache proof.
- R3 E2E time/flakes: helpers reuse, bounded waits, 5x/3x proof (T18); retries never raised.
- R4 Registry drift: regen per tool task + `--check` in every acceptance; generated files never hand-edited.
- R5 Coverage gate on new `.ts` (T0 composable is DOM-only): allowlist entry with reason in T0; every other new `.ts` imported by its unit test.

## Pre-mortem
Assume this mission failed: the most likely cause is breadth — 16 tools pulled scope past the kill lines (full CommonMark, QR edge cases, image EXIF) while e2e time grew until stability proof was skipped. The plan counters it at T1 (shared seams with kill lines), per-task kill enforcement, wave gates that cannot be skipped, T18's mandatory 5x/3x proof, and T20's roadmap-before-push lock.

## Mission split
No split: solo mission, single branch, sequential-by-proof work; sub-missions are team-only and `conflict-check` would flag the shared registry on every pair. Contingency (D1): defer 4.4 media to a follow-up mission if Wave 1 re-gates twice.

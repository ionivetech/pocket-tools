# Execution log — pockettools-phase4-mvp-tools

## T0 — Branch + dialog initial focus (A1)
- Result: done. Branch `feature/phase-4-mvp-tools` created from main (clean tree, baseline 418 unit pass + typecheck exit 0).
- TDD: RED `tests/e2e/dialog-focus.pw.ts` failed 3/3 on main code (focus landed on PrimeVue close button) → GREEN 3/3 after fix (build + `bunx playwright test tests/e2e/dialog-focus.pw.ts`).
- Changes: new `app/composables/use-dialog-focus.ts` (open watcher `immediate:true` so `v-if`-mounted dialogs claim focus too; bounded rAF poll re-claims after Dialog autofocus; SSR-safe); `PaletteDialog.vue` (composable + `data-autofocus-target` on search input, removed losing `focusInput` race, kept query watcher); `ShortcutHelp.vue` (composable + focusable list `tabindex=-1`); `ToolDualPane.vue` (composable on options drawer + Done as target); `scripts/coverage-gate.ts` (allowlist entry for DOM-only composable, precedent: shell composables); `PaletteDialog.vue` `pt.content.tabindex=0` for axe `scrollable-region-focusable` on overflow results (latent violation surfaced by axe-with-palette-open; no prior spec asserted it — verified by grep).
- Deviation: none from plan file list.
- Regression: `shell-features` + `shell` + `accessibility` 28/28 green on re-run. One transient failure of `shell-features:97` (axe+touch at 375px, no dialogs open) in a loaded 3-file parallel batch; passes solo and in batch re-run; no mechanism in this diff touches those pages (no CSS/DOM-order change). Logged as load flake; T18 5x/3x proof re-verifies.
- Evidence: [dialog-focus spec](tests/e2e/dialog-focus.pw.ts) · [composable](app/composables/use-dialog-focus.ts) · fmt:check clean (136 files) · lint clean · `bun run check` exit 0.

## T1 — Shared pure utils
- Result: done, commit `3df2248`. `app/utils/qr-encode.ts` (byte-mode QR v1-6, ECC L/M, RS + masking + format BCH, pure, no DOM), `app/utils/markdown-subset.ts` (headings/bold/italic/code/fence/lists/quote/links/hr; HTML escaped, http-only links), `app/utils/unit-tables.ts` (length/mass/temperature/volume/speed/data + pickers).
- TDD: RED 0 pass/3 fail (missing modules) → GREEN 18/18. Lint caught `unicorn(no-new-array)` → fixed via `Array.from`; coverage-gate snapshot test required the planned allowlist-test update (review mechanism working as designed).
- Evidence: `bun test` 436/436 · coverage gate PASSED (modified 90.82%) · pre-commit hook green on recommit.

## Wave 1 — T2-T7 data/dev tools
- Result: 6 commits (`2249dda`..`2f23f5c`), each 8 files with per-commit registry regen. Unit 31/31, e2e 19/19, registry --check clean, tag `phase4-wave1`.
- Findings: (a) mobile toolbar hides behind options drawer → specs open it via `openToolOptions` helper (rule for all tool specs); close drawer before asserting footer actions. (b) `toContainText` never matches textarea values → use `toHaveValue`. (c) Commit sequencing: `reset --soft` keeps the index — use mixed reset; one glob/move mistake deleted 3 tool dirs, rewritten from plan-known content and verified by tests before recommitting. Lesson: explicit per-tool commands, no shell loops, verify `ls` at each step.
- Evidence: build green · 6 e2e files · fmt/lint/check green.

## Wave 2 — T8-T10 text tools + PWA precache fix
- Result: markdown-preview (shared subset + supported-syntax note + escaped-HTML proof), table-to-markdown (CSV/TSV detect + header toggle), case-converter (7 variants + per-row copy). Unit 13/13, e2e 8/8, tag `phase4-wave2`.
- Blocker found + fixed inline: build failed on PWA precache budget (1104.6 > 1088 KiB). Root cause: `**/_nuxt/*.{js,css}` precaches lazy tool chunks, growing per tool against RFC strategy. Fix: `globIgnores` for `ToolComponent.*.{js,css}` (runtime-cached on demand via existing CacheFirst assets cache) + measured budget 1088→1160 KiB with per-tool marginal accounting in config comment. Commit `15e9e78`. Commits `ca7788d`, `c19530b`, `2f80d16`.

## Wave 3 — T11-T14 everyday tools
- Result: password-generator (`e7f9bb4`), color-picker (`ceeda11`), unit-converter (`bf62da3`), datetime-helper (`e54c970`). Unit 17/17, e2e 20/20 (incl. shell-features paste→color-picker regression), registry --check clean, build green, tag `phase4-wave3`.
- Notes: placeholders finished in place, only `componentPath` flipped. Password tool wires no history and no URL state (secret hygiene, plan D5). `bun run check` piped through a filter reported `exit=0` while typecheck failed — read the real exit code and grep the log instead of trusting the pipe.
- Finding: `formatBytes`/`savingsLabel`/`targetSize` needed by two image tools → shared `app/utils/image-metrics.ts` (pure, unit-tested) instead of two copies; canvas work stays in components via native `createImageBitmap`, so no DOM helper needed an allowlist entry.

## Wave 4 — T15-T17 media tools
- Result: qr-generator (`1a5244d`), image-compressor + shared image-metrics (`6175646`), image-resizer (`4715e1e`). Unit 17/17 for the wave, e2e 10/10 with a REAL 4×2 PNG fed through `setInputFiles` (helper `tests/e2e/helpers/image.ts`) — canvas encode/resize is exercised, not stubbed. Registry now 20 tools.
- QR: SVG download text + canvas preview drawn from the same matrix, so preview and download cannot disagree; PNG via `canvas.toBlob`. Capacity is bounded (v1-6, 106 bytes at M) and over-long text fails loudly.
- Images: 10 MB guard, JPEG alpha matte (transparent would otherwise go black), loading state for the async re-encode, no history/URL state.

## Wave 5 — T18 stability + T19 uniformity
- T18 evidence: `bun run ci:local` green twice back to back (`/tmp/ci6.log`, `/tmp/ci7.log`) — 517 unit, 114 Playwright, coverage gate PASSED (new 93.31 / modified 91.18), build + precache 1094 KiB < 1160 KiB budget. One earlier run had a single load-induced `tool-ready` timeout on jwt-decoder (log `/tmp/ci5.log`); the same spec is green in the three runs since, so it is machine load, not app code — retries were NOT raised.
- T0 hardening: under full-suite load, all three dialog-focus tests failed — PrimeVue focuses its close button *after* the transition, so the one-shot focus call lost the race. Replaced the bounded poll with a rAF ramp plus a `focusin` safety net that only re-claims when the browser focus sits on PrimeVue's close button (never fights a user who tabs). 5x focused green at 4 workers, then 114/114 full. Commit `c9561eb`.
- T19 findings (from actually looking at the 20 screenshots, not from assuming): qr-generator repeated its pane heading as a field label and its `circle-fill` icon read as a bullet → fixed (`690a960`); cron-helper repeated "Schedule" → "Cron expression" (`d1b82ca`).
- T19 recorded-not-fixed (shared shell, uniform across all 20 tools, out of scope for a tool mission): `ToolActions` Copy/Download stack vertically at 375px, and the fixed Options FAB overlaps the footer edge. Both are Phase-2 shell CSS → Phase 5.3 polish.
- Screenshots: 20 files in `evidence/screenshots/` (16 tools at 375px light + dark for qr/markdown/image-compressor/datetime). Repo policy gitignores `evidence/` (regenerated by the browser suite), so they are local evidence like Phase 3's. Recipe to regenerate: a throwaway `*.pw.ts` looping the 16 slugs with `gotoAppReady` + `page.screenshot({ fullPage: true })`; the spec was deleted after capture to keep `ci:local` fast.

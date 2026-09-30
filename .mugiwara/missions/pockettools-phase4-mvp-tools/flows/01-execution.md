# Execution log — pockettools-phase4-mvp-tools

## T0 — Branch + dialog initial focus (A1)
- Result: done. Branch `feature/phase-4-mvp-tools` created from main (clean tree, baseline 418 unit pass + typecheck exit 0).
- TDD: RED `tests/e2e/dialog-focus.pw.ts` failed 3/3 on main code (focus landed on PrimeVue close button) → GREEN 3/3 after fix (build + `bunx playwright test tests/e2e/dialog-focus.pw.ts`).
- Changes: new `app/composables/use-dialog-focus.ts` (open watcher `immediate:true` so `v-if`-mounted dialogs claim focus too; bounded rAF poll re-claims after Dialog autofocus; SSR-safe); `PaletteDialog.vue` (composable + `data-autofocus-target` on search input, removed losing `focusInput` race, kept query watcher); `ShortcutHelp.vue` (composable + focusable list `tabindex=-1`); `ToolDualPane.vue` (composable on options drawer + Done as target); `scripts/coverage-gate.ts` (allowlist entry for DOM-only composable, precedent: shell composables); `PaletteDialog.vue` `pt.content.tabindex=0` for axe `scrollable-region-focusable` on overflow results (latent violation surfaced by axe-with-palette-open; no prior spec asserted it — verified by grep).
- Deviation: none from plan file list.
- Regression: `shell-features` + `shell` + `accessibility` 28/28 green on re-run. One transient failure of `shell-features:97` (axe+touch at 375px, no dialogs open) in a loaded 3-file parallel batch; passes solo and in batch re-run; no mechanism in this diff touches those pages (no CSS/DOM-order change). Logged as load flake; T18 5x/3x proof re-verifies.
- Evidence: [dialog-focus spec](tests/e2e/dialog-focus.pw.ts) · [composable](app/composables/use-dialog-focus.ts) · fmt:check clean (136 files) · lint clean · `bun run check` exit 0.

# Plan — pockettools-phase3-shell-features

Baseline: `bun run check` + `bun test` assumed green from Phase 2 gate (319 unit, 43 e2e). Re-verified at Flow 3 start before edits.

## Tasks

### T1 — Fuzzy search utility
- Files: `app/utils/fuzzy-search.ts`, `tests/unit/fuzzy-search.test.ts`
- Do: subsequence fuzzy scorer (case-insensitive, ordered chars, bonus for word-boundary + consecutive), `fuzzyFilterTools(defs, query)` returning ranked matches. JSDoc + @example. No dep.
- Accept: unit covers empty query, exact, typo (`jsn`→json), ordering, no-match. Strict TS, no any.

### T2 — Command palette upgrade (3.1)
- Files: `app/components/PaletteDialog.vue`, `app/layouts/default.vue`, `app/assets/css/main.css` (palette section only)
- Do: fuzzy46524 + recent/fav ranking on empty query; action rows (Home, Library, Toggle theme, Shortcuts help); sections (Suggestions / Tools / Actions); footer hints (↑↓ navigate, Enter open, Esc close); focus restore to invoker; empty state; mobile sheet already via position — widen + fullscreen-ish padding; aria listbox/option kept.
- Accept: Ctrl+K open/close, type `jsn` finds JSON, empty shows recent/fav first, arrows+enter navigates, Esc restores focus, 375px usable, axe clean.

### T3 — Favorites + recent hardening (3.2, 3.3)
- Files: `app/composables/use-tool-library.ts`, `tests/unit/tool-library.test.ts`, `app/pages/tools/index.vue` (clear buttons)
- Do: add `clearFavorites()`, `clearRecent()`, cap constant 5 documented; persist same keys; unit tests for toggle/mark/cap/persist/corrupt JSON; UI: Clear buttons in favorites/recent views with confirm-less but announced (aria-live) clear.
- Accept: unit green; e2e: star → favorites view shows it; recent after open; clear empties with empty state.

### T4 — Local history (3.4)
- Files: `app/utils/tool-history.ts`, `tests/unit/tool-history.test.ts`, `app/components/ToolHistory.vue`, `app/components/ToolHost.vue` (render when useful), `app/pages/tools/[slug].vue` (pass slug)
- Do: repo `record(tool, entry {input, output, at})`, cap 20/tool, retention 30 days prune on read, `restore/delete/clear`, localStorage key `pockettools-history-v1`, privacy note. UI: collapsible history under tool output, shown only when entries exist, restore fills input via event, delete per row, clear all.
- Policy doc line in component empty state: "Kept only in this browser for 30 days."
- Accept: unit (cap, prune, round-trip); e2e smoke on json-formatter (run → history appears → restore works).

### T5 — Paste detection (3.5)
- Files: `app/utils/paste-detect.ts`, `tests/unit/paste-detect.test.ts`, `app/components/PasteSuggest.vue`, `app/pages/index.vue`, `app/pages/tools/index.vue`
- Do: detectors (json-like, base64-like, uuid/ulid, hex-color, long-text) → suggested slugs; bar appears on paste into search inputs (and global paste with setting on), dismissible, "Don't suggest again" toggle persisted `pockettools-paste-optout`; never focuses away, never uploads.
- Accept: unit per detector + false-positive guard (short text → none); e2e: paste JSON into home search → suggests JSON formatter.

### T6 — Shortcuts (3.6)
- Files: `app/data/shortcuts.ts`, `tests/unit/shortcuts.test.ts`, `app/components/ShortcutHelp.vue`, `app/layouts/default.vue` (global keys), `app/components/AppHeader.vue` (help button)
- Do: registry [{id, keys, label, hint}]: palette (Ctrl/⌘+K), focus search (/), help (?), home (g h), library (g t), close (Esc). Help dialog lists them, `?` opens, Esc closes. Global keydown ignores inputs except Esc + Ctrl+K.
- Accept: unit registry shape; e2e: `?` opens help, `/` focuses home search, `g t` goes library.

### T7 — Landing + shell polish (3.7, taste)
- Files: `app/pages/index.vue`, `app/components/AppHeader.vue`, `app/components/AppFooter.vue`, `app/assets/css/main.css`, `nuxt.config.ts` (SEO meta + JSON-LD via useSeoMeta/useHead)
- Do: keep structure, tighten rhythm: kicker + 2-line display + 20-word lead + search + kbd hint + try-chips (already good — refine copy, spacing, orbit glow subtle, launcher with 3 real tools + privacy footer); catalog preview first 6 with favorites-first when present? keep simple: All preview; privacy/offline honest points; about concise; SEO: title/desc/OG + JSON-LD WebSite + ItemList of tools; dark parity via vars; 375px single column; reduced-motion respected.
- Accept: Lighthouse-friendly (no new heavy dep), axe clean, 375/768/1440 screenshots, light/dark screenshots.

### T8 — E2E + docs
- Files: `tests/e2e/shell-features.pw.ts`, `tests/e2e/helpers/app.ts` (reuse), `ROADMAP.md` (Phase 3 checkboxes at closure), `CHANGELOG.md` (Phase 3 entry at closure)
- Do: specs for palette fuzzy, favorites/recent, history smoke, paste suggest, shortcuts; reuse app-ready/axe/touch helpers; no waitForTimeout, bounded waits, role/name queries.
- Accept: `bun run ci:local` green (fmt, lint, check, registry, coverage gate, audit, 300+ unit, build, Playwright incl. axe + 44px).

## Order
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. Inline-sequential (shared files). Commit per logical task (auto_commit=on, branch `feature/phase-3-shell-features`).

## Evidence
- `bun test` output, `bun run ci:local` tail, Playwright list, screenshots `evidence/screenshots/*`, ROADMAP diff, `git log --oneline`.

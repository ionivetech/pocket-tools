# Spec — pockettools-phase3-shell-features

Source: ROADMAP.md Phase 3 (3.1-3.7), RFC sections 6-7, AGENTS.md. Only Phase 3; Phase 4+ untouched.

## Goal
Make discovery and repeated use effortless without a sidebar bottleneck. Gate: product feels approachable and easy to navigate with a growing catalog.

## Baseline (what already exists, verified by read)
- PaletteDialog: basic substring search, up/down/enter, Ctrl+K toggle, bottom-sheet on mobile, no fuzzy, no ranking, no actions, no focus restore, no footer hints.
- use-tool-library: favorites + recent (cap 5) with localStorage, used by /tools views (all/favorites/recent tabs, favorites-first, star toggle, empty states). No clear-history control, no unit test for the composable itself.
- Landing (/): search-first hero, category rail, catalog grid, privacy/about sections. No SEO meta/JSON-LD, hero visual is a static launcher mock, needs taste polish.
- Missing entirely: fuzzy util, history repo, paste detectors, shortcut registry/help.

## Options considered
1. **Palette**: A) upgrade in place (fuzzy + ranking + actions + footer) vs B) new cmdk dependency. Chosen A — no new dependency (ADR rule), native + existing filter, smaller bundle.
2. **Search**: A) subsequence fuzzy scorer (typo-tolerant, tiny) vs B) Fuse.js dep. Chosen A — 60 lines, zero dep, unit-testable.
3. **History**: A) per-tool localStorage repo (cap 20/tool, 30-day retention, explicit restore/delete/clear) vs B) Dexie now. Chosen A — Dexie is a later phase per RFC; localStorage keeps privacy + offline promise.
4. **Paste**: A) safe regex detectors + dismissible suggestion bar (never steals focus, setting to disable) vs B) auto-route on paste. Chosen A — RFC says optional, private, never steal focus.
5. **Shortcuts**: A) tiny central registry + help dialog + a few global keys (Ctrl+K, /, ?, g h, g t, Esc) vs B) full sequence engine. Chosen A — YAGNI, keyboard-reachable core actions only.
6. **Landing polish**: keep calm-electric cobalt, asymmetric launcher, one blue accent, one radius; hero fits viewport; real states; no purple glow, no 3-card row, no fake screenshots. Eye-catching via rhythm (orbit glow + launcher + kicker + display type), not decoration.

## Acceptance criteria
- 3.1 palette: fuzzy across name/desc/category/keywords; recent+favorites rank first on empty query; actions (go home, go library, toggle theme, open shortcuts); full keyboard (up/down/enter/esc) + focus restoration; mobile fullscreen-ish sheet; footer hints; empty state with clear next action.
- 3.2 favorites: store persists, accessible star control (aria-pressed/label), favorites section in /tools, empty state, clear control where useful. Unit + e2e.
- 3.3 recent: track visits (open + detail mount), cap 5, show in /tools + palette ranking, clear control. Unit + e2e.
- 3.4 history: per-tool repo, retention documented, restore/delete/clear, shown only when entries exist, never uploads. Unit + e2e smoke.
- 3.5 paste: detectors for json/base64/uuid/color/password-ish/text; suggestion bar on home + library, dismissible, disable setting, no focus steal, no network. Unit + e2e.
- 3.6 shortcuts: registry, help dialog (?), all core actions reachable, discoverable hints in palette footer + header. E2E.
- 3.7 landing: search-first, real catalog preview (first 6), honest privacy/offline, responsive 375/768/1440, dark parity, SEO meta + JSON-LD, axe zero critical/serious.
- Global: Bun only, PrimeVue only, tokens only, TS strict, 44px targets, visible focus, reduced-motion collapse, `bun run ci:local` green.

## Non-goals
- Phase 4 tools, workspace tabs, i18n, sync, Dexie, workers, deploy.
- Any new runtime dependency without ADR.
- Changing tool logic (json/base64/uuid/text) beyond wiring history/paste.

## Constraints
Bun 1.2+, Nuxt 4 app/, PrimeVue 4.5.5 Aura blue, Tailwind v4 tokens, oxfmt/oxlint, bun test + Playwright + axe, Conventional Commits, no cross-tool imports, no network from logic.

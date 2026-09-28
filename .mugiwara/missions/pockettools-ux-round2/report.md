# Report — pockettools-ux-round2 (Flow 9 closure)

## Mission summary
Thirteen UX/UI notes across the tool shell and four tools, on top of the
workspace-polish and CodeMirror missions. Branch `feature/ui-tool-workspace-polish`
(15 commits, 3 chained missions, single PR). No scope cut: every note is
implemented and verified.

## What shipped
1. Sticky navbar on mobile — root cause was `overflow-x: hidden` on `.pt-shell`
   breaking `position: sticky`; now `overflow-x: clip`.
2. Tighter top spacing: detail padding `4rem/7rem` → `2.5rem/5rem`, back-link
   margin `2.5rem` → `1.25rem`, tools hero top padding roughly halved.
3. PrimeVue toasts replace every inline status line (`ToolActions`, JSON
   copy-escaped, UUID copy) — the copy-escaped message no longer shifts layout.
4. Home quick-search removed as a separate button; Ctrl/⌘+K palette is global
   (default layout), reachable from the header icon on every page, with the hint
   moved into the "What do you want to do?" field area.
5. Favorites-first on the all-tools view.
6. Animated back-to-top (transition + `prefers-reduced-motion` aware), mounted
   only after first scroll.
7. Tool icon/label spacing; tool footer removed; "Saved tools keep working
   without a connection" moved into the tool header.
8. Mobile options: floating button opening a bottom sheet, reusing the single
   toolbar DOM node (no duplicate IDs).
9. Base64 URL-safe is a real switch; JSON/cleaner/UUID on-offs are switches
   (`ToolSwitch`), not buttons.
10. Palette and tool options are `Dialog`: centered modal on desktop, full-width
    bottom sheet at ≤767px. Search field pinned in the header, list scrolls.
11. UUID: default 1, merged Generate+Display options, readonly result field,
    two separate converter cards (UUID→ULID, ULID→UUID), timestamp-preserving
    with honest copy.

## Gate evidence (final run, `bun run ci:local` exit 0)
- fmt, lint, `nuxt typecheck` exit 0; registry 6/0; `bun audit` clean.
- Unit: 398 pass / 0 fail (25 files).
- Coverage: new 100% lines / 100% functions; modified 100% / 100%; gate PASSED.
- Build green; Playwright 53/53.
- Stability: 5 consecutive full-suite runs green, plus 5x uuid-generator
  repeat-each (35) and 6x 404 repeat-each. No retries added anywhere.

## Real defects found and fixed during this mission
- **Flake root cause (not masked):** tool pages are prerendered, so clicks could
  land on markup Vue was about to replace; the 404 page had the same problem.
  Fixed with real readiness signals (`data-tool-ready`, `data-error-ready`) that
  tests wait on. This also fixed a genuine UX defect: the 404 recovery buttons
  were dead before hydration.
- **Latent type bug:** `ToolComponentLoader` was typed `Promise<Component>` while
  the generated registry returns a module namespace. Only `defineAsyncComponent`
  had been tolerating it. Type corrected, no cast.
- **Coverage gate caught an untested new module:** `useResponsivePosition`'s
  lifecycle shell cannot be unit-tested without a DOM, so its logic was extracted
  into `responsive-position.ts` (unit-tested) and the shell was added to the
  gate's reviewed allowlist with a reason — and its behaviour is asserted in
  Playwright.

## Budget changes (deliberate, measured, recorded)
- PWA precache 704 → 1024 → 1088 KiB (CodeMirror, then Dialog/Toast/ToggleSwitch);
  largest single chunk 223.8 KiB, under the 256 KiB per-file cap so offline works.
- Home initial JS 120 → 128 KiB for the palette Dialog chunk. Demand-loading was
  tried and measured *worse* (131.4 KiB) because Nuxt preloads dynamic imports.
  Both numbers are in the test and ADR 002.

## Out of scope (cut, stated in spec.md)
JSON tree/fold, JSON5, jq, schema validation; cleaner regex find/replace; base64
image preview; UUID bulk convert and custom timestamps.

## Follow-up for the user
1. `git checkout main && git reset --hard origin/main` — local `main` still holds
   these commits; the harness refuses `reset --hard`, so the user runs it.
2. Push the branch and open the PR from `pr-verdict.md` (crew never merges).

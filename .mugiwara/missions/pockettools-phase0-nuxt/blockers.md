# Blockers — pockettools-phase0-nuxt

## Resolution ledger

The Flow 8 cycle-1 blockers are resolved. `bun pm scan` availability, INP lab applicability, and remote default-branch authentication are recorded limitations, not open product blockers.

| area | status | resolution / evidence |
|---|---|---|
| Mobile performance | RESOLVED | Nitro `compressPublicAssets` plus prerendering `/`, `/tools`, and four tool slugs; fresh Lighthouse mobile performance `96`, LCP `2.3s`, FCP `2.2s`, CLS `0`, TBT `40ms`; desktop performance `100`, LCP `0.5s`. |
| Light/dark evidence | RESOLVED | Playwright captures light and dark screenshots at `375`, `768`, and `1440`; axe and 44px checks pass. |
| Coverage | RESOLVED WITH INITIAL-IMPORT EXCEPTION | 3 unit tests, 6 assertions, 100% functions/lines for `app/data/tools.ts`; full changed-code aggregate is not meaningful for the parentless initial import. |
| Payload/quality evidence | RESOLVED | Prerendered HTML is Brotli-compressed; fresh route smoke and Lighthouse transfer evidence recorded in the final report. |
| PWA first-install offline | RESOLVED | Static `/offline.html` is precached; fresh-context unvisited-route test passes. |
| PWA cache bounds | RESOLVED | `pockettools-pages` and `pockettools-assets` have max entries and max ages. |
| Search/fake preview | RESOLVED | Submit focuses/scrolls to real results; launcher rows are real links; unsupported shortcut claim removed. |
| Touch targets | RESOLVED | Global 44px rules and Playwright assertions pass. |
| Control semantics | RESOLVED | Collection controls use `role="group"` with `aria-pressed`. |
| Theme flash | RESOLVED | `public/theme-bootstrap.js` applies persisted/system theme before mount; initial-state tests pass. |
| Bun-only test server | RESOLVED | Playwright starts `.output/server/index.mjs` with Bun. |
| PrimeIcons license | RESOLVED | `primeicons` removed; local `AppIcon.vue` SVG system is used. |
| Security headers | RESOLVED | CSP, frame, content-type, referrer, and permissions headers are configured and tested. |
| Dependency scan | LIMITED | `bun audit` passes; optional `bun pm scan` has no configured scanner. |
| INP | LIMITED | Lighthouse reports `notApplicable`; TBT is recorded and interaction coverage exists in Playwright. |
| GitHub default branch | EXTERNAL | `main` exists remotely; setting GitHub's default requires authenticated `gh` or repository settings. |

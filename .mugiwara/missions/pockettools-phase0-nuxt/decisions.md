# Decisions — pockettools-phase0-nuxt

## Flow 0 — Luffy (triage)

- Date: 2026-09-25
- Actor: user: farid nugraha <<farid.nugraha@mekari.com>>
- Request class: Explicit reset + architecture pivot. Old SvelteKit mission cancelled; new mission is Phase 0-only.
- Route: Flow 2 Nami planning. No implementation until PLAN.md/ROADMAP.md are rewritten and cleanup allowlist is approved.
- Stack decision: Bun + Nuxt 4 + Tailwind CSS v4 + PrimeVue 5.0.1 + Aura blue + oxfmt/oxlint (Oxc).
- Design decision: taste-skill v2 required; general audience; no generic left-sidebar admin shell; mobile-first/PWA/performance/accessibility are gates.
- Cleanup decision: old implementation and old mission are deleted, not archived. Preserve only top-level documentation/standards and the new mission state.
- Context7 evidence: Nuxt 4 uses `app/`; Tailwind v4 uses `@tailwindcss/vite`; PrimeVue module uses `primevue` + `@primeuix/themes` + Aura preset. Official PrimeVue sources verify v5.0.1 (Context7 index is stale at v4).
- Branch proposal: `feature/phase-0-nuxt`; not created until cleanup plan is approved.

## Flow 3 — T1 document restoration + targeted migration (2026-09-25)

- Correction: initial shortened PLAN/ROADMAP draft was rejected by user. Restored the full multi-phase structure and future roadmap, then migrated only relevant framework/UI references to Nuxt 4, PrimeVue 5 Aura blue, Tailwind v4, Bun, oxfmt, and oxlint/Oxc.
- Preserved all Phase 0–8 sections, future tool categories, performance/testing/security/accessibility/launch guidance, milestones, workflow, anti-stuck, anti-overengineering, and release checklist.
- `ROADMAP.md` is reset with all task markers `[ ]`; no implementation status is carried over.
- `PLAN.md` now documents Nuxt 4 `app/`, PrimeVue module/Aura blue, general-audience UX, non-sidebar scalable shell, taste-skill v2, PWA, accessibility, performance, and future architecture without implementing Phase 1+.
- Evidence: `PLAN.md`, `ROADMAP.md`, path checks, symlink checks, `cleanup-allowlist.md`.
- T1 status: complete. Next: review T2 partial scaffold against the restored plan; no commit/push yet.

## Flow 3 — T2 Nuxt baseline complete (2026-09-25)

- Decision: use Nuxt 4.5.2 with Vue 3.5.43, Vue Router 5.3.1, TypeScript 5.9.3, vue-tsc 3.3.11, and bun-types 1.4.2. TypeScript 7 was rejected because vue-tsc 3.3.11 fails on its package exports.
- Action: created Nuxt config, strict tsconfig, Bun config/scripts, app entry/layout/index page; installed exact current packages with Bun.
- Result: `bun run check` exit 0; `bun run build` exit 0; dev server returned HTTP 200 with PocketTools content.
- Evidence: `package.json`, `nuxt.config.ts`, `tsconfig.json`, `app/`, `/tmp/nuxt-t2-build.log` (ephemeral), `/tmp/nuxt-t2-home.html` (ephemeral).
- Blocker: none. Next: T3 Tailwind v4 + PrimeVue 5 + oxfmt/oxlint configuration.

## Flow 3 — T3 foundation wiring complete (2026-09-25)

- Decision: use the official packages `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `primevue@5.0.1`, `@primevue/nuxt-module@5.0.1`, `@primeuix/themes@3.0.1`, `primeicons@8.0.2`, `oxfmt@0.70.0`, and `oxlint@1.85.0`.
- Action: registered Tailwind through the Nuxt Vite plugin; registered PrimeVue with auto-import; defined `AuraBlue` from the Aura preset using the existing blue primitive scale; added CSS-first Tailwind/theme tokens, PrimeIcons, oxfmt/oxlint configs, lefthook, and commitlint.
- Result: `bun run fmt:check`, `bun run lint`, `bun run check`, and `bun run build` all exit 0.
- Evidence: `bun.lock`, `nuxt.config.ts`, `app/theme/aura-blue.ts`, `app/assets/css/main.css`, `.oxfmtrc.json`, `.oxlintrc.json`, `lefthook.yml`, `commitlint.config.js`, `/tmp/nuxt-t3-build.log` (ephemeral).
- Blocker: none. Next: T4 visual system and Aura blue token verification in the app shell.

## Flow 3 — T4 visual system complete (2026-09-25)

- Design read: consumer utility landing page for everyone; calm cobalt-and-slate editorial language; PrimeVue Aura + restrained Tailwind; asymmetric split hero; no dashboard/sidebar shell.
- Decision: use one blue accent family, CSS semantic tokens, off-white/slate surfaces, restrained 650ms rise motion with reduced-motion fallback, and PrimeVue controls for search/clear actions.
- Action: replaced the placeholder page with responsive command-bar header, split hero, real launcher preview, searchable/filterable tool collection, empty state, privacy principle, growth section, and footer; added light/dark theme persistence and responsive breakpoints.
- Result: SSR route returns HTTP 200 and contains the hero, tool, and privacy content; `bun run fmt:check`, `bun run lint`, `bun run check`, and `bun run build` all exit 0.
- Evidence: `app/pages/index.vue`, `app/assets/css/main.css`, `app/theme/aura-blue.ts`, `/tmp/nuxt-t4-build.log` (ephemeral), `/tmp/nuxt-t4-home.html` (ephemeral).
- Blocker: none. Next: T5 scalable non-sidebar shell and real collection states.

## Flow 3 — T5 scalable shell complete (2026-09-25)

- Decision: keep the shell non-sidebar and shared: top command bar, mobile PrimeVue Drawer, `/tools` collection route, `/tools/[slug]` detail route, and a small typed tool data registry.
- Action: extracted `AppHeader`/`AppFooter`/`ToolCard`; added `useTheme`; added localStorage-backed `useToolLibrary` for favorites and recent tools; added collection views, search, category filters, empty states, 404 handling, and accessible skip navigation.
- Result: home and collection routes are server-rendered; `/tools` and a valid detail route return 200; unknown tool returns 404; `bun run fmt:check`, `bun run lint`, `bun run check`, and `bun run build` all exit 0.
- Evidence: `app/components/`, `app/composables/`, `app/data/tools.ts`, `app/pages/tools/`, `/tmp/nuxt-t5-build.log` (ephemeral), route smoke output.
- Blocker: none. Next: T6 PWA baseline and resilient states.

## Flow 3 — T6 PWA baseline complete (2026-09-25)

- Decision: replace incompatible `@nuxtjs/pwa@3.3.5` with maintained `@vite-pwa/nuxt@1.1.1`; use `registerType: prompt`, Workbox `NetworkFirst` navigation runtime caching, and a precached `/offline.html` fallback.
- Action: added install manifest, 192/512 PNG icons, maskable icon, offline route/static fallback, official `usePWA()` update/offline/error state, and no analytics or user-data upload.
- Result: `bun run fmt:check`, `bun run lint`, `bun run check`, and `bun run build` all exit 0. Production preview returns HTTP 200 for app routes, offline routes, manifest, service worker, and icons; generated `sw.js` contains `offline.html` and `pockettools-pages` runtime cache.
- Evidence: `nuxt.config.ts`, `@vite-pwa/nuxt`, `public/icon*`, `public/offline.html`, `app/pages/offline.vue`, `app/components/PwaStatus.vue`, `.output/public/manifest.webmanifest`, `.output/public/sw.js`, `/tmp/nuxt-t6-preview.log` (ephemeral).
- Blocker: none. Next: T7 quality, UX, accessibility, performance, browser/offline evidence, and full CI gate.

## Flow 3 — T1 reset complete (2026-09-25)

- Decision: execute the user-approved destructive cleanup; old SvelteKit implementation and old mission are deleted, not archived.
- Action: removed source/config/test/docs/build artifacts; preserved and rewrote `PLAN.md`, `ROADMAP.md`, `AGENTS.md`, `README.md`, `.gitignore`, `.editorconfig`, `.npmrc`, and valid agent links; created new mission artifacts.
- Result: `src/`, `docs/`, `.svelte-kit/`, and `.mugiwara/missions/pockettools-foundation/` absent; ROADMAP task markers all unchecked; links resolve.
- Evidence: `cleanup-allowlist.md`, `PLAN.md`, `ROADMAP.md`, path/link verification command.
- Blocker: none. Next: T2 Nuxt 4 scaffold.

## Flow 3 — PrimeVue 4 downgrade and commit-readiness (2026-09-25)

- Decision: downgrade from PrimeVue 5.0.1 to the latest PrimeVue 4 line because the project prefers the MIT/open-source UI layer and does not want a PrimeUI license key dependency.
- Versions: `primevue@4.5.5`, `@primevue/nuxt-module@4.5.5`, `@primeuix/themes@2.0.3`.
- Action: removed PrimeUI runtime config and `.env.example`; kept explicit PrimeVue component registration (`Button`, `InputText`, `Drawer`) for tree-shaking; disabled dev service-worker generation to eliminate empty `dev-sw-dist` glob warnings while retaining production PWA output.
- Reason: PrimeVue 4 preserves the current Button/InputText/Drawer feature set and Aura design-token model; current Phase 0 scope has no dependency on PrimeVue 5-only components.
- Plan impact: `PLAN.md`, `ROADMAP.md`, `AGENTS.md`, `README.md`, active mission plan/spec, and evidence checklist now target PrimeVue 4.5.5. Future v5-only component ideas are deferred to a later ADR/migration.
- Evidence: `package.json`, `bun.lock`, `nuxt.config.ts`, `ROADMAP.md` Phase 0 checklist.
- Status: fresh post-downgrade format/lint/typecheck/build/E2E/Lighthouse/CI gates still required before commit readiness.

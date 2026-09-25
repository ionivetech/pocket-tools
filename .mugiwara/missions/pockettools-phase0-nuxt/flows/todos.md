# Todos — pockettools-phase0-nuxt

Mode: semi · Branch: `feature/phase-0-nuxt` · Ship verdict: GO for initial commit.

- [x] T1 Reset repository and preserve allowlist — evidence: `cleanup-allowlist.md`, `ROADMAP.md`, `AGENTS.md`
- [x] T2 Scaffold Nuxt 4 + Bun baseline — evidence: `package.json`, `nuxt.config.ts`, `app/app.vue`, `bun run check`, `bun run build`, dev HTTP 200
- [x] T3 Configure Oxfmt/Oxc, Tailwind v4, PrimeVue 4.5.5 — evidence: `bun.lock`, `nuxt.config.ts`, `app/theme/aura-blue.ts`, `app/assets/css/main.css`, gates
- [x] T4 Build visual system and Aura blue tokens — evidence: `app/pages/index.vue`, `app/assets/css/main.css`, `app/theme/aura-blue.ts`, responsive screenshots
- [x] T5 Build scalable non-sidebar shell — evidence: shared shell, `/tools`, `/tools/[slug]`, `useTheme`, `useToolLibrary`, mobile drawer, favorites/recent, 404
- [x] T6 Add PWA baseline and resilient states — evidence: `@vite-pwa/nuxt`, manifest, Workbox service worker, offline fallback, icons, `PwaStatus`
- [x] T7 Prove quality, UX, accessibility, performance — evidence: `evidence/ci-local.log`, Lighthouse reports, 8 Playwright tests, axe, screenshots
- [x] Stage and verify the Phase 0 commit allowlist
- [ ] Commit and push the initial Phase 0 foundation
- [ ] Archive the mission after terminal handoff

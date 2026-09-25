# Changelog

## Unreleased

### Phase 0 — Nuxt foundation

- Rebuilt PocketTools as a Nuxt 4.5.2 application with the `app/` source layout and Bun 1.2+ for runtime and package management.
- Added PrimeVue 4.5.5 through `@primevue/nuxt-module`, an Aura blue semantic theme, and a small inline SVG icon system.
- Added Tailwind CSS v4 through `@tailwindcss/vite` and CSS-first design tokens for light and dark surfaces, focus, spacing, radius, and motion.
- Added a mobile-first, non-sidebar shell with search, categories, `/tools`, `/tools/[slug]`, favorites, recent tools, local browser persistence, theme switching, mobile navigation, and useful empty and offline states.
- Added the Nuxt-compatible PWA baseline with an install manifest, local icons, service-worker caching, an offline fallback, and user-prompted updates.
- Kept tool work and preferences in the browser with no account, tracking, or upload path.
- Added accessibility and quality evidence: strict TypeScript, reduced-motion and visible-focus behavior, axe checks, Playwright Chromium coverage, responsive screenshots, Lighthouse reports, security headers, and the Bun-only `bun run ci:local` gate.
- Added a read-only GitHub Actions workflow for pull requests targeting `main` and pushes to `main` or `feature/**`; it installs the frozen lockfile and Chromium before running CI, with no deployment or merge steps.

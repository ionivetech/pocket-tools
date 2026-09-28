# Changelog

## Unreleased

### Phase 2 — First general-purpose tools

- Added the JSON formatter/validator: a hand-rolled JSON parser reporting exact line/column syntax errors (independent of JS engine), format/minify, and shareable state through the URL.
- Added the text cleaner: whitespace/case cleanup with live word, character, and line counts.
- Added the Base64 encoder/decoder: text encode/decode with auto-detected direction, plus file drag-and-drop.
- Added the UUID/ULID generator: UUID v4, UUID v7 (time-ordered), and ULID, batch 1-100, generated with the native Web Crypto API (no new dependency).
- Each tool ships pure, unit-tested logic; a PrimeVue Aura-blue component reusing the shared `ToolActions`/`ToolDualPane`/`ToolFileDrop` primitives; and a dedicated Playwright spec covering its core flow plus zero critical/serious axe violations and 44px touch targets at 375px.
- Gave `ToolDualPane`'s input and result panes their own card surface, matching the existing design language.

### Phase 0 — Nuxt foundation

- Rebuilt PocketTools as a Nuxt 4.5.2 application with the `app/` source layout and Bun 1.2+ for runtime and package management.
- Added PrimeVue 4.5.5 through `@primevue/nuxt-module`, an Aura blue semantic theme, and a small inline SVG icon system.
- Added Tailwind CSS v4 through `@tailwindcss/vite` and CSS-first design tokens for light and dark surfaces, focus, spacing, radius, and motion.
- Added a mobile-first, non-sidebar shell with search, categories, `/tools`, `/tools/[slug]`, favorites, recent tools, local browser persistence, theme switching, mobile navigation, and useful empty and offline states.
- Added the Nuxt-compatible PWA baseline with an install manifest, local icons, service-worker caching, an offline fallback, and user-prompted updates.
- Kept tool work and preferences in the browser with no account, tracking, or upload path.
- Added accessibility and quality evidence: strict TypeScript, reduced-motion and visible-focus behavior, axe checks, Playwright Chromium coverage, responsive screenshots, Lighthouse reports, security headers, and the Bun-only `bun run ci:local` gate.
- Added a read-only GitHub Actions workflow for pull requests targeting `main` and pushes to `main` or `feature/**`; it installs the frozen lockfile and Chromium before running CI, with no deployment or merge steps.

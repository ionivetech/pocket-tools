# PocketTools — Master Technical Plan

> Pocket-sized tools for everyone. Offline-first, privacy-first, all-in-one utility toolbox.

**Status:** Pre-development · **Version:** 0.2.0 · **Last updated:** 2026-09-25

## Table of Contents

1. [Vision & Scope](#1-vision--scope)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Directory Structure](#4-directory-structure)
5. [Design Patterns](#5-design-patterns)
6. [Frontend Design System](#6-frontend-design-system)
7. [UX Patterns](#7-ux-patterns)
8. [Feature List](#8-feature-list)
9. [Bootstrap Guide](#9-bootstrap-guide)
10. [Tool Guide](#10-tool-guide)
11. [Coding Conventions](#11-coding-conventions)
12. [Performance Budget](#12-performance-budget)
13. [Testing Strategy](#13-testing-strategy)
14. [CI / CD](#14-ci--cd)
15. [AGENTS.md](#15-agentsmd)
16. [Security & Privacy](#16-security--privacy)
17. [SEO & Distribution](#17-seo--distribution)
18. [Accessibility](#18-accessibility)
19. [Roadmap](#19-roadmap)
20. [Definition of Done](#20-definition-of-done)
21. [Open Questions / ADRs](#21-open-questions--adrs)

## 1. Vision & Scope

PocketTools is a browser-based utility toolbox for developers, designers, writers, students, marketers, and everyday users. It runs in the browser, works offline as a PWA, and never sends user data to a server.

### 1.1 Differentiators

1. Search-first tool discovery for a growing catalog.
2. General-purpose utility language, not developer-only terminology.
3. Offline-first PWA with local-only processing.
4. Shareable tool state through URL parameters in future tool phases.
5. A calm, distinctive, accessible workspace that scales beyond a sidebar.
6. Zero tracking, zero uploads, zero mandatory account.

### 1.2 Non-goals

- Cloud sync in the first release.
- Collaborative editing.
- AI features that break the offline/private promise.
- A replacement for full IDEs, design suites, or office suites.

### 1.3 Product principles

- Useful on a 375px phone before desktop enhancements.
- One clear action per view.
- Real states, real copy, no fake metrics or testimonials.
- No user data leaves the device.
- New tools are additive and discoverable without redesigning the shell.

## 2. Architecture

### 2.1 High-level architecture

```text
Browser
  ├─ Nuxt 4 app shell and pages
  ├─ PrimeVue 4 component layer
  ├─ Tailwind v4 CSS/token layer
  ├─ Tool registry and lazy tool modules
  ├─ Local state and future local persistence
  └─ PWA service worker/cache
```

The server exists only to serve the application and future explicitly approved static-compatible routes. Tool computation remains client-side.

### 2.2 Rendering strategy

- Nuxt SSR/prerender for landing, catalog, and SEO pages.
- Client hydration for interactive tool bodies.
- Lazy-loaded tool modules to protect the initial bundle.
- Static generation where content is known at build time.

### 2.3 Data flow

```text
User input → Tool component → Pure tool logic → Tool output
                                      ├─ Copy
                                      ├─ Download
                                      └─ Future local history/share state
```

Tool logic remains framework-independent and testable. Vue/PrimeVue components are thin interaction layers.

### 2.4 State management

| Scope                 | Solution                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| Component-local       | Vue Composition API `ref`, `computed`, `reactive`                       |
| Shared shell state    | Pinia only if a second consumer proves necessary; otherwise composables |
| Persistent settings   | Typed local storage wrapper                                             |
| IndexedDB persistence | Dexie repository layer in a later phase                                 |
| URL state             | Nuxt route query + zod validation in later tool phases                  |

Do not introduce a global store when a composable or local state is sufficient.

### 2.5 PWA strategy

- Precache the app shell, fonts, icons, and base CSS.
- Runtime cache versioned static assets.
- Network-first navigations with offline fallback.
- Prompt before activating a new service worker.
- Measure precache size and keep Phase 0 within its budget.

### 2.6 Worker strategy

Heavy operations move to Web Workers only when a tool needs them. Worker RPC uses Comlink when the first heavy tool lands. Phase 0 does not prebuild unused workers.

## 3. Tech Stack

| Layer                   | Choice                                | Why                                               |
| ----------------------- | ------------------------------------- | ------------------------------------------------- |
| Runtime/package manager | **Bun 1.2+**                          | One fast toolchain                                |
| Framework               | **Nuxt 4**                            | App router, SSR, static generation, Vue ecosystem |
| UI                      | **PrimeVue 4.5.5**                    | MIT/open-source Vue components and theming        |
| Nuxt UI module          | `@primevue/nuxt-module`               | Official integration and auto-import              |
| Theme                   | `@primeuix/themes` Aura + blue preset | Accessible tokens and consistent components       |
| CSS                     | **Tailwind CSS v4**                   | CSS-first utilities and tokens                    |
| Language                | TypeScript strict                     | Type safety                                       |
| Format                  | **oxfmt**                             | Fast native formatter                             |
| Lint                    | **oxlint / Oxc**                      | Fast Rust-based linting                           |
| Unit test               | `bun test`                            | Fast pure logic tests                             |
| E2E/a11y                | Playwright + axe-core                 | Real browser and accessibility evidence           |
| PWA                     | Nuxt-compatible PWA module            | Offline/install/update baseline                   |
| Git                     | Conventional Commits                  | Traceable history                                 |

Forbidden in this repository: Svelte, SvelteKit, shadcn-svelte, Bits UI, npm/yarn/pnpm, and ESLint/Prettier.

## 4. Directory Structure

```text
pockettools/
├── app/
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── AppCommandBar.vue
│   │   ├── ToolLauncher.vue
│   │   ├── CategoryRail.vue
│   │   ├── MobileToolDrawer.vue
│   │   ├── ThemeToggle.vue
│   │   ├── OfflineStatus.vue
│   │   └── PwaUpdateToast.vue
│   ├── composables/
│   ├── layouts/default.vue
│   ├── pages/
│   │   ├── index.vue
│   │   ├── tools/index.vue
│   │   └── privacy.vue
│   ├── theme/aura-blue.ts
│   └── types/
├── public/
│   ├── icons/
│   ├── fonts/
│   └── manifest.webmanifest
├── server/
├── shared/types/
├── tests/e2e/
├── nuxt.config.ts
├── package.json
├── bun.lock
├── bunfig.toml
├── tsconfig.json
├── oxlint.json
├── .oxfmtrc.json
├── lefthook.yml
├── commitlint.config.js
├── playwright.config.ts
├── .editorconfig
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── PLAN.md
├── ROADMAP.md
└── .mugiwara/
```

### 4.1 Directory rules

1. No cross-tool imports.
2. Tool logic is pure and framework-independent.
3. One tool folder equals one tool slug and URL segment.
4. Generated registries are never hand-edited.
5. PrimeVue is the only component system.
6. No permanent generic left-sidebar shell.

## 5. Design Patterns

### 5.1 Tool registry

Each future tool exposes metadata, pure logic, an optional schema, and a lazy Vue component. The registry is generated and loaded client-side only when needed.

### 5.2 Adapter pattern

Wrap browser APIs and third-party libraries behind small typed adapters. Tool logic depends on the adapter contract, not a vendor-specific API.

### 5.3 Compound pattern

Reusable tool surfaces use Vue components and slots rather than deeply nested markup. PrimeVue components provide the interaction primitives.

### 5.4 Strategy pattern

Tool variants use explicit strategy functions. Avoid class hierarchies unless state is intrinsic.

### 5.5 Command pattern

Future actions such as opening search, changing theme, or updating the PWA are explicit command objects with labels and keyboard bindings.

### 5.6 Repository pattern

Future IndexedDB access goes through repositories. Components never access browser databases directly.

### 5.7 Error boundary pattern

Future tools wrap runtime failures in a local error boundary with specific, actionable messages and no silent failure.

## 6. Frontend Design System

### 6.1 Design read

A general-purpose offline utility workspace for everyday people and technical users, with a calm-electric/cobalt language, leaning toward PrimeVue Aura and deliberate asymmetric composition rather than a generic admin dashboard.

### 6.2 Taste-skill v2 rules

- Infer the brief before generating UI.
- Use the official component system.
- One blue accent across the whole product.
- One radius language and one page theme lock.
- Hero content and primary action fit the initial viewport.
- Real UI states and real assets only.
- No AI-purple mesh gradients, generic three-card rows, fake screenshots, fake testimonials, or decorative status strips.
- Motion explains state and respects reduced motion.

### 6.3 Color and theme

PrimeVue Aura is the base. Customize the semantic primary palette to blue tokens. Use light and dark surfaces with equivalent hierarchy, visible focus rings, and no pure black/white surfaces. Raw colors do not appear in Vue components.

### 6.4 Typography

Use a self-hosted or safely fallbacked sans family for general readability. A monospace family is reserved for code-like output. Body copy remains readable at mobile widths and no meaningful text is below 12px.

### 6.5 Spacing, radius, and motion

Use a small semantic scale, one documented radius system, and 120–200ms state motion. All motion collapses under `prefers-reduced-motion`.

### 6.6 Component rules

- Buttons are verb-first and have visible focus.
- Inputs have real labels; placeholders are examples only.
- Icon-only controls have accessible names.
- Every surface has designed empty/loading/error/success/offline states where relevant.
- Touch targets are at least 44px.
- No hover-only interaction.
- No generic sidebar-first composition.

### 6.7 Shell composition

The shell uses a top command bar, search-first launcher, category rail/filters, and a mobile tool drawer. The `/tools` collection route is designed for a large future catalog. The shell should feel like a product, not an admin panel.

### 6.8 Landing composition

Above the fold is usable: a concise value proposition, search/launcher, and a real catalog preview. No giant hero, fake social proof, or decorative screenshot built from divs.

## 7. UX Patterns

### 7.1 Search-first discovery

Search is the primary discovery mechanism. Categories are secondary filters. Search results must be useful with zero results and clear what the user can do next.

### 7.2 Future command palette

Keyboard command palette is a later phase, but the command bar and focus model must leave room for it.

### 7.3 Future workspace

Tabs and multi-tool workspace are later phases. The Phase 0 shell must not hard-code a layout that prevents them.

### 7.4 Future paste detection

Paste suggestions are later phases. They must be optional, private, and never steal focus from a form.

### 7.5 Future URL sharing

Tool state sharing is later. Large payloads must be rejected clearly rather than truncated.

### 7.6 Theme behavior

System/light/dark theme is available from the shell, with no flash and persistence in a typed settings layer.

### 7.7 PWA behavior

Install and update prompts are calm, keyboard accessible, and never block the first interaction.

## 8. Feature List

Feature prioritization remains in `ROADMAP.md`. The catalog is general-purpose:

### Everyday and text

- Text cleaner and formatter
- Word/character counter
- Case converter
- Unit converter
- Date/time helper
- Color converter

### Data and developer

- JSON formatter/validator
- Base64 encoder/decoder
- UUID/ULID generator
- Hash helper
- Regex tester
- Diff checker
- JWT decoder
- CSV/table converter
- Cron parser

### Media

- Image compressor
- Image resizer/converter
- QR generator
- PDF merge/split
- Background removal

### Organization

- Search and command palette
- Favorites and recent tools
- Local history
- Workspace tabs
- Settings backup

## 9. Bootstrap Guide

```sh
bun install
bun run dev
bun run ci:local
```

Nuxt 4 uses `app/` as the source directory. Tailwind is configured through the Vite plugin. PrimeVue is registered through `@primevue/nuxt-module`. No old Svelte configuration is reused.

## 10. Tool Guide

Future tools should provide:

- metadata and searchable keywords;
- pure logic with unit tests;
- a thin Vue/PrimeVue component;
- explicit loading, empty, error, and success states;
- accessible labels and keyboard behavior;
- no cross-tool imports;
- no network dependency unless explicitly approved.

## 11. Coding Conventions

- TypeScript strict; no `any` or unapproved suppressions.
- Public functions have JSDoc with `@example`.
- Composables and utilities use kebab-case filenames.
- Components use PascalCase.
- No direct local storage in components.
- No console logging in production code.
- Use Bun commands only.
- Format with oxfmt and lint with oxlint/Oxc.

## 12. Performance Budget

- Lighthouse Performance >= 95 on the landing route.
- LCP < 2.5s, CLS < 0.1, INP < 200ms.
- Initial Phase 0 route JavaScript target <= 120 KB gzip.
- CSS target <= 30 KB gzip.
- No tool implementation before the shell budget is measured.
- Lazy-load future tool modules and heavy libraries.

## 13. Testing Strategy

- `bun test` for pure logic and composables.
- Playwright for shell behavior and PWA/offline flows.
- axe-core for WCAG checks.
- Responsive checks at 375, 768, and 1440 pixels.
- Light/dark screenshots.
- Lighthouse evidence recorded before Phase 0 commit.

## 14. CI / CD

CI runs, in order:

```sh
bun run fmt:check
bun run lint
bun run check
bun run test
bun run build
```

PWA and Playwright checks are added when their files exist. Deployment is a later phase and is not part of the Phase 0 commit.

## 15. AGENTS.md

`AGENTS.md` is the source of truth. `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, and `.github/copilot-instructions.md` point to it. Agents must read the active mission plan before editing.

## 16. Security & Privacy

- No user data leaves the browser.
- No analytics or tracking in the default product.
- No remote fonts or assets that create unnecessary third-party requests.
- Strict CSP when the deployment target requires it.
- URL state is validated and size-limited.
- Tool logic never executes remote code.

## 17. SEO & Distribution

- SSR/prerender landing and collection routes.
- Unique title/description/OG metadata.
- JSON-LD only for truthful page data.
- Sitemap and robots generated from actual routes.
- No fake OG images or fabricated social proof.

## 18. Accessibility

Target WCAG 2.2 AA.

- Semantic HTML and landmarks.
- Keyboard operation for every interactive surface.
- Visible focus and no focus traps outside intentional dialogs.
- Labels and descriptions for all controls.
- Error messages identify the problem and next action.
- Status changes use appropriate live regions.
- 44px touch targets.
- Reduced motion and system dark mode.
- axe reports zero critical/serious violations.

## 19. Roadmap

The full phase/task roadmap lives in `ROADMAP.md`. It is intentionally retained across future phases; only technology and design migrations are applied to it.

## 20. Definition of Done

A phase is done only when its own acceptance criteria pass, the complete `bun run ci:local` gate is green, relevant browser evidence is attached, and the plan/roadmap status is updated with evidence.

Phase 0 additionally requires:

- clean Nuxt 4 shell;
- PrimeVue 4.5.5 Aura blue theme;
- Tailwind v4;
- no permanent generic sidebar;
- mobile-first/PWA/accessibility/performance evidence;
- commit and push of the Phase 0 allowlist only.

## 21. Open Questions / ADRs

Future decisions requiring an ADR:

- Pinia versus composables once shared state is proven.
- Dexie schema and history retention.
- PWA module selection and update UX.
- URL-state encoding limits.
- Worker boundary for the first heavy tool.
- Any dependency that cannot be justified by a measured requirement.

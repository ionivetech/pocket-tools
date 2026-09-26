# AGENTS.md — AI Coding Standard for PocketTools

> Nuxt 4 Phase 0 mission. Every AI agent must follow these rules.

## Stack (non-negotiable)

- Runtime/package manager: **Bun 1.2+** only. Never npm, yarn, or pnpm.
- Framework: **Nuxt 4** with the `app/` source directory.
- UI: **PrimeVue 4.5.5** through `@primevue/nuxt-module`. The Prime packages `bun.lock` pins are MIT; PrimeUI also publishes packages under its Community License, so read the licence note in `README.md` before adding one.
- Theme: `@primeuix/themes` Aura preset with a blue semantic primary palette.
- CSS: **Tailwind CSS v4** through `@tailwindcss/vite` and a CSS-first token file.
- Language: TypeScript strict. No `any` and no `@ts-ignore` without an ADR.
- Format: **oxfmt**.
- Lint: **oxlint / Oxc**.
- Tests: `bun test`, Playwright, and axe-core.
- PWA: Nuxt-compatible PWA module with offline shell support.

Forbidden: Svelte, SvelteKit, shadcn-svelte, Bits UI, and old source remnants.

## Product rules

- PocketTools is for everyone, not only developers.
- Use everyday language in primary descriptions and examples.
- Keep the product useful on a 375px phone.
- Do not build a generic admin dashboard or permanent left-sidebar shell.
- Search, categories, and collection views must scale as tools are added.
- Every interactive surface needs a real empty, loading, error, success, offline, or update state where relevant.
- No user data leaves the browser.

## UI/UX rules

1. Apply `design-taste-frontend` v2 to every UI composition.
2. PrimeVue is the only component system. Customize Aura through semantic tokens, not scattered component overrides.
3. Use one blue accent family across light and dark themes.
4. Use one radius language and one page theme lock.
5. Use real UI states and real assets. No fake dashboards, testimonials, usage numbers, or decorative screenshot divs.
6. No emoji as UI icons.
7. Buttons use verb-first labels.
8. Labels are real labels. Placeholder text is never the label.
9. Focus states are always visible.
10. Every interactive element is keyboard reachable and has an accessible name.
11. Touch targets are at least 44px.
12. Loading states appear only for operations over 200ms.
13. Respect `prefers-reduced-motion`.
14. No `outline: none` without a replacement focus style.
15. No raw color, spacing, or radius literals in Vue components; use theme tokens or documented PrimeVue tokens.

## TypeScript and files

- Nuxt 4 source lives under `app/`.
- Public assets live under `public/`.
- Shared types live under `shared/` when they must cross runtime boundaries.
- Components use `PascalCase.vue`.
- Utilities and logic use `kebab-case.ts`.
- Tests are colocated or live under the approved test directory.
- Public functions have JSDoc with an `@example`.
- Prefer pure functions and explicit props over hidden mutable state.
- No cross-component hidden globals. Theme and shell state use composables with clear actions.

## Quality gates

Before every commit:

```sh
bun run ci:local
```

The gate must include formatting, linting, type checking, unit tests, and production build. Phase 0 also requires Playwright, axe, responsive screenshots, Lighthouse evidence, and an offline shell check.

## Test standards

Runner separation is non-negotiable. Pure logic runs under `bun test` (`tests/unit/*.test.ts`); browser flows run under Playwright (`tests/e2e/*.pw.ts`). Never name a Playwright file `*.spec.ts` — bare `bun test` would collect it and fail.

### Anti-flaky Playwright rules

1. No `waitForTimeout` and no fixed sleeps. Wait on observable state: locators, `expect(...).toBeVisible()`, `waitForURL`, or a bounded `waitForResponse`.
2. Every wait is bounded. Navigation and network waits get a short explicit timeout (e.g. 20 s) and assert the expected state.
3. Assert semantics, not styling. Query by role, accessible name, or test id — never by a utility, generated, or hashed class name. A documented project-owned state hook is allowed (e.g. `app-dark`, Tailwind's `darkModeSelector`), because it proves the state applied rather than only reported.
4. When intercepting a request, capture `status`, `headers`, and `body` BEFORE `route.fulfill()`. Never fulfill from a `Response` whose body was already read; a disposed `Response` is the classic source of `Response has been disposed` flakes.
5. When rewriting a response body, drop `content-encoding` and `content-length` and write the body you actually hold.
6. Chunk-abort tests use a bounded gate that is always released in a `finally`, so a failed assertion can never hang the next test.
7. Tests stay independent: no shared mutable state, no cross-test ordering, keep `fullyParallel` honest.
8. Never raise `retries` to hide a failure. A retry that turns a red gate green is a broken gate — fix the root cause.
9. Shared setup lives in `tests/e2e/helpers/` (`app.ts` for app-ready, axe, and touch-target waits; `chunk.ts` for chunk interception). Reuse it; do not copy-paste helpers into spec files.
10. Before committing a browser change, prove stability: run the focused file 5x and the full Playwright suite 3x. A single green run is not evidence.

## Git and dependencies

- Conventional Commits: `feat(ui): ...`, `fix(pwa): ...`, `chore(ci): ...`.
- One logical task per commit.
- New dependency requires an explicit Phase 0 requirement or ADR.
- Do not hand-edit generated files.
- Do not merge or deploy.

## Agent instruction files

`CLAUDE.md`, `.cursorrules`, `.windsurfrules`, and `.github/copilot-instructions.md` point to this file. Keep them aligned.

## When unsure

Read `PLAN.md` and the active mission plan. Prefer the simplest explicit solution that preserves privacy, accessibility, and performance.

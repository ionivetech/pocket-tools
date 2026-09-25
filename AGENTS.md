# AGENTS.md — AI Coding Standard for PocketTools

> Nuxt 4 Phase 0 mission. Every AI agent must follow these rules.

## Stack (non-negotiable)

- Runtime/package manager: **Bun 1.2+** only. Never npm, yarn, or pnpm.
- Framework: **Nuxt 4** with the `app/` source directory.
- UI: **PrimeVue 4.5.5** through `@primevue/nuxt-module` (MIT/open-source).
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

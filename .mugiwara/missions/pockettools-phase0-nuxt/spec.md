# Spec bridge — pockettools-phase0-nuxt

Source: user reset request, Context7 Nuxt 4/Tailwind v4/PrimeVue 4.5.5 research, and official PrimeVue 4.5.5 verification.

## Goal

Start a clean PocketTools repository focused only on Phase 0: a distinctive, general-audience, mobile-first Nuxt 4 PWA shell using Tailwind CSS v4 and PrimeVue 4.5.5 Aura with blue primary tokens. The shell must be scalable for a future large tool catalog without becoming a generic admin dashboard.

## Acceptance criteria

1. Old SvelteKit implementation, old tests/build artifacts, old PWA config, old docs folder, and old mission artifacts are deleted; essential standards/docs remain.
2. `PLAN.md` and `ROADMAP.md` are maintained as the implementation checklist; ROADMAP reflects verified Phase 0 status.
3. Nuxt 4, Bun, Tailwind v4, PrimeVue 4.5.5, `@primevue/nuxt-module`, Aura blue theme, oxfmt, and oxlint/Oxc are the only approved stack.
4. The shell has command/search entry, category navigation, mobile tool drawer, theme control, and scalable collection route; no permanent left sidebar.
5. General-audience language and examples are used throughout.
6. Mobile-first, PWA, performance, accessibility, keyboard, reduced-motion, loading/empty/error/offline states are verified.
7. `bun run ci:local`, Playwright, axe, screenshots, and Lighthouse evidence pass before commit/push.

## Constraints

- Bun only; no npm/yarn/pnpm.
- No Svelte, SvelteKit, shadcn-svelte, Bits UI, or old source remnants.
- PrimeVue is the only UI system; Aura is customized through semantic blue tokens, not scattered component overrides.
- Taste-skill v2 is mandatory for UI composition and preflight.
- No user data leaves the device.
- No dependency addition without an explicit Phase 0 requirement or ADR.

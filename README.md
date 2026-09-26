# PocketTools

Pocket-sized tools for everyone. Offline-first, privacy-first, and designed to stay useful as the catalog grows.

## Current status

Phase 0 foundation is implemented and ready for commit. The current stack is Nuxt 4, Tailwind CSS v4, PrimeVue 4.5.5 Aura, Bun, oxfmt, and oxlint/Oxc.

## Principles

- Useful on a phone first.
- Private by architecture: browser-only processing.
- Calm, distinctive, and welcoming rather than a generic admin dashboard.
- Search and categories scale to a large tool catalog.
- Accessibility and performance are release gates, not polish leftovers.

## Development

Bun is the only package manager/runtime command:

```sh
bun install
bun run dev
bun run ci:local
```

Tests: `bun run test` for pure logic, `bun run test:e2e` for browser flows. Playwright files use `*.pw.ts`, never `*.spec.ts`. Anti-flake rules live in `AGENTS.md`.

## PrimeVue version and licence

PrimeVue is pinned to the latest 4.x release (`4.5.5`) with the matching Nuxt module and `@primeuix/themes` 2.x theme package. Pinning 4.x keeps the UI layer on PrimeVue 4, whose packages are MIT, rather than PrimeVue 5, whose PrimeUI packages are licensed differently and require a license key.

That MIT claim covers what the lockfile resolves: `primevue`, `@primevue/nuxt-module`, `@primevue/core`, `@primevue/icons`, and `@primeuix/{themes,styled,styles,utils,forms}` are all MIT, and the build ships only those.

PrimeUI, the commercial family from PrimeTek, publishes some packages under the PrimeUI Community License instead. It is free only for organisations with under $1M annual gross revenue, fewer than 5 developers, fewer than 10 employees, and under $3M in outside funding. It requires annual renewal by re-confirming eligibility, and it requires a valid license key. Such packages can also sit in a `node_modules` tree while nothing in the project declares or imports them. Read each package's `LICENSE.md` and <https://primeui.dev/licenses/community> before adding a PrimeUI package. This records what those packages state; it is not legal advice.

See `PLAN.md` and `ROADMAP.md` for the current Phase 0 plan and acceptance gates.

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

## PrimeVue version

PrimeVue is pinned to the latest 4.x release (`4.5.5`) with the matching Nuxt module and `@primeuix/themes` 2.x theme package. This keeps the UI layer MIT/open-source and avoids the PrimeVue 5 PrimeUI license-key requirement.

See `PLAN.md` and `ROADMAP.md` for the current Phase 0 plan and acceptance gates.

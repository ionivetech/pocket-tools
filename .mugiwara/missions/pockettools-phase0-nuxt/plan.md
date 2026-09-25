# pockettools-phase0-nuxt

Phase 0-only greenfield mission: clean the repository, establish Nuxt 4 + Bun + Tailwind CSS v4 + PrimeVue 4.5.5, and ship a distinctive, accessible, mobile-first PWA shell that can scale to a large general-purpose tool catalog.

## Baseline

- Existing branch has no commits; old SvelteKit implementation is uncommitted and will be deleted, not archived.
- Runtime: Bun 1.3+ only. npm/yarn/pnpm are forbidden.
- New framework: Nuxt 4 with default `app/` source layout.
- New UI: PrimeVue 4.5.5, `@primevue/nuxt-module`, Aura preset with blue semantic primary tokens.
- Styling: Tailwind CSS v4 through `@tailwindcss/vite`; CSS-first tokens; no Svelte/shadcn-svelte/Bits UI remnants.
- Tooling: oxfmt, oxlint/Oxc, Playwright, axe-core, Conventional Commits.
- First executable gate after cleanup: `bun run dev` renders the Nuxt shell; `PLAN.md` and `ROADMAP.md` track implementation evidence and checklist status.

## Key decisions

1. **Nuxt 4 only.** Use the Nuxt 4 `app/`, `server/`, `public/`, and `shared/` layout. No SvelteKit compatibility mode.
2. **Bun only.** Bun installs, runs Nuxt/Vite, formats/lints through configured scripts, tests, and builds. `engines.bun >= 1.2.0`.
3. **Tailwind v4.** Register `@tailwindcss/vite` in `nuxt.config.ts`; import Tailwind once from `app/assets/css/main.css`. Do not add a PostCSS compatibility layer unless the installed Tailwind version requires it.
4. **PrimeVue 4.5.5.** Use the official Nuxt module, auto-imported components, `@primeuix/themes`, and a custom `definePreset(Aura, …)` with a blue primary palette. PrimeVue is the only component system; do not mix UI libraries.
5. **Taste-skill v2 is a design gate.** Apply `design-taste-frontend` to the shell and landing composition. No generic admin sidebar, no fake dashboard, no decorative gradient mesh, no placeholder testimonials, and no dev-only copy.
6. **General audience.** Product language covers everyday tasks and technical workflows. Examples include converting a file, cleaning text, checking a value, formatting data, and handling media. Developer terminology is optional context, never the default voice.
7. **Scalable navigation without a permanent left sidebar.** Use a compact top command bar, search-first tool launcher, category rail/segmented filters, and a mobile tool drawer/sheet. The `/tools` collection route is designed for hundreds of future tools.
8. **Mobile-first.** The primary experience is designed at 375px, then tablet and desktop. Touch targets are at least 44px. No hover-only actions.
9. **PWA baseline.** Installable manifest, icons, service worker, offline landing shell, update prompt, and no user data leaves the device.
10. **Accessibility/performance are release gates.** WCAG 2.2 AA, keyboard navigation, visible focus, reduced motion, axe zero critical/serious, 375/768/1440 checks, LCP/CLS/INP budgets.
11. **Phase 0 has no tool implementations.** It delivers the shell, theme, navigation model, PWA, and quality evidence only. Tool registry/catalog persistence are deferred unless required for the scalable shell contract.
12. **No new dependency without an ADR or an explicit Phase 0 requirement.** Use official packages and native platform features first.

## Product and design read

Reading this as: a general-purpose offline utility workspace for everyday people and technical users, with a distinctive calm-electric/cobalt language, leaning toward PrimeVue Aura + Tailwind v4 tokens + deliberate asymmetric composition rather than an admin dashboard.

### Design direction

- **Mood:** clear, quick, quietly premium; not developer-only and not childish.
- **Accent:** one blue family, locked across light/dark themes and all PrimeVue semantic primary tokens.
- **Shape:** consistent 3-tier radius system, not random pill/card mixtures.
- **Motion:** 120–200ms state feedback, transform/opacity only, disabled under reduced motion.
- **Composition:** asymmetric hero/tool launcher, real usable content above the fold, no giant marketing hero.
- **Navigation:** top command bar + search + category rail + mobile drawer; no fixed left sidebar.
- **Copy:** short, specific, verb-first, general-audience language; no emoji as UI icons; no fake numbers or social proof.
- **Assets:** real product UI/state previews or generated visual assets only; never div-based fake screenshots.
- **States:** every shell surface has designed loading, empty, error, success, offline, and update states where applicable.

### PrimeVue Aura blue contract

Use a custom preset based on Aura, with semantic `primary` mapped to the blue primitive palette (500 primary, 600 hover, 700 active), coherent light/dark surfaces, and a visible focus ring. Component-specific CSS overrides are avoided; tokens are the customization surface.

## Project structure after Phase 0

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
│   ├── composables/useTheme.ts
│   ├── layouts/default.vue
│   ├── pages/index.vue
│   ├── pages/tools/index.vue
│   ├── pages/privacy.vue
│   ├── theme/aura-blue.ts
│   └── types/navigation.ts
├── public/
│   ├── favicon.svg
│   ├── icons/
│   └── fonts/
├── shared/
│   └── types/
├── tests/e2e/
│   ├── shell.spec.ts
│   └── accessibility.spec.ts
├── nuxt.config.ts
├── tailwind.config.ts (only if the installed Tailwind setup requires it)
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

No `docs/`, `src/`, Svelte files, SvelteKit config, generated SvelteKit output, old worker/tool implementation, or old PWA implementation remains in this mission.

## Waves

| Wave | Focus | Tasks | Gate (literal) | Rollback point |
|---|---|---|---|---|
| 1 | Destructive reset + Nuxt scaffold | T1–T2 | `test ! -e src && test ! -e docs && bun run dev` renders Nuxt shell; `bun run check` exit 0 | `phase0-w1-good` |
| 2 | Tooling + visual system | T3–T4 | `bun run fmt:check && bun run lint && bun run check` exit 0; PrimeVue Aura blue renders in light/dark | `phase0-w2-good` |
| 3 | Scalable shell UX | T5 | `bun run build` exit 0; shell has command bar, tool launcher, category rail, mobile drawer; no left sidebar | `phase0-w3-good` |
| 4 | PWA baseline | T6 | `bun run build` emits manifest + service worker; offline landing reload passes | `phase0-w4-good` |
| 5 | Quality evidence + release handoff | T7 | `bun run ci:local` exit 0; Playwright shell/a11y pass at 375/768/1440; screenshots + Lighthouse evidence saved | `phase0-w5-good` |

A wave cannot start until the previous rollback tag exists. A failed gate is fixed forward, then tagged only after fresh green evidence.

## CODEOWNERS

| Area | Owner task(s) |
|---|---|
| Cleanup allowlist, root documentation, repository reset | T1 |
| `package.json`, Bun config, Nuxt config, TypeScript, oxlint/oxfmt, hooks, CI | T2–T3 |
| `app/assets`, `app/theme`, fonts, global tokens, PrimeVue theme | T4 |
| `app/components`, `app/layouts`, `app/pages`, composables, navigation types | T5 |
| `public/`, PWA config, service worker, install/update UX | T6 |
| `tests/e2e`, screenshots, performance/accessibility evidence, README/ROADMAP/PLAN release notes | T7 |

T2–T4 are sequential because they share Nuxt/Tailwind/theme configuration. T5 is sequential after T4 because it consumes the theme contract. T6 follows T5 because it updates the shell. T7 is the final evidence wave.

## Implementation graph

```text
L0  T1 cleanup/preserve allowlist
      ↓
L1  T2 Nuxt 4 scaffold + Bun scripts
      ↓
L2  T3 oxfmt/Oxc + Tailwind v4 + PrimeVue module wiring
      ↘
L3  T4 Aura blue theme + tokens + responsive primitives
      ↓
L4  T5 command bar + launcher + category navigation + mobile drawer
      ↓
L5  T6 PWA manifest/SW/offline/update UX
      ↓
L6  T7 responsive/a11y/performance evidence + final docs
```

Critical path: T1 → T2 → T3 → T4 → T5 → T6 → T7. No task is parallel because the root config, theme, shell, and evidence gates share files and interfaces.

## Task index

| # | Task | Files | Size | Depends on | Unblocks | Acceptance |
|---|---|---|---|---|---|---|
| T1 | Reset repository and preserve allowlist | root cleanup paths, `AGENTS.md`, `CLAUDE.md`, `PLAN.md`, `ROADMAP.md`, `README.md`, `.gitignore`, `.editorconfig`, agent instruction files | L | — | T2 | `test ! -e src && test ! -e docs && test ! -e .svelte-kit && test ! -e .mugiwara/missions/pockettools-foundation`; preserved files exist; ROADMAP has no `[x]`/`[~]` |
| T2 | Scaffold Nuxt 4 + Bun baseline | `package.json`, `bun.lock`, `bunfig.toml`, `nuxt.config.ts`, `tsconfig.json`, `app/app.vue`, `app/layouts/default.vue`, `.gitignore`, `.editorconfig` | M | T1 | T3 | `bun install && bun run dev` serves Nuxt; `bun run check` exit 0; no Svelte/SvelteKit files |
| T3 | Configure oxfmt/Oxc, Tailwind v4, PrimeVue 4.5.5 | `package.json`, `oxlint.json`, `.oxfmtrc.json`, `lefthook.yml`, `commitlint.config.js`, `nuxt.config.ts`, `app/assets/css/main.css`, `app/theme/aura-blue.ts` | M | T2 | T4 | `bun run fmt:check && bun run lint && bun run check` exit 0; `primevue@4`, `@primevue/nuxt-module`, `@primeuix/themes`, Tailwind Vite plugin present |
| T4 | Build visual system and Aura blue tokens | `app/assets/css/main.css`, `app/theme/aura-blue.ts`, `public/fonts/*`, `app/types/theme.ts` | M | T3 | T5 | `bun run build` exit 0; light/dark theme variables render; blue primary token is visible; no raw hex in Vue components |
| T5 | Build scalable non-sidebar shell | `app/layouts/default.vue`, `app/pages/index.vue`, `app/pages/tools/index.vue`, `app/components/*`, `app/composables/useTheme.ts`, `app/types/navigation.ts` | L | T4 | T6 | `bun run check && bun run build` exit 0; command bar, search launcher, category rail, mobile drawer, empty states, theme toggle present; no fixed left sidebar |
| T6 | Add PWA baseline and resilient states | `nuxt.config.ts`, `@vite-pwa/nuxt` config, `public/manifest.webmanifest`, `public/icons/*`, service worker config, `app/components/OfflineStatus.vue`, `app/components/PwaUpdateToast.vue` | M | T5 | T7 | `bun run build` emits manifest + SW; offline landing reload passes; update prompt is keyboard accessible; no user data leaves client |
| T7 | Prove quality, UX, accessibility, performance | `tests/e2e/shell.spec.ts`, `tests/e2e/accessibility.spec.ts`, `playwright.config.ts`, `README.md`, `ROADMAP.md`, `PLAN.md`, screenshot evidence | M | T6 | commit/push | `bun run ci:local` exit 0; E2E/a11y pass; screenshots at 375/768/1440 light/dark; Lighthouse targets recorded; `git status` contains only Phase 0 allowlist |

## Detail tasks

### Task 1: Reset repository and preserve allowlist `[SEQUENTIAL]`

- Files: delete old `src/`, `docs/`, `e2e/`, `scripts/`, `tests/`, `static/`, `.svelte-kit/`, `coverage/`, SvelteKit/PWA configs, old dependencies and lockfile; delete `.mugiwara/missions/pockettools-foundation/`; preserve and rewrite top-level standards/docs listed in the task index.
- Interfaces: consumes the user-approved preserve list; produces a clean Nuxt-ready root and a new mission artifact.
- Size: L. Effort: L — destructive reset plus standards rewrite; every retained file is reviewed.
- Break: stop before deletion if any required preserved file is missing; do not delete outside the explicit allowlist.
- Steps: [x] write preserve/delete manifest → [x] verify paths with `test`/`ls` → [x] delete only approved paths → [x] rewrite PLAN/ROADMAP with PrimeVue 4 implementation status → [x] verify no SvelteKit strings remain outside historical notes.
- Acceptance: `test ! -e src && test ! -e docs && test ! -e .mugiwara/missions/pockettools-foundation`; `ROADMAP.md` reflects verified implementation status; all preserved standards files exist.
- Risk: irreversible loss of uncommitted old work. User explicitly chose deletion; no archive fallback.

### Task 2: Scaffold Nuxt 4 + Bun baseline `[SEQUENTIAL, depends-on: T1]`

- Files: create `package.json`, `bun.lock`, `bunfig.toml`, `nuxt.config.ts`, `tsconfig.json`, `app/app.vue`, `app/layouts/default.vue`, `.gitignore`, `.editorconfig`.
- Interfaces: consumes Bun runtime; produces `bun run dev`, `bun run build`, `bun run check`, and the Nuxt 4 `app/` entry.
- Size: M. Effort: M — one clean scaffold and strict script baseline.
- Break: none.
- Steps: [x] scaffold Nuxt 4 with Bun → [x] add strict scripts → [x] add minimal app/layout → [x] run `bun run check` → [x] run `bun run build`.
- Acceptance: `bun install && bun run dev` serves a Nuxt page; `bun run check` and `bun run build` exit 0; no `.svelte`/SvelteKit files.
- Risk: Nuxt CLI version drift; pin Nuxt major 4 and record exact versions in `bun.lock`.

### Task 3: Configure Oxfmt/Oxc, Tailwind v4, PrimeVue 4.5.5 `[SEQUENTIAL, depends-on: T2]`

- Files: create/modify `package.json`, `oxlint.json`, `.oxfmtrc.json`, `lefthook.yml`, `commitlint.config.js`, `nuxt.config.ts`, `app/assets/css/main.css`, `app/theme/aura-blue.ts`.
- Interfaces: consumes Nuxt Vite config; produces `bun run lint`, `bun run fmt:check`, `bun run check`, Tailwind CSS pipeline, and PrimeVue module registration.
- Size: M. Effort: M — official integrations only, no custom component framework.
- Break: none.
- Steps: [x] add exact PrimeVue 4.5.5/Aura deps → [x] register `@primevue/nuxt-module` → [x] register `@tailwindcss/vite` → [x] import Tailwind v4 CSS → [x] configure Aura blue preset → [x] add Oxfmt/Oxlint scripts → [x] run gates.
- Acceptance: `bun run fmt:check && bun run lint && bun run check` exit 0; PrimeVue component renders with Aura blue primary; Tailwind utilities render.
- Risk: PrimeVue v4 module/theme compatibility; pin matching 4.x packages and prove Aura rendering in T3.

### Task 4: Build visual system and Aura blue tokens `[SEQUENTIAL, depends-on: T3]`

- Files: create/modify `app/assets/css/main.css`, `app/theme/aura-blue.ts`, `app/types/theme.ts`, `public/fonts/*`.
- Interfaces: consumes PrimeVue preset and Tailwind theme; produces semantic CSS variables, light/dark mode, typography, focus, spacing, radius, motion tokens.
- Size: M. Effort: M — one visual language applied globally before shell composition.
- Break: none.
- Steps: [x] define blue primary semantic tokens → [x] define light/dark surfaces → [x] set font and spacing scales → [x] set focus/reduced-motion rules → [x] verify both themes.
- Acceptance: `bun run build` exit 0; light and dark screenshots show equivalent hierarchy; no raw hex colors in Vue components; blue primary is consistent.
- Risk: over-designed token system; keep only tokens used by the Phase 0 shell.

### Task 5: Build scalable non-sidebar shell `[SEQUENTIAL, depends-on: T4]`

- Files: create `app/layouts/default.vue`, `app/pages/index.vue`, `app/pages/tools/index.vue`, `app/components/{AppCommandBar,ToolLauncher,CategoryRail,MobileToolDrawer,ThemeToggle,OfflineStatus}.vue`, `app/composables/useTheme.ts`, `app/types/navigation.ts`.
- Interfaces: consumes theme tokens and PrimeVue components; produces default layout, `/`, `/tools`, search launcher, category navigation, mobile drawer, and theme controls.
- Size: L. Effort: L — the visual product foundation; no feature tool logic.
- Break: split visual shell from route catalog only if the file set exceeds reviewability; keep one owner for `app/layouts` and navigation types.
- Steps: [x] apply taste-skill design read → [x] build command bar → [x] build search-first launcher → [x] build category rail/collection route → [x] build mobile drawer → [x] add empty/offline/theme states → [x] run responsive checks.
- Acceptance: `bun run check && bun run build` exit 0; no fixed left sidebar; shell works at 375px; command/search/category controls have labels and keyboard focus; general-audience copy is used.
- Risk: generic dashboard resemblance; reject any layout that looks like a stock admin template.

### Task 6: Add PWA baseline and resilient states `[SEQUENTIAL, depends-on: T5]`

- Files: modify `nuxt.config.ts`; create `public/manifest.webmanifest`, `public/icons/*`, PWA service-worker config, `app/components/PwaUpdateToast.vue`.
- Interfaces: consumes Nuxt shell and PrimeVue theme; produces installable/offline/update-capable app shell.
- Size: M. Effort: M — one PWA module and one tested service-worker path.
- Break: none.
- Steps: [x] configure PWA module → [x] create manifest/icons → [x] add offline fallback → [x] add update prompt → [x] run offline test → [x] measure precache.
- Acceptance: `bun run build` emits manifest + service worker; offline landing reload passes; update prompt is keyboard accessible; precache stays within the Phase 0 budget.
- Risk: precache bloat from the Nuxt/PrimeVue runtime; use shell-only precache and runtime caching.

### Task 7: Prove quality, UX, accessibility, performance `[SEQUENTIAL, depends-on: T6]`

- Files: create `playwright.config.ts`, `tests/e2e/shell.spec.ts`, `tests/e2e/accessibility.spec.ts`, screenshot evidence, update `README.md`, `ROADMAP.md`, `PLAN.md`.
- Interfaces: consumes the complete Phase 0 shell; produces release evidence and the exact Phase 0 commit allowlist.
- Size: M. Effort: M — evidence pass, not new product scope.
- Break: none.
- Steps: [x] test routes/states → [x] run axe → [x] test 375/768/1440 → [x] capture light/dark screenshots → [x] run Lighthouse → [x] record budgets and known follow-ups.
- Acceptance: `bun run ci:local` exit 0; Playwright shell/a11y pass; screenshots exist for required viewports/themes; Lighthouse results are recorded; working tree contains only Phase 0 allowlist.
- Risk: visual polish expands scope; any new feature goes to a later mission.

## Risk and rollback

| Risk | Likelihood | Impact | Counter |
|---|---|---|---|
| PrimeVue 4.5.5 module/theme incompatibility | M | H | Pin exact versions, prove Aura render in T3, rollback to `phase0-w2-good` |
| Tailwind v4 CSS not loaded in Nuxt | M | H | Import through Nuxt CSS entry and Vite plugin, screenshot both themes |
| Shell looks like generic admin dashboard | M | H | Taste-skill design read, no sidebar rule, asymmetric launcher/category rail, review gate |
| Mobile navigation becomes unusable with many tools | M | H | Search-first launcher, category filters, drawer, collection route, keyboard shortcuts |
| PWA precache exceeds budget | M | M | Shell-only precache, runtime cache, measure at T6 |
| Accessibility/contrast regression | M | H | PrimeVue semantic tokens, axe + keyboard + 375px checks at T7 |
| Destructive cleanup removes required standard | L | H | Explicit preserve allowlist and existence checks before deletion |

Rollback tags: `phase0-w1-good` through `phase0-w5-good`. No force-push, merge, or deploy. A failed gate is fixed forward from the last good tag.

## Definition of Done

- [x] Old SvelteKit implementation and old mission are deleted; preserve allowlist is verified.
- [x] `PLAN.md` and `ROADMAP.md` describe Nuxt 4 + Tailwind v4 + PrimeVue 4.5.5 Aura blue; ROADMAP reflects verified Phase 0 status.
- [x] Bun-only scripts pass: `bun run ci:local` exit 0.
- [x] Nuxt 4 dev/build/check commands pass.
- [x] PrimeVue 4.5.5 renders Aura with blue primary in light and dark modes.
- [x] Shell has no fixed left sidebar and scales via search/category/collection navigation.
- [x] General-audience copy and examples are used; no dev-only positioning.
- [x] 375px, 768px, 1440px layouts pass; keyboard navigation and focus visible.
- [x] Axe reports zero critical/serious violations.
- [x] PWA install/offline/update evidence exists.
- [x] Performance evidence records LCP, CLS, INP, initial JS/CSS budgets.
- [x] Screenshots light + dark and mobile + desktop exist.
- [ ] Only Phase 0 files are staged; commit and push happen only after the gate.

## Pre-mortem

Assuming this mission failed, the most likely cause is shipping a visually polished but generic Nuxt admin shell with a permanent sidebar, PrimeVue defaults, and no proof that the navigation scales or works for non-developer users. The plan counters this at T3 by locking the blue Aura token contract, at T5 by making the no-sidebar/search-first composition an acceptance criterion, and at T7 by requiring responsive, keyboard, axe, screenshot, and Lighthouse evidence before commit.

# pockettools-phase1-core-infrastructure — Phase 1 Core Infrastructure

## Classification and boundary

- **Classification:** Full, Lane 3. The mission has seven Phase 1 workstreams, 31 roadmap checkboxes, shared contracts across generation/runtime/routing, and browser/quality risk.
- **Execution posture:** one solo delivery on `feature/phase-1-core-infrastructure`; inline by default, with one proven parallel batch.
- **Mode:** `semi`. Luffy issues the execution GO in this session after this plan is validated; execution starts after Luffy's execution GO and does not wait for another user response.
- **Delivery shape:** one requested Phase 1 branch and one implementation sequence. No mission split, PR creation, merge, or deployment.
- **Scope lock:** implement only `ROADMAP.md` Phase 1 and milestone M1. Phase 2+ remains unchanged.
- **Planning boundary:** this handoff writes only this plan and the planning evidence file; it does not change `ROADMAP.md`, source, tests, configs, dependencies, or other mission artifacts.

The authoritative actual Git branch is `feature/phase-1-core-infrastructure`. The hyphenated value in `continue.json` is intentional savepoint sanitization (`/` → `-`); it is not a blocker and does not require reconciliation.

## Key decisions

1. **Reuse the Phase 0 shell and catalog rather than rebuilding it.** The four records in `app/data/tools.ts`, the search UI in `app/pages/index.vue` and `app/pages/tools/index.vue`, the detail route, the local icon system, the PWA shell, and existing test structure remain the starting point.
2. **Make metadata and registry contracts explicit before implementation.** `app/types/tool.ts` owns the serializable metadata shape, component-loader shape, category/search fields, result/error types, and manual validation. No `zod` is added; manual discriminated unions and native checks are sufficient for this boundary.
3. **Generate, do not hand-maintain, runtime registry data.** A deterministic Bun script scans `app/tools/*/metadata.ts`, validates every source, and writes `app/data/tool-registry.generated.ts` plus `app/data/tool-routes.generated.ts`. The generated files are never edited by hand. `bun run generate:registry -- --check` is a gate.
4. **Keep the four existing records infrastructure-only.** Their loaders resolve an honest `ToolPlaceholder` state. No JSON, text, password, color, Base64, UUID, or other Phase 2 behavior is implemented. The placeholder says the tool body is not available yet; it does not fake a product UI.
5. **Use a typed lazy-loader contract.** A `ToolDefinition` carries `loadComponent(): Promise<Component>`. `ToolHost` creates the Vue async component only when the detail route renders it, and wraps it in Nuxt's local `NuxtErrorBoundary`. A rejected loader or render is visible, retryable, and reported only in development.
6. **Centralize route resolution and error semantics in pure code.** `app/data/tool-route.ts` returns a typed found/not-found result. The page maps not-found to `createError({ status: 404, statusText: "Tool not found" })`; `app/error.vue` renders a useful shell-preserving 404 without exposing a stack or user data.
7. **Implement URL state with native browser/Bun primitives.** `app/utils/url-state.ts` uses a versioned `v1.` base64url JSON codec over `TextEncoder`/`TextDecoder`. It accepts only bounded primitive values, returns typed errors, rejects oversized input without truncation, treats absent state as `{}`, and never logs, uploads, or automatically writes state.
8. **Build the minimum shared UI system.** `ToolActions.vue` and `ToolState.vue` provide copy/download and real empty/error/loading/success state primitives. `ToolHeader.vue`, `ToolFooter.vue`, `ToolDualPane.vue`, `ToolFileDrop.vue`, and `ToolHost.vue` provide reusable composition. All use PrimeVue components, semantic Aura tokens, existing CSS variables, and native browser APIs; no new UI library, decorative asset, fake dashboard, or permanent sidebar is added.
9. **Separate the two test runners at the filename boundary.** Rename Playwright files from `*.spec.ts` to `*.pw.ts` and set Playwright `testMatch` accordingly. This is the minimum harness fix: raw `bun test` then collects only Bun tests while `playwright test` continues to collect browser tests. The existing `ci:local` order remains formatter → linter → typecheck → unit/coverage/audit → build → Playwright.
10. **Make roadmap evidence the last implementation step.** T10 may check Phase 1 boxes and M1 only after all tests, build, browser, accessibility, performance, and generator evidence exist. It records concise task/test references, updates current delivery/next review/related mission metadata, and leaves every Phase 2+ line untouched.
11. **Use no new dependency.** Existing Nuxt, Vue, PrimeVue, PrimeVue Nuxt module, Aura themes, Bun, Playwright, axe-core, and native browser APIs cover every Phase 1 requirement. A new package requires a measured failure and an ADR, neither of which exists.

## Design read and preflight

**Design read:** Reading this as a utility tool workspace for everyone, with a calm-electric/cobalt Aura language, leaning on the existing Phase 0 search-first, non-sidebar composition and PrimeVue semantic tokens, not a marketing page or admin dashboard.

**Dials:** variance 5, motion 2, density 4. Preserve the Phase 0 calm-electric/cobalt hierarchy; use restrained state motion and everyday-language copy.

### Preflight gate for T6, T7, T8, and T9

- [ ] Semantic tokens/PrimeVue only: run the Bun scan below on every new/changed Vue file; reject raw hex colors, inline `style` attributes, `outline: none`, and PrimeIcons-style `pi` classes. Manually confirm that interactive primitives are registered PrimeVue components and all visual values resolve through `app/theme/aura-blue.ts` or `app/assets/css/main.css`.

  ```sh
  bun -e '
  const files = ["app/components/ToolPlaceholder.vue","app/components/ToolActions.vue","app/components/ToolState.vue","app/components/ToolHeader.vue","app/components/ToolFooter.vue","app/components/ToolDualPane.vue","app/components/ToolFileDrop.vue","app/components/ToolHost.vue","app/error.vue","app/pages/index.vue","app/pages/tools/index.vue","app/pages/tools/[slug].vue"];
  for (const file of files) { const text = await Bun.file(file).text(); if (/#[0-9a-f]{3,8}\b/i.test(text) || /style\s*=/.test(text) || /outline\s*:\s*none/i.test(text) || /class\s*=\s*["\x27][^"\x27]*\bpi\b/.test(text)) throw new Error(`design token violation: ${file}`); }
  console.log("design token scan: pass");
  '
  ```

- [ ] One blue accent and one radius language: inspect light/dark `app/theme/aura-blue.ts`, `app/assets/css/main.css`, and the changed components; no second accent family, mixed radius scale, or scattered component override.
- [ ] 375px collapse: `ToolDualPane` and `ToolFileDrop` render as one column at 375px, with no horizontal overflow; `ToolActions` remains usable and its primary actions remain reachable.
- [ ] Labels, focus, and touch: every input has a real label, every control has an accessible name and visible `:focus-visible`, and visible controls are at least 44px. No placeholder is used as a label and no interaction is hover-only.
- [ ] Real states: empty, loading, error, success, offline, and update states contain truthful copy and an action/recovery path; no fake output, fabricated metric, testimonial, dashboard, or decorative screenshot appears.
- [ ] Motion: `bun run test:e2e` includes reduced-motion emulation and verifies animation/transition suppression under `prefers-reduced-motion: reduce`; no continuous decorative animation is introduced.
- [ ] Copy/assets audit: manually read every changed visible string for grammar, everyday clarity, verb-first buttons, and no emoji icons; confirm no new files under `public/` and no raw image/asset was added for decoration.
- [ ] Evidence: `bun run test:e2e` passes axe with zero critical/serious violations, 44px checks, keyboard/focus checks, and captures light/dark screenshots at 375, 768, and 1440 widths under `.mugiwara/missions/pockettools-phase1-core-infrastructure/evidence/`.

T6, T7, T8, and T9 must run this preflight before their task acceptance is recorded.

## Baseline and context scan

Recorded 2026-09-25 before planning:

- `bunx tsc --noEmit` → exit 0.
- `bun run test` → `3 pass`, `0 fail`, `6 expect() calls` across `tests/unit/tools.test.ts`.
- Raw `bun test` → `3 pass`, `3 fail`, `3 errors`; Bun collects `tests/e2e/shell.spec.ts`, `tests/e2e/pwa.spec.ts`, and `tests/e2e/accessibility.spec.ts`, then calls Playwright's `test()` API outside Playwright.
- `bun --version` → `1.3.14`.
- `package.json` has the required order in `ci:local`; `.github/workflows/ci.yml` installs the frozen Bun lockfile and Chromium, then runs `bun run ci:local`.
- `scripts/` exists but is empty. There is no `app/types/`, `app/tools/`, `app/utils/`, `app/error.vue`, or repository `CODEOWNERS` file.
- The archived Phase 0 report records a green Phase 0 gate, but this plan does not treat archived counts as current Phase 1 proof; current tests are rerun at execution.

### Verified current implementation

| Area | Current evidence | Phase 1 implication |
|---|---|---|
| Catalog | `app/data/tools.ts:1-80` has four records, categories, icons, accents, keywords, and `findTool`. | Preserve values; replace the hardcoded list as the source of truth. |
| Search/collection | `app/pages/tools/index.vue:1-192` filters name/description/category/keywords inline and has empty/filter states. | Move filtering to a tested pure helper; retain the useful UI. |
| Home search | `app/pages/index.vue:1-180` duplicates the same search behavior and presents a catalog preview. | Consume the same search contract without changing the Phase 0 composition. |
| Detail route | `app/pages/tools/[slug].vue:1-43` resolves a record and throws a 404, but renders a static placeholder card. | Add registry lookup, SEO metadata, lazy host, and local runtime boundary. |
| Local persistence | `app/composables/use-tool-library.ts:1-70` contains existing favorites/recent state. | Preserve it; do not expand Phase 3 behavior. |
| UI | `app/components/*`, `app/assets/css/main.css`, and `app/theme/aura-blue.ts` implement the calm-electric/cobalt Aura shell and local SVG icons. | Add shared tool primitives with the same tokens; no new visual system. |
| Unit tests | `tests/unit/tools.test.ts:1-20` checks the existing catalog. | Keep as regression coverage while adding contract tests. |
| Browser tests | `tests/e2e/shell.spec.ts`, `accessibility.spec.ts`, and `pwa.spec.ts` cover shell, search, 404-adjacent behavior, accessibility, PWA, security headers, and responsive screenshots. | Rename for runner separation and add tool infrastructure/performance checks. |
| Config | `nuxt.config.ts:15-25` hardcodes four prerender detail routes; `package.json:20` already orders CI correctly. | Generate route slugs and keep the CI order unchanged. |
| Standards | `AGENTS.md`, `PLAN.md`, and `ROADMAP.md` require Bun, strict TypeScript, PrimeVue/tokens, privacy, 375px use, reduced motion, and no generic sidebar. | These are acceptance constraints, not optional polish. |

### Trust and framework grounding

The repository files and tests are first-party sources and take precedence over assumptions. `PLAN.md`, `ROADMAP.md`, `spec.md`, and `decisions.md` are scope/product sources. Current Nuxt 4 documentation was checked for the relevant APIs: `useRoute()` for dynamic params, `createError()` for 404s, `useSeoMeta()` for page metadata, and `NuxtErrorBoundary` with `clearError` for local client failures. The plan uses those APIs without adding a router or validation dependency.

## Architecture overview

```text
app/tools/<slug>/metadata.ts (source metadata)
              │
              ▼
scripts/generate-tool-registry.ts
       │                         │
       ▼                         ▼
app/data/tool-registry.generated.ts   app/data/tool-routes.generated.ts
       │                         │
       ▼                         ▼
app/data/tool-registry.ts       nuxt.config.ts prerender routes
       │                         │
       ├── app/data/tool-search.ts ──► / and /tools filtering
       │
       └── ToolDefinition.loadComponent()
                    │
                    ▼
             ToolHost + NuxtErrorBoundary
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
   ToolHeader   ToolActions   ToolState/error retry
                    │
             ToolDualPane/ToolFileDrop

scripts/scaffold-tool.ts ──writes──► app/tools/<new-slug>/*
       └── reuses the same metadata validator and registry generator

app/utils/url-state.ts is an independent, opt-in browser codec; no route or
component writes it unless a future tool explicitly consumes the result.
```

### Contract register

| Boundary | Contract artifact | Stable result/error semantics |
|---|---|---|
| Metadata/registry | `app/types/tool.ts`, `app/data/tool-registry.ts` | `Result<T>` is `{ ok: true, value }` or `{ ok: false, error: { code, message } }`; duplicate registration is `duplicate_tool_slug`; unknown `get` is `undefined`. |
| Scaffolder | `scripts/scaffold-tool.ts` | CLI exits nonzero for `invalid_slug`, `missing_name`, `invalid_category`, `existing_tool`, or `write_failed`; it never overwrites a tool. |
| Route | `app/data/tool-route.ts`, `app/pages/tools/[slug].vue`, `app/error.vue` | Known slug resolves metadata; unknown slug maps to HTTP 404 with `tool_not_found`; errors expose no stack or user state. |
| URL state | `app/utils/url-state.ts` | `url_state_invalid`, `url_state_too_large`, and `url_state_decode_failed`; no truncation. |
| Local boundary | `app/components/ToolHost.vue`, `app/utils/error-reporting.ts` | Loader/render failures become a visible retry state; development-only reporting never throws or logs user content in production. |

## Verified project structure

### Current paths read during planning

```text
app/
├── app.vue
├── assets/css/main.css
├── components/{AppFooter,AppHeader,AppIcon,PwaStatus,ToolCard}.vue
├── composables/{use-theme,use-tool-library}.ts
├── data/tools.ts
├── layouts/default.vue
├── pages/{index.vue,offline.vue,tools/index.vue,tools/[slug].vue}
└── theme/aura-blue.ts
public/{offline.html,theme-bootstrap.js,icon.svg,icon-192.png,icon-512.png,icon-maskable.svg}
shared/                         (not present)
tests/unit/tools.test.ts
tests/e2e/{shell,accessibility,pwa}.spec.ts
scripts/                        (present, empty)
nuxt.config.ts
package.json
bunfig.toml
tsconfig.json
.oxlintrc.json
.oxfmtrc.json
playwright.config.ts
.github/workflows/ci.yml
AGENTS.md
PLAN.md
ROADMAP.md
README.md
CHANGELOG.md
```

### Planned paths under verified parents

The following files/directories do not exist yet; their parents (`app/`, `app/data/`, `app/components/`, `scripts/`, `tests/unit/`, and `tests/e2e/`) were verified. The executor must verify each path before creating it.

```text
app/types/tool.ts
app/tools/{json-formatter,password-generator,color-picker,text-cleaner}/metadata.ts
app/components/{ToolPlaceholder,ToolActions,ToolState,ToolHeader,ToolFooter,ToolDualPane,ToolFileDrop,ToolHost}.vue
app/data/{tool-registry.generated.ts,tool-routes.generated.ts,tool-registry.ts,tool-search.ts,tool-route.ts}
app/utils/{browser-actions.ts,url-state.ts,error-reporting.ts}
app/error.vue
scripts/{generate-tool-registry.ts,scaffold-tool.ts}
tests/unit/{tool-metadata,generated-registry,tool-registry,tool-search,scaffold-tool,url-state,browser-actions,error-reporting,tool-route}.test.ts
tests/e2e/{shell,accessibility,pwa}.pw.ts
tests/e2e/tool-infrastructure.pw.ts
```

No `CODEOWNERS` file is added. The ownership map below is the planning equivalent; the repository has no current file to modify.

## Scope guards

The following are explicitly forbidden in this mission:

- Any Phase 2 product implementation: JSON formatting/validation, text cleaning/counting, password generation, color conversion, Base64, UUID/ULID, or another real tool algorithm.
- Phase 3 favorites/recent enhancements, command palette, paste detection, keyboard shortcut registry, or local history expansion. Existing Phase 0 favorites/recent persistence is preserved, not extended.
- Phase 4+ tools, workspace tabs, settings, deployment, SEO distribution work, analytics, cloud sync, authentication, or server data.
- New dependencies, `zod`, Pinia, Dexie, a second component system, PrimeIcons, or decorative assets.
- Hand edits to generated registry/route files, raw color/spacing/radius literals in Vue components, fake screenshots/div dashboards, permanent left-sidebar navigation, or silent runtime failures.
- PR creation, merge, deployment, or force-push.

## Execution posture

- **Control mode:** `semi`; Luffy issues the execution GO in this session after plan validation; execution starts after Luffy's execution GO and does not wait for another user response.
- **Initial posture:** inline-sequential; the only parallel batch is explicitly proven below.
- **Re-evaluate:** before each wave, after each task commit, and at quality/review gates.
- **Commit rule:** each T1–T10 task produces one Conventional Commit. No micro-fix commits and no task spans eight or more files.
- **Rollback rule:** record the last green commit SHA for each wave and revert that commit; do not create a tag or auxiliary ref.
- **Evidence rule:** every task records the literal command and expected exit/result before the next dependency starts.

## Waves

| Wave | Focus | Tasks | Literal gate and expected result | Rollback point (recorded after gate) |
|---|---|---|---|---|
| 1 | Contracts and source generation | T1–T2 | `bun test tests/unit/tool-metadata.test.ts tests/unit/generated-registry.test.ts && bun run scripts/generate-tool-registry.ts --check && bunx tsc --noEmit` → `0 fail`, generator `4 tool definitions, 0 errors`, typecheck exit 0 | T2's last green commit SHA |
| 2 | Runtime registry, scaffolder, URL codec | T3, T4, T5 `[PARALLEL]` | Focused commands in each task pass; `bun run generate:registry -- --check` → `4 tool definitions, 0 errors`; `bunx tsc --noEmit` exit 0 | Last green commit SHA from the T3/T4/T5 batch |
| 3 | Shared action/state UI | T6 | `bun test tests/unit/browser-actions.test.ts && bun run check && bun run build` → `0 fail` and build exit 0 | T6's last green commit SHA |
| 4 | Tool composition and local failure boundary | T7 | `bun test tests/unit/error-reporting.test.ts && bun run check && bun run build` → `0 fail` and build exit 0 | T7's last green commit SHA |
| 5 | Registry-backed routes and route errors | T8 | `bun test tests/unit/tool-route.test.ts && bun run generate:registry -- --check && bun run build && bun run test` → `0 fail`, generated routes current, build exit 0 | T8's last green commit SHA |
| 6 | Runner separation and browser proof | T9 | `bun test --list` contains no `tests/e2e/` and exits 0; `bun run test` → `0 fail`; `bun run test:e2e` → all Playwright tests pass; performance assertions pass | T9's last green commit SHA |
| 7 | Evidence-gated ROADMAP update | T10 | `bun run ci:local` exit 0; all 31 Phase 1 checkbox lines and M1 are checked with evidence; Phase 2-through-before-Milestones comparison is identical to base | T10's last green commit SHA |

A wave cannot start until the preceding recorded commit SHA is available. If a gate fails, preserve the evidence and use `git revert <recorded-wave-commit-sha>` when a clean rollback is safer, then fix forward and rerun the gate. No auxiliary refs or git state are created during planning.

### Parallel proof for Wave 2

T3, T4, and T5 may run in parallel only under all four conditions:

- **Files:** T3 owns `app/data/tool-registry.ts`, `app/data/tool-search.ts`, `app/data/tools.ts`, and its two unit tests; T4 owns `scripts/scaffold-tool.ts`, `package.json`, and `tests/unit/scaffold-tool.test.ts`; T5 owns `app/utils/url-state.ts` and `tests/unit/url-state.test.ts`. T4's only generator-file interaction is a read-only import of T2's existing `generateToolRegistry(options)` export; no Wave 2 write path is shared.
- **Interfaces:** T3 consumes the T1 types/T2 generated data; T4 consumes the T1 validator and T2's existing configurable `generateToolRegistry(options)` export; T5 exports only its URL codec. None consumes another Wave 2 task's output.
- **CODEOWNERS areas:** `runtime-data`, `tooling`, and `url-state` are distinct area rows.
- **Acceptance commands:** T3 runs registry/search tests, T4 runs scaffolder tests plus generator check, and T5 runs URL-state tests. No parallel task runs the same acceptance command or writes the same generated default output.

## CODEOWNERS / area map

There is no current `CODEOWNERS` file; this is the execution ownership map, not a new repository file.

| Area | Exact path area | Owner task(s) |
|---|---|---|
| `tool-contracts-source` | `app/types/`, `app/tools/*/metadata.ts`, `tests/unit/tool-metadata.test.ts` | T1 |
| `registry-generation` | `scripts/generate-tool-registry.ts`, `app/data/*generated.ts`, `app/components/ToolPlaceholder.vue`, `tests/unit/generated-registry.test.ts` | T2 |
| `registry-runtime` | `app/data/tool-registry.ts`, `app/data/tool-search.ts`, `app/data/tools.ts`, registry/search unit tests | T3 |
| `scaffolder-tooling` | `scripts/scaffold-tool.ts`, `package.json`, `tests/unit/scaffold-tool.test.ts` | T4 |
| `url-state` | `app/utils/url-state.ts`, URL-state unit test | T5 |
| `shared-ui-primitives` | `app/components/ToolActions.vue`, `ToolState.vue`, `app/utils/browser-actions.ts`, `app/assets/css/main.css`, browser-action test | T6 |
| `tool-composition` | `ToolHeader.vue`, `ToolFooter.vue`, `ToolDualPane.vue`, `ToolFileDrop.vue`, `ToolHost.vue`, `app/utils/error-reporting.ts`, error-reporting test | T7 |
| `route-surface` | `app/data/tool-route.ts`, `app/pages/index.vue`, `app/pages/tools/index.vue`, `app/pages/tools/[slug].vue`, `app/error.vue`, `nuxt.config.ts`, route unit test | T8 |
| `browser-harness` | `playwright.config.ts`, all `tests/e2e/*.pw.ts` and their renames | T9 |
| `roadmap-evidence` | `ROADMAP.md` | T10 |

No two tasks in the same area are marked parallel.

The generator remains in the `registry-generation` area owned by T2. T4 consumes T2's existing configurable `generateToolRegistry(options)` export read-only and does not modify or re-own `scripts/generate-tool-registry.ts`.

## Implementation graph

```text
L0
  T1 tool metadata contracts and four source records
      │ needs current catalog values and no new dependency
      ▼
L1
  T2 deterministic registry/route generator + honest placeholder
      │ needs T1 validator and metadata source
      ▼
L2  [PARALLEL: file-, interface-, area-, and command-disjoint]
  ┌──────────────────────┬──────────────────────┬──────────────────────┐
  │ T3 runtime registry  │ T4 Bun scaffolder     │ T5 URL-state codec    │
  │ app/data + tests     │ scripts + package     │ app/utils + tests     │
  └──────────┬───────────┴──────────┬───────────┴──────────┬───────────┘
             │ generated registry    │ generated metadata    │ independent codec
             └──────────────────────┴──────────────────────┘
                                    ▼
L3
  T6 shared action/state primitives
      │ needs no registry mutation; uses existing theme/PrimeVue contract
      ▼
L4
  T7 header/footer/dual-pane/file-drop/lazy local boundary
      │ consumes ToolState, ToolDefinition loader, and error-reporting contract
      ▼
L5
  T8 registry-backed home/collection/detail routes + SEO/404
      │ consumes generated slugs, search, ToolHost, and route resolver
      ▼
L6
  T9 Bun/Playwright separation + tool/a11y/performance evidence
      │ consumes production build and route surfaces
      ▼
L7
  T10 evidence-gated ROADMAP update
      │ consumes every prior acceptance result
      ▼
terminal review/archive/push handoff
```

**Critical path:** T1 → T2 → T3 → T6 → T7 → T8 → T9 → T10. T4 and T5 are required deliverables but side branches that can run in Wave 2; T4 must still finish before T10 and T5 must pass before T10.

## Task index

| # | Task | Files | Size | Depends-on | Unblocks | Acceptance |
|---|---|---|---|---|---|---|
| T1 | Define metadata contracts and source records | `app/types/tool.ts`, four `app/tools/*/metadata.ts`, metadata test | M | — | T2, T4 | `bun test tests/unit/tool-metadata.test.ts` → `0 fail`; `bunx tsc --noEmit` exit 0 |
| T2 | Generate registry and route manifest | generator, generated files, placeholder, generator test | M | T1 (`app/types/tool.ts`, `app/tools/*/metadata.ts`) | T3, T4, T8 | generator check prints `4 tool definitions, 0 errors`; focused test and typecheck pass |
| T3 | Add runtime registry and search helpers | runtime registry, search, compatibility facade, two tests | M | T2 (`app/data/tool-registry.generated.ts`) | T8 | registry/search tests → `0 fail`; `bun run check` exit 0 |
| T4 | Add Bun tool scaffolder | `scripts/scaffold-tool.ts`, `package.json`, `tests/unit/scaffold-tool.test.ts`; reuses T2's existing generator export | M | T1/T2 (`scripts/generate-tool-registry.ts`) | T10 | smoke test → `0 fail`; generator check and typecheck pass |
| T5 | Add URL-state codec | codec and unit test | S | — | T10 | URL round-trip/error tests → `0 fail`; typecheck passes |
| T6 | Add shared action/state UI | actions, state, browser adapters, CSS, unit test | M | T2 (theme/registry context) | T7, T8 | browser-action test and production build pass |
| T7 | Add tool composition and local boundary | six UI files, error reporter, unit test | L | T6 (`ToolState.vue`, theme tokens) | T8 | error-reporting test, typecheck, and build pass |
| T8 | Wire routes, SEO, generated prerender paths, route errors | route resolver, three pages, `app/error.vue`, `nuxt.config.ts`, route test | L | T3/T7 (`app/data/tool-registry.ts`, `ToolHost.vue`) | T9, T10 | route test/build pass; generated route check is current |
| T9 | Separate runners and add browser/performance proof | Playwright config, three renames, three updated/new E2E files | M | T8 (built routes) | T10 | raw Bun has no E2E collection; Playwright/axe/perf pass |
| T10 | Record Phase 1 evidence in `ROADMAP.md` | `ROADMAP.md` | M | T4 (`scripts/scaffold-tool.ts`), T5 (`app/utils/url-state.ts`), and T9 (`tests/e2e/tool-infrastructure.pw.ts`) | terminal handoff | full CI, 31-line roadmap verification, M1, and Phase 2 immutability pass |

## Detail tasks

### T1 — Define metadata contracts and seed source records `[SEQUENTIAL]`

- **Files:** create `app/types/tool.ts`; create `app/tools/json-formatter/metadata.ts`, `app/tools/password-generator/metadata.ts`, `app/tools/color-picker/metadata.ts`, and `app/tools/text-cleaner/metadata.ts`; create `tests/unit/tool-metadata.test.ts`.
- **Interfaces:** consumes the four current records and their exact values from `app/data/tools.ts:1-80`; produces `ToolCategory`, `AppIconName`, `ToolAccent`, `ToolMetadata`, `ToolComponentPath`, `ToolComponentLoader`, `ToolDefinition`, `Result<T>`, and `validateToolMetadata(value: unknown): Result<ToolMetadata>`. Example: `validateToolMetadata({ slug: "json-formatter", category: "Developer", ... })` returns `{ ok: true, value }`; a bad category returns `{ ok: false, error: { code: "invalid_tool_category", message } }`.
- **Size:** M. **Effort:** M — one small contract plus four type-only source records. **Break:** none; stop before implementation if a fourth record cannot be represented without changing current public values.
- **Steps:**
  - [ ] Write `tests/unit/tool-metadata.test.ts` first: valid records, slug/name/description/category/icon/keywords/component-path failures, and the exact error codes.
  - [ ] Run `bun test tests/unit/tool-metadata.test.ts` and confirm the focused test fails because the contract does not exist.
  - [ ] Implement the types and manual validator in `app/types/tool.ts`; use a discriminated `Result`, not `any`, a schema package, or a thrown validation error.
  - [ ] Copy the four current metadata records without changing names, descriptions, categories, icons, accents, or keywords; set each `componentPath` to `~/components/ToolPlaceholder.vue` for this infrastructure-only catalog.
  - [ ] Add JSDoc with `@example` to every exported function; run `bun run fmt:check && bun run lint && bun run check`.
  - [ ] Commit once as `feat(tools): define tool metadata contracts`.
- **Acceptance:** `bun test tests/unit/tool-metadata.test.ts` → `0 fail`; `bunx tsc --noEmit` → exit 0; `test -f app/types/tool.ts` and `test -f app/tools/json-formatter/metadata.ts` succeed.
- **Risk:** metadata drift from the Phase 0 catalog. Counter with exact-value tests; rollback with `git revert <recorded-wave-1-commit-sha>` if the migration changes a user-visible record.

### T2 — Generate the registry and route manifest `[SEQUENTIAL, depends-on: T1 (file: app/types/tool.ts)]`

- **Files:** create `scripts/generate-tool-registry.ts`, `app/components/ToolPlaceholder.vue`, `app/data/tool-registry.generated.ts`, and `app/data/tool-routes.generated.ts`; create `tests/unit/generated-registry.test.ts`.
- **Interfaces:** consumes T1 `toolMetadata` exports and `validateToolMetadata`; produces `generateToolRegistry(options): Promise<GenerationResult>`, `checkGeneratedRegistry(): Promise<GenerationResult>`, `generatedToolDefinitions`, and `generatedToolSlugs`. Example: `generateToolRegistry({ toolsRoot: "app/tools", registryOutput: "app/data/tool-registry.generated.ts", routesOutput: "app/data/tool-routes.generated.ts" })` returns `{ ok: true, definitionCount: 4, slugs: [...] }`.
- **Size:** M. **Effort:** M — deterministic source discovery, validation, and two generated outputs. **Break:** none; if the generator needs a shared abstraction outside the listed files, stop and split the task rather than expanding it.
- **Steps:**
  - [ ] Write generator contract tests first for sorted discovery, four definitions, lazy loader paths, stable route slugs, duplicate slugs, missing metadata, invalid metadata, and `--check` stale output.
  - [ ] Run `bun test tests/unit/generated-registry.test.ts` and confirm the test fails before the script exists.
  - [ ] Implement the Bun script with `Bun.Glob`/native file APIs, sorted paths, relative type-only imports in source metadata, and stable error codes `no_tool_sources`, `duplicate_tool_slug`, `invalid_tool_metadata`, and `registry_generation_failed`.
  - [ ] Emit only deterministic TypeScript: the registry contains typed `loadComponent: () => import("~/components/ToolPlaceholder.vue")`; the route manifest contains only sorted slug strings and no Vue imports.
  - [ ] Add `ToolPlaceholder.vue` as an honest, keyboard-readable empty state using semantic classes and existing theme tokens; it must not contain product input, fake output, or a fake success claim.
  - [ ] Run the generator, `bun run scripts/generate-tool-registry.ts -- --check`, focused tests, formatter, linter, and typecheck; commit once as `feat(tools): generate source-backed registry`.
- **Acceptance:** `bun run scripts/generate-tool-registry.ts -- --check` → `4 tool definitions, 0 errors`; `bun test tests/unit/generated-registry.test.ts` → `0 fail`; `bunx tsc --noEmit` → exit 0; generated files are byte-stable across two consecutive runs.
- **Risk:** generator imports aliases or a cycle with `app/data/tools.ts`. Keep the generator dependent only on source metadata/types and rollback with `git revert <recorded-wave-1-commit-sha>` if the cycle appears.

### T3 — Add the runtime registry and search helpers `[PARALLEL]`

- **Files:** create `app/data/tool-registry.ts`, create `app/data/tool-search.ts`, modify `app/data/tools.ts`, create `tests/unit/tool-registry.test.ts`, create `tests/unit/tool-search.test.ts`.
- **Interfaces:** consumes T1 `ToolDefinition`/`ToolMetadata` and T2 generated definitions; produces `createToolRegistry(initial?: readonly ToolDefinition[]): ToolRegistryApi`, `ToolRegistryApi.register/get/list`, `filterTools(definitions, { query, category })`, and the existing-compatible `tools`, `findTool`, `toolCategories`, and `Tool` exports. Example: `createToolRegistry([definition]).get("json-formatter")?.name` → `"JSON formatter"`; `register` with the same slug throws/returns the documented `duplicate_tool_slug` error; `get("missing")` → `undefined`.
- **Size:** M. **Effort:** M — a small runtime API, a pure search function, and a compatibility facade. **Break:** none.
- **Steps:**
  - [ ] Write registry tests first for register/get/list, duplicate registration, invalid definition, unknown lookup, stable list order, and returned-list immutability.
  - [ ] Write search tests first for case-insensitive name/description/category/keyword matching, `All`, unknown category, whitespace query, and a 1,000-record scale case.
  - [ ] Run both focused tests and confirm the expected red state.
  - [ ] Implement manual runtime validation, `ToolRegistryError` with stable `code`/`details`, readonly `list()`, and a pure non-mutating `filterTools` helper.
  - [ ] Convert `app/data/tools.ts` into a compatibility facade over the generated definitions; preserve current export names and values so Phase 0 consumers do not fork the catalog.
  - [ ] Run `bun test tests/unit/tool-registry.test.ts tests/unit/tool-search.test.ts && bun run fmt:check && bun run lint && bun run check`; commit once as `feat(tools): add runtime registry and search`.
- **Acceptance:** the two focused test files report `0 fail`; `bun run check` exits 0; a test registering a duplicate slug observes `duplicate_tool_slug`; a test registering 1,000 records and filtering each category/query returns deterministic results.
- **Risk:** compatibility facade accidentally creates a second mutable catalog. Keep `tools.ts` as a read-only view and rollback with `git revert <recorded-wave-2-commit-sha>` on any duplicate source of truth.

### T4 — Add the Bun tool scaffolder `[PARALLEL]`

- **Files:** create `scripts/scaffold-tool.ts`; modify `package.json`; create `tests/unit/scaffold-tool.test.ts`; reuse T2's existing configurable `generateToolRegistry(options)` export from `scripts/generate-tool-registry.ts` without modifying that file.
- **Interfaces:** consumes T1 `validateToolMetadata` and T2's existing configurable `generateToolRegistry(options)`; produces `parseScaffoldArgs(argv: readonly string[]): Result<ScaffoldArgs>`, `scaffoldTool(args, environment?): Promise<Result<ScaffoldResult>>`, and package commands `generate:registry` and `scaffold:tool`. Example: `parseScaffoldArgs(["--slug","word-count","--name","Word count","--description","Count words locally.","--category","Text","--keywords","words,count"])` returns `{ ok: true, value: { slug: "word-count", name: "Word count", ... } }`; an existing destination returns `existing_tool`.
- **Size:** M. **Effort:** M — CLI parsing, safe file creation, and five deterministic stubs. **Break:** none.
- **Steps:**
  - [ ] Write the CLI/smoke test first: argument parsing, slug format, required name/description/category, comma-separated keywords, no overwrite, safe temporary output root, exact five generated files, and stable error codes.
  - [ ] Run `bun test tests/unit/scaffold-tool.test.ts` and confirm the red state.
  - [ ] Implement the CLI with native `node:path`/`node:fs/promises`; accept `--out-root` for isolated tests; never interpolate shell commands; use `JSON.stringify` for generated string values.
  - [ ] Generate exactly `metadata.ts`, `logic.ts`, `schema.ts`, `ToolComponent.vue`, and `logic.test.ts` under `app/tools/<slug>/`. The logic is an empty-state contract stub, the schema is a manual `Result` parser, and the component/test contain no Phase 2 algorithm.
  - [ ] Add `generate:registry` and `scaffold:tool` scripts to `package.json` without changing dependencies; reuse T2's existing configurable `generateToolRegistry(options)` against a temporary root in the smoke test and run the default registry check separately; do not modify `scripts/generate-tool-registry.ts`.
  - [ ] Run formatter, linter, typecheck, smoke test, and generator check; commit only `scripts/scaffold-tool.ts`, `package.json`, and `tests/unit/scaffold-tool.test.ts` once as `feat(tools): add bun tool scaffolder`.
- **Acceptance:** `bun test tests/unit/scaffold-tool.test.ts` → `0 fail`; `bun run generate:registry -- --check` → `4 tool definitions, 0 errors`; `bunx tsc --noEmit` → exit 0; the smoke test proves five files exist in a temp directory and no repository file is overwritten.
- **Risk:** path traversal or destructive overwrite. Validate slug and resolved destination, use `mkdir`/`writeFile` with exclusive creation, and rollback with `git revert <recorded-wave-2-commit-sha>` before allowing the CLI to be used outside tests.

### T5 — Implement the URL-state codec `[PARALLEL]`

- **Files:** create `app/utils/url-state.ts`; create `tests/unit/url-state.test.ts`.
- **Interfaces:** consumes only an optional `UrlState` object supplied by a future tool; produces `URL_STATE_MAX_BYTES = 4096`, `UrlState`, `UrlStateResult<T>`, `encodeUrlState(state): UrlStateResult<string>`, and `decodeUrlState(value: string | null | undefined): UrlStateResult<UrlState>`. Example: `encodeUrlState({ text: "héllo", count: 2 })` → `{ ok: true, value: "v1...." }`; an encoded value above 4 KiB → `{ ok: false, error: { code: "url_state_too_large", message } }` and no truncated output.
- **Size:** S. **Effort:** S — one pure codec and focused edge cases. **Break:** none.
- **Steps:**
  - [ ] Write tests first for absent/empty state, primitive-value allowlist, UTF-8 round-trip, stable key order, invalid prefix, malformed base64url, invalid JSON, wrong value types, and exact-size/over-size behavior.
  - [ ] Run `bun test tests/unit/url-state.test.ts` and confirm the focused test fails before implementation.
  - [ ] Implement deterministic JSON, `v1.` versioning, base64url conversion, and UTF-8 encode/decode with native APIs; return typed errors and never throw for untrusted input.
  - [ ] Add JSDoc examples to exported functions; do not read/write `window`, route queries, local storage, analytics, or the network in this utility.
  - [ ] Run `bun run fmt:check && bun run lint && bun run check`; commit once as `feat(tools): add validated url state codec`.
- **Acceptance:** `bun test tests/unit/url-state.test.ts` → `0 fail`; `bunx tsc --noEmit` → exit 0; a test proves an oversized payload returns `url_state_too_large` without a shortened value and an absent value returns an empty state.
- **Risk:** browser/Bun base64 differences or accidental secret logging. Use only deterministic local transforms, test Unicode, and rollback with `git revert <recorded-wave-2-commit-sha>` if any network/storage side effect appears.

### T6 — Add shared action and state UI primitives `[SEQUENTIAL, depends-on: baseline files app/theme/aura-blue.ts and app/assets/css/main.css; no task file dependency]`

- **Files:** create `app/utils/browser-actions.ts`, `app/components/ToolActions.vue`, and `app/components/ToolState.vue`; create `tests/unit/browser-actions.test.ts`; modify `app/assets/css/main.css`.
- **Interfaces:** consumes the existing Aura/CSS token layer and native browser APIs; produces `copyText(value, clipboard): Promise<void>`, `downloadText(value, filename, environment?): void`, `BrowserActionError` with `clipboard_unavailable`/`download_unavailable`/`invalid_filename`, `ToolActions` props `value`/`filename`/`disabled` and copy/download events, and `ToolState` props `kind` (`empty|error|loading|success|offline|update`), `title`, `message`, and optional action label. Example: `copyText("hello", fakeClipboard)` resolves after `writeText("hello")`; a missing clipboard produces an actionable error code.
- **Size:** M. **Effort:** M — two thin components, a small native adapter, and token-based styles. **Break:** none.
- **Steps:**
  - [ ] Write browser-action tests first for successful copy, rejected clipboard, invalid filename, and no-throw error normalization.
  - [ ] Implement the native adapter with `Blob`, `URL.createObjectURL`, `URL.revokeObjectURL`, and clipboard availability checks; sanitize download filenames without adding a path library.
  - [ ] Build `ToolActions.vue` with PrimeVue `Button`, verb-first labels, `aria-label`/`aria-live`, disabled state, and explicit success/error copy; build `ToolState.vue` with semantic section/heading, live-region behavior, and an optional PrimeVue action.
  - [ ] Add only semantic CSS classes to `main.css`, using existing `--pt-*`, `--radius-*`, spacing, and PrimeVue token surfaces; do not put raw color, spacing, or radius literals in either Vue file.
  - [ ] Run the Design read and preflight section, focused tests, formatter, linter, typecheck, and `bun run build`; commit once as `feat(ui): add shared tool action and state primitives`.
- **Acceptance:** `bun test tests/unit/browser-actions.test.ts` → `0 fail`; `bun run check` and `bun run build` exit 0; a changed-Vue-file scan finds no raw hex/style literals; the rendered buttons have 44px targets, visible focus, accessible names, and no emoji icons.
- **Risk:** clipboard permissions or object-URL leaks. Use one-shot native calls, revoke URLs in `finally`, expose actionable failure copy, and rollback with `git revert <recorded-wave-3-commit-sha>`.

### T7 — Compose tool layout, file patterns, and the local error boundary `[SEQUENTIAL, depends-on: T6 (file: app/components/ToolState.vue)]`

- **Files:** create `app/components/ToolHeader.vue`, `app/components/ToolFooter.vue`, `app/components/ToolDualPane.vue`, `app/components/ToolFileDrop.vue`, `app/components/ToolHost.vue`, and `app/utils/error-reporting.ts`; create `tests/unit/error-reporting.test.ts`.
- **Interfaces:** consumes T2 `ToolDefinition.loadComponent`, T6 `ToolState`, `AppIcon`, and `NuxtErrorBoundary`; produces `ToolHeader`/`ToolFooter` metadata composition, `ToolDualPane` named slots, `ToolFileDrop` file events, `ToolHost(tool)` with retryable local failure UI, and `reportLocalError(error, context): void` with stable `tool_component_load_failed`/`tool_component_render_failed` codes. Example: a rejected `tool.loadComponent` renders `ToolState kind="error"` and a retry action without unmounting `AppHeader`/`AppFooter`.
- **Size:** L. **Effort:** L — six small UI/error surfaces around a critical async boundary. **Break:** if a component requires a second global state system or more than seven touched files, stop and split before adding it.
- **Steps:**
  - [ ] Write the error-normalization test first for unknown errors, loader errors, render errors, and development-only reporting that never throws.
  - [ ] Implement `error-reporting.ts` with a typed context and no production logging; it must not serialize component props or user input.
  - [ ] Build `ToolHeader` and `ToolFooter` from metadata and the existing shell; keep privacy/offline language truthful.
  - [ ] Build `ToolDualPane` with explicit `input`/`output` slots, responsive single-column collapse below 768px, and no fixed-height editor assumptions.
  - [ ] Build `ToolFileDrop` with a real file input/label, keyboard activation, drag/drop events, accepted file filtering, 44px controls, and local-only file handling; it emits `File[]` and does not upload.
  - [ ] Build `ToolHost` with `defineAsyncComponent`, `NuxtErrorBoundary`, `clearError`, a retry attempt counter, and a local `ToolState` error. Do not use `window.onerror` or a global error handler.
  - [ ] Run the Design read and preflight section, `bun test tests/unit/error-reporting.test.ts`, formatter, linter, `bun run check`, and `bun run build`; commit once as `feat(ui): add tool composition and local error boundary`.
- **Acceptance:** `bun test tests/unit/error-reporting.test.ts` → `0 fail`; `bun run check` and `bun run build` exit 0; source inspection proves `ToolHost` uses `NuxtErrorBoundary` and `loadComponent`; a browser test later proves the shell remains present during a rejected loader.
- **Risk:** async component errors escape the local boundary or hydration changes the page. Keep the boundary inside the tool host, preserve shell layout, and rollback with `git revert <recorded-wave-4-commit-sha>` if route-level errors become silent.

### T8 — Wire registry-backed routes, SEO, prerendering, and route errors `[SEQUENTIAL, depends-on: T3 and T7]`

- **Files:** create `app/data/tool-route.ts`; modify `app/pages/index.vue`, `app/pages/tools/index.vue`, and `app/pages/tools/[slug].vue`; create `app/error.vue`; modify `nuxt.config.ts`; create `tests/unit/tool-route.test.ts`.
- **Interfaces:** consumes T2 `generatedToolDefinitions`/`generatedToolSlugs`, T3 `createToolRegistry`/`filterTools`, T7 `ToolHost`/header/footer, and Nuxt `useRoute`, `useSeoMeta`, and `createError`; produces `resolveToolRoute(slug, definitions): Result<ToolDefinition>`, a 404 route error with `code: "tool_not_found"`, registry-backed `/tools` and `/tools/[slug]`, dynamic title/description metadata, and generated prerender routes. Example: `resolveToolRoute("missing", tools)` → `{ ok: false, error: { code: "tool_not_found", statusCode: 404, message: "Tool not found" } }`.
- **Size:** L. **Effort:** L — shared route behavior, SEO/error pages, and generated config wiring. **Break:** none; keep the pure resolver separate from the page so the route contract remains testable.
- **Steps:**
  - [ ] Write `tests/unit/tool-route.test.ts` first for known slugs, unknown slugs, exact 404 status/code/message, and no mutation of the registry input.
  - [ ] Run the route test and confirm the red state.
  - [ ] Implement `resolveToolRoute` with explicit string-slug normalization and the stable not-found result.
  - [ ] Refactor home and `/tools` to use `filterTools` and registry categories; preserve the existing favorites/recent views and empty/filter copy without adding Phase 3 behavior.
  - [ ] Refactor `/tools/[slug]` to call the resolver, throw `createError` only for the typed not-found result, set safe `useSeoMeta` title/description, mark recent after mount, and compose `ToolHeader`, `ToolHost`, and `ToolFooter`.
  - [ ] Create `app/error.vue` with a shell-preserving 404 heading/copy and a verb-first “Browse tools” action; other errors show a concise retry/back action and never render a stack.
  - [ ] Replace the four hardcoded detail entries in `nuxt.config.ts` with `generatedToolSlugs.map(...)` while preserving existing PWA/security settings and `"/"`/`"/tools"` prerender entries.
  - [ ] Run `bun test tests/unit/tool-route.test.ts tests/unit/tool-registry.test.ts tests/unit/tool-search.test.ts && bun run generate:registry -- --check && bun run check && bun run build && bun run test`; commit once as `feat(routes): add registry-backed tool routes`.
- **Acceptance:** route/unit tests report `0 fail`; `bun run build` exits 0; `.output/public/tools/json-formatter/index.html` exists; the generated route check is current; source inspection finds no hardcoded detail slug list in `nuxt.config.ts` and no user/query value in SEO metadata.
- **Risk:** changing the existing collection shell or prerender behavior. Keep the Phase 0 composition, run the existing unit suite, and rollback with `git revert <recorded-wave-5-commit-sha>` if PWA or search behavior regresses.

### T9 — Separate Bun and Playwright and add Phase 1 browser evidence `[SEQUENTIAL, depends-on: T8]`

- **Files:** modify `playwright.config.ts`; rename `tests/e2e/shell.spec.ts` to `tests/e2e/shell.pw.ts`; rename `tests/e2e/accessibility.spec.ts` to `tests/e2e/accessibility.pw.ts`; rename `tests/e2e/pwa.spec.ts` to `tests/e2e/pwa.pw.ts`; create `tests/e2e/tool-infrastructure.pw.ts`; modify the renamed shell/accessibility files as needed.
- **Interfaces:** consumes the built route surface from T8 and existing `@playwright/test`/`@axe-core/playwright`; produces a Playwright-only `*.pw.ts` test set, a raw-Bun-safe unit test boundary, tool collection/detail/404 smoke coverage, detail-route axe coverage, and transfer-size performance assertions. Example: `bun test --list` lists unit files only, while `playwright test` discovers every `*.pw.ts` file.
- **Size:** M. **Effort:** M — three file moves, one config filter, and focused browser assertions. **Break:** none.
- **Steps:**
  - [ ] Add failing tool-infrastructure tests for collection search/category at 375px, lazy detail rendering, a useful unknown-slug 404, keyboard focus, reduced motion, and the local state/error surface.
  - [ ] Update the accessibility test to include `/tools/json-formatter` and retain zero critical/serious axe violations and 44px checks for the new route.
  - [ ] Add a performance test on `/` that sums initial JavaScript `transferSize` (falling back to `encodedBodySize` when transfer is zero) and asserts `<= 120 * 1024`, and CSS `<= 30 * 1024`; it must not count later lazy tool chunks as initial work.
  - [ ] Change the evidence directory in `shell.pw.ts` to `.mugiwara/missions/pockettools-phase1-core-infrastructure/evidence`, create it from the test when needed, and keep light/dark 375/768/1440 screenshots.
  - [ ] Rename the three Playwright files and set `playwright.config.ts` `testMatch: "**/*.pw.ts"`; do not change the dependency set or CI step order.
  - [ ] Run the Design read and preflight section, `bun test --list`, `bun run test`, `bun run test:e2e`, and the focused performance test; commit once as `test(ui): separate bun and browser harnesses`.
- **Acceptance:** `bun test --list` exits 0 and contains no `tests/e2e/`; `bun run test` reports `0 fail`; `bun run test:e2e` reports all Playwright tests passed; axe reports zero critical/serious violations; JS/CSS budget assertions pass; a source check confirms the `ci:local` command order is unchanged.
- **Risk:** renaming breaks CI or the evidence path. Update the config in the same commit, run both runners, and rollback with `git revert <recorded-wave-6-commit-sha>` if Playwright discovery changes.

### T10 — Record Phase 1 evidence in `ROADMAP.md` `[SEQUENTIAL, depends-on: T4 (file: scripts/scaffold-tool.ts), T5 (file: app/utils/url-state.ts), and T9 (file: tests/e2e/tool-infrastructure.pw.ts)]`

- **Files:** modify `ROADMAP.md` only. Do not touch any other documentation, source, tests, config, dependencies, generated output, or any Phase 2+ section.
- **Interfaces:** consumes every T1–T9 command result, generated-file check, browser screenshots, axe result, and performance result; produces checked Phase 1 evidence, `[x]` M1, and the current-delivery/next-review/related-mission metadata inside `ROADMAP.md`. Evidence is matched to the original base-commit checkbox text and order; no roadmap ID is added. Example: `- [x] Define tool metadata and typed tool contracts. — evidence: T1, app/types/tool.ts; bun test tests/unit/tool-metadata.test.ts`.
- **Size:** M. **Effort:** M — evidence mapping and one-file roadmap synchronization, not implementation. **Break:** none; if evidence is missing, leave the corresponding line unchecked and return to its owning task.
- **Steps:**
  - [ ] Before changing `ROADMAP.md`, run the Bun-only **read-only roadmap validation** diagnostic against the base-order verifier; it must not write files and must report exactly `base=31, current=31, expected failures=[unchecked=31, evidence=31, M1 unchecked], later-slice=unchanged`. The strict verifier is expected to fail in this pre-update state.
  - [ ] Run the complete final evidence set: `bun test`, `bun run fmt:check`, `bun run lint`, `bun run check`, `bun run test:coverage`, `bun run audit`, `bun run build`, and `bun run test:e2e`.
  - [ ] Read the 31 original Phase 1 checkbox lines from base commit `cbd3f2044aa6a93377a78953cb33de04592560e7`; update the corresponding current lines in the same order, changing only `[ ]` to `[x]` and appending one concise `evidence: Tn, <path/command>` reference after the original text.
  - [ ] Change the M1 row to `[x]` and append its concise evidence reference; update only the current-delivery, next-review, and related-mission metadata in `ROADMAP.md`.
  - [ ] Leave the Phase 2-through-before-`## Milestones` slice byte-identical to the base commit. Do not introduce roadmap IDs, comments, or numbering not present in the base.
  - [ ] After the update, run the Bun-only **final roadmap verification** below as the strict post-update gate, then `bun run ci:local`; commit once as `chore(phase-1): record infrastructure delivery evidence`.
- **Acceptance:** `bun run ci:local` exits 0 with `0 fail`, all Playwright tests passing, zero critical/serious axe violations, and JS/CSS budgets passing. The following copy-paste command exits 0:

```sh
bun -e '
const baseSha = "cbd3f2044aa6a93377a78953cb33de04592560e7";
const current = await Bun.file("ROADMAP.md").text();
const baseProcess = Bun.spawn(["git", "show", `${baseSha}:ROADMAP.md`]);
const base = await new Response(baseProcess.stdout).text();
const baseError = await new Response(baseProcess.stderr).text();
const baseExit = await baseProcess.exited;
if (baseExit !== 0) throw new Error(baseError);
const section = (text, start, end) => {
  const from = text.indexOf(start);
  if (from < 0) throw new Error(`missing ${start}`);
  const to = text.indexOf(end, from + start.length);
  if (to < 0) throw new Error(`missing ${end}`);
  return text.slice(from, to);
};
const isCheckbox = (line) => /^- \[[ x~!]\] /.test(line);
const basePhase1 = section(base, "## PHASE 1", "## PHASE 2").split("\n").filter(isCheckbox);
const currentPhase1 = section(current, "## PHASE 1", "## PHASE 2").split("\n").filter(isCheckbox);
if (basePhase1.length !== 31 || currentPhase1.length !== 31) throw new Error(`expected 31 Phase 1 checkboxes, got base=${basePhase1.length}, current=${currentPhase1.length}`);
for (let index = 0; index < 31; index += 1) {
  const original = basePhase1[index].replace(/^- \[[ x~!]\] /, "");
  const actual = currentPhase1[index];
  const prefix = `- [x] ${original} — evidence: `;
  if (!actual.startsWith(prefix)) throw new Error(`unchecked or mismatched Phase 1 line ${index + 1}: ${original}`);
  const evidence = actual.slice(prefix.length);
  if (!/^T\d+,[^\n]{1,240}$/.test(evidence)) throw new Error(`missing concise evidence on Phase 1 line ${index + 1}`);
}
const m1 = current.split("\n").find((line) => /^\| M1\s+\|/.test(line));
if (!m1 || !m1.includes("`[x]`")) throw new Error("M1 is not checked");
const phase2 = (text) => section(text, "## PHASE 2", "## Milestones");
const sameBytes = (left, right) => {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
};
if (!sameBytes(phase2(current), phase2(base))) throw new Error("Phase 2 through before Milestones changed");
console.log("roadmap verification: 31/31 Phase 1 checkboxes, M1 checked, later slice unchanged");
'
```

- **Risk:** checking a roadmap line without evidence or changing a later phase. The Bun verifier matches base text/order, requires one bounded evidence reference, checks M1, and byte-compares the protected slice; rollback with `git revert <T10-commit-sha>` rather than weakening the check.

## Roadmap-evidence traceability matrix

Every Phase 1 checkbox is mapped below. The first column is a planning location, not a visible roadmap ID. “Current evidence” describes the repository at planning time; the task column is the concrete missing or extension work.

| Roadmap location | Roadmap check | Current evidence | Planned task and proof |
|---|---|---|---|
| §1.1 / checkbox 1 | Define tool metadata and typed tool contracts. | Partial: `app/data/tools.ts:1-37` has fields/types but no shared contract or validator. | T1: `app/types/tool.ts` and `tests/unit/tool-metadata.test.ts`. |
| §1.1 / checkbox 2 | Add registry register/get/list behavior. | Missing: `findTool` at `app/data/tools.ts:78-80` only searches an array. | T3: `app/data/tool-registry.ts` and registry unit tests. |
| §1.1 / checkbox 3 | Add lazy Vue component loading. | Missing: detail route renders a static card at `app/pages/tools/[slug].vue:27-37`. | T2/T7/T8: generated loaders, `ToolHost`, and detail browser smoke. |
| §1.1 / checkbox 4 | Add category and search metadata. | Partial: categories/keywords exist and inline filtering is at `app/pages/tools/index.vue:19-32`. | T1/T3: shared metadata plus 1,000-record pure search test. |
| §1.1 / checkbox 5 | Generate the registry from source metadata. | Missing: `scripts/` is empty and no generated registry exists. | T2/T4: deterministic generator/check and scaffolder integration. |
| §1.2 / checkbox 1 | Add a Bun scaffolder command. | Missing. | T4: `scaffold:tool` CLI and parser tests. |
| §1.2 / checkbox 2 | Generate one folder per tool. | Missing: no `app/tools/` exists. | T1 seeds four metadata folders; T4 writes five files per new folder. |
| §1.2 / checkbox 3 | Generate pure logic, schema, component, and test stubs. | Missing. | T4: exact `logic.ts`, `schema.ts`, `ToolComponent.vue`, `logic.test.ts` output. |
| §1.2 / checkbox 4 | Add generator validation and a scaffold smoke test. | Partial: only `tests/unit/tools.test.ts` exists. | T2/T4: invalid-source tests, no-overwrite test, temp-root smoke. |
| §1.3 / checkbox 1 | Add `/tools` collection route. | Present but hardcoded: `app/pages/tools/index.vue:1-192`. | T3/T8: registry/search helper and browser collection test. |
| §1.3 / checkbox 2 | Add `/tools/[slug]` route. | Present but static: `app/pages/tools/[slug].vue:1-43`. | T8: resolver, metadata, and lazy host. |
| §1.3 / checkbox 3 | Add SEO-safe metadata and error state. | Partial: only global metadata in `nuxt.config.ts:137-145`; no page-level tool metadata. | T8: `useSeoMeta` and `app/error.vue` route test. |
| §1.3 / checkbox 4 | Verify unknown tools produce a useful 404. | Partial: current page throws at `[slug].vue:7-9`; no Phase 1 error UI assertion. | T8/T9: `tool_not_found` contract and Playwright 404 test. |
| §1.3 / checkbox 5 | Verify search and category filters scale with many records. | Partial: inline filter has no scale assertion. | T3/T9: 1,000-record unit case and browser filter smoke. |
| §1.4 / checkbox 1 | Add shared copy/download action component. | Missing. | T6: `ToolActions.vue`, native adapter, unit test. |
| §1.4 / checkbox 2 | Add shared empty/error/loading state components. | Partial: local empty/offline markup exists, but no shared component contract. | T6: `ToolState.vue` with all required variants. |
| §1.4 / checkbox 3 | Add tool header/footer composition. | Partial: detail has an inline card and existing shell header/footer. | T7/T8: reusable `ToolHeader`/`ToolFooter` used by the route. |
| §1.4 / checkbox 4 | Add dual-pane and file-drop patterns for future tools. | Missing. | T7: `ToolDualPane.vue` and `ToolFileDrop.vue`. |
| §1.4 / checkbox 5 | Use PrimeVue components and project tokens only. | Present baseline: `nuxt.config.ts:40-52`, `app/theme/aura-blue.ts`, `main.css`; new UI is not covered. | T6/T7/T9: token scan, PrimeVue build, axe and responsive evidence. |
| §1.5 / checkbox 1 | Keep pure logic under `bun test`. | Partial: `package.json:16-17` scopes the script, but raw `bun test` collects Playwright and fails. | T3/T4/T5/T9: unit contracts plus `*.pw.ts` separation. |
| §1.5 / checkbox 2 | Add Playwright shell/tool smoke coverage. | Partial: shell specs exist; no tool infrastructure route suite. | T9: `tool-infrastructure.pw.ts` and renamed shell suite. |
| §1.5 / checkbox 3 | Add axe accessibility coverage. | Partial: `/` and `/tools` are covered at `tests/e2e/accessibility.spec.ts:4-40`. | T9: add `/tools/json-formatter` and route error checks. |
| §1.5 / checkbox 4 | Add performance budget checks. | Partial: `PLAN.md:377-384` defines budgets; no executable Phase 1 assertion. | T9: transfer-size JS/CSS assertions with exact thresholds. |
| §1.5 / checkbox 5 | Add CI test/build order. | Present baseline: `package.json:20` and `.github/workflows/ci.yml:23-25`. | T9/T10: verify the order remains literal; no dependency/config weakening. |
| §1.6 / checkbox 1 | Add validated URL-state encoding. | Missing. | T5: versioned native codec and tests. |
| §1.6 / checkbox 2 | Define size limits and clear overflow behavior. | Missing. | T5: 4 KiB limit, typed overflow error, no truncation test. |
| §1.6 / checkbox 3 | Add round-trip tests. | Missing. | T5: primitive/Unicode/stable-order round-trip tests. |
| §1.6 / checkbox 4 | Keep URL state optional and privacy-safe. | Missing; current routes do not write query state. | T5/T8: absent state is `{}`, no storage/network side effect, route leaves state untouched. |
| §1.7 / checkbox 1 | Add local error boundary/logging conventions. | Missing: no `NuxtErrorBoundary`; existing PWA status is unrelated. | T7: `ToolHost` boundary and typed dev-only reporter. |
| §1.7 / checkbox 2 | Add actionable error copy patterns. | Partial: offline/unknown-route copy exists, but no runtime component failure copy. | T6/T7: `ToolState` messages and retry action. |
| §1.7 / checkbox 3 | Keep failures visible without breaking the shell. | Partial: route throws 404, but no local retry/shell-preservation proof. | T7/T8/T9: boundary, route error page, browser smoke. |
| Milestone M1 | Registry, routing, shared components, test harness. | Partial: Phase 0 has catalog/routes/tests but no registry, shared tool components, or runner separation. | T1–T10; T10 checks M1 only after the full evidence set. |

## User-acceptance bridge

The mission has no separate user-authored executable test source. The declarative acceptance in `spec.md` is translated into the project test files and literal commands below; it is not treated as an instruction to skip or edit tests.

| Spec acceptance | Per-task executable criteria |
|---|---|
| 1. Metadata/typed registry/loaders/categories/search/generated output | T1–T3 focused unit tests, T2 generator check, T8 build, T9 route smoke. |
| 2. Bun scaffolder creates folder/stubs and validation/smoke pass | T4 `scaffold-tool.test.ts` and temporary-root output assertions. |
| 3. Collection/detail metadata/error/404/search/category behavior | T3 scale test, T8 route test/build, T9 Playwright collection/detail/404 tests. |
| 4. Shared actions/states/header/footer/dual-pane/file-drop with PrimeVue/tokens | T6/T7 type/build/token checks, T9 axe/375px/keyboard evidence. |
| 5. Bun/Playwright/axe/performance/CI harness | T9 raw-Bun, Playwright, axe, budget, and CI-order checks. |
| 6. Optional validated privacy-safe bounded URL state | T5 round-trip/error/size tests. |
| 7. Local boundary/actionable copy/no shell break | T7 error contract, T8 route error, T9 browser shell-preservation test. |
| 8. Full CI and Phase 1 browser/a11y/performance evidence | T9 focused evidence and T10 `bun run ci:local`. |
| 9. Phase 1/M1 checked only with evidence; later phases unchanged | T10 uses the Bun base-order verifier and the Phase 2+ base comparison. |
| 10. Archive/push obligations, no PR/merge/deploy | T10 leaves terminal obligations for the closure handoff; the branch is not pushed during planning. |

## Anti-pattern guards

- **Duplicate catalogs:** `app/data/tools.ts` is a compatibility view only; the generator check and T3 tests fail if a second mutable list appears.
- **Hand-edited generated data:** `--check` is a required wave gate; generated files are never edited to make a route pass.
- **Hardcoded route drift:** `nuxt.config.ts` consumes `generatedToolSlugs`; T8 source inspection rejects a returned four-slug literal.
- **Schema/dependency inflation:** manual validation and `Result` unions are the Phase 1 boundary; no `zod` or unmeasured package is allowed.
- **Phase leakage:** metadata-only records and a truthful placeholder are the maximum tool body in this mission; T10’s scope diff rejects Phase 2+ implementation.
- **Silent async failure:** `ToolHost` must render `ToolState kind="error"` with retry and keep the shell mounted; no `catch` that only logs.
- **Unsafe URL state:** oversized/invalid state returns a typed error and is never truncated, persisted, or transmitted.
- **UI slop:** no raw style literals in Vue, no fixed sidebar, no decorative assets, no fake output/dashboard, and every new composition gets the design preflight.
- **Runner collision:** `*.spec.ts` is reserved for no Playwright files; Playwright uses `*.pw.ts`, and both `bun test` and `playwright test` must pass.
- **Uncheckable evidence:** every task has a literal command/result; a failed command returns to its task rather than being documented as complete.
- **Unsafe parallelism:** only T3/T4/T5 carry `[PARALLEL]`, and the wave header states the file/interface/area/command proof.
- **Terminal overreach:** no commit, push, PR, merge, deploy, or force-push is performed during planning or by this plan outside the explicit closure obligation.

## Risk and rollback

| Risk | Likelihood/impact | Countermeasure | Rollback |
|---|---|---|---|
| Generated registry imports the wrong module or creates a cycle | M/H | T2 imports source metadata/types only, emits stable relative output, and runs `--check` before any route work. | `git revert <recorded-wave-1-commit-sha>` |
| Lazy component rejects during SSR/hydration | M/H | `ToolHost` uses `NuxtErrorBoundary`, a retry attempt, and a local error state; T9 preserves the shell. | `git revert <recorded-wave-4-commit-sha>` or `git revert <recorded-wave-5-commit-sha>` |
| Scaffolder overwrites or escapes the tool directory | M/H | Strict slug/path validation, exclusive writes, `--out-root` tests, and no shell interpolation. | `git revert <recorded-wave-2-commit-sha>` |
| URL codec leaks data or truncates oversized state | L/H | Primitive allowlist, 4 KiB boundary, local-only transforms, no logging/storage/network, exact error tests. | `git revert <recorded-wave-2-commit-sha>` |
| Shared UI becomes generic/admin or inaccessible | M/H | Design read/preflight, existing Aura tokens, one radius language, 375px/keyboard/focus/axe checks, no sidebar. | `git revert <recorded-wave-3-commit-sha>` or `git revert <recorded-wave-4-commit-sha>` |
| New components increase initial JS or CSS beyond budget | M/H | Thin components, no new dependency, T9 transfer-size assertions against 120 KiB JS/30 KiB CSS. | `git revert <recorded-wave-6-commit-sha>` |
| Raw Bun still collects Playwright specs | M/M | Rename all three E2E files and set `testMatch: "**/*.pw.ts"`; gate `bun test --list`. | `git revert <recorded-wave-6-commit-sha>` |
| Roadmap is checked before evidence or Phase 2+ changes | M/H | T10 runs the complete evidence set and the Bun verifier compares the protected slice to the recorded base SHA. | `git revert <recorded-wave-7-commit-sha>`; leave lines unchecked until repaired |

The executor records each wave's last green task commit SHA in mission flow evidence after its gate. A failed wave is rolled back with `git revert <recorded-wave-commit-sha>` or fixed forward and reverified; no auxiliary refs are created.

## Definition of Done

The mission is done only when all five axes are green:

- **Correctness:** all 31 Phase 1 acceptance checks and M1 have command/file evidence; registry, scaffolder, routes, lazy loading, shared UI, URL state, and local errors meet their task contracts.
- **Quality:** `bun run fmt:check`, `bun run lint`, `bun run check`, raw `bun test`, `bun run test`, and `bun run test:coverage` pass with no weakened config.
- **Integration:** `bun run build` passes, generated files are current, all prerender routes build, and Phase 0 search/PWA/privacy/theme behavior remains green.
- **Docs:** `ROADMAP.md` evidence describes the actual infrastructure delivery; no product tool or later phase is claimed. No other documentation file is in this mission's change set.
- **Ship-readiness:** `.mugiwara/missions/pockettools-phase1-core-infrastructure/blockers.md` has no open data rows, `bun audit` passes, browser/axe/performance evidence is retained under the mission evidence directory, and no blocker is hidden in prose.

Required final evidence includes:

```sh
bun test
bun run fmt:check
bun run lint
bun run check
bun run test:coverage
bun run audit
bun run build
bun run test:e2e
bun run ci:local
```

The final full gate must report zero failed unit tests, zero failed Playwright tests, zero critical/serious axe violations, passing JS/CSS budgets, and a successful generator check. Lighthouse's Phase 0 landing evidence remains historical; Phase 1 adds the executable resource-transfer budget without claiming a new Lighthouse score unless separately run and recorded.

## Pre-mortem

Assuming this mission failed, the most likely cause is a polished-looking tool surface whose registry, prerender routes, and generated files silently drift, while the raw Bun command continues to execute Playwright code and the four catalog entries are mistaken for Phase 2 product tools. T1/T2 make the source and error contracts checkable, T3 makes registration/search deterministic, T8 consumes generated slugs, T9 separates the runners and measures the browser surface, and T10 refuses to check any roadmap item without evidence or any Phase 2+ change.

## Terminal obligations after Luffy's execution GO and execution

These are closure obligations, not actions taken during planning:

1. After T10, review, quality, and gate evidence are green, write the mission report/PR material under `.mugiwara/missions/pockettools-phase1-core-infrastructure/` without adding a PR.
2. Archive the closed mission with:

   ```sh
   bun /Users/mekari/.cache/opencode/packages/@ionivetech/mugiwara@latest/node_modules/@ionivetech/mugiwara/dist/mugiwara.js archive pockettools-phase1-core-infrastructure
   ```

3. Verify the final branch is `feature/phase-1-core-infrastructure`, then push it with:

   ```sh
   git push -u origin feature/phase-1-core-infrastructure
   ```

4. Leave the branch for human PR handling. Do not merge, deploy, open a PR, or force-push.

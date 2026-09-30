# PocketTools — Roadmap

> Step-by-step execution plan from zero to launch. Task-based, sequential, actionable.
>
> **Legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## How to Use This Document

1. Work **top to bottom**. Do not skip phases.
2. Each task has an estimate. If > 4 hours, break it down further.
3. Finish a phase before starting the next. Do not parallelize by default.
4. If stuck > 2 hours, record it in the active mission log.
5. For technical details, refer to `PLAN.md`.

**Current delivery:** Phase 3 shell features delivered (command palette with fuzzy search, favorites/recent hardening, per-tool local history, paste suggestions, shortcut registry + help, landing/SEO polish). Phase 0-3 are part of the current commit; later phases remain documented but not yet started.

**Tooling:** Bun only, oxfmt, oxlint/Oxc, Nuxt 4, Tailwind CSS v4, PrimeVue 4.5.5.

**Product audience:** everyone. Technical tools are one category, not the default identity.

**UI rule:** no generic permanent left-sidebar admin shell. Use the top command bar, search-first launcher, category navigation, and mobile drawer/sheet.

---

## PHASE 0 — Nuxt Foundation (Week 1)

> Goal: clean repository, Nuxt 4 app running, distinctive general-purpose shell visible, theme and PWA baseline working.

> **Done when:** `bun run dev` opens the Nuxt shell, light/dark Aura blue theme works, mobile layout is usable, PWA shell works offline, and all Phase 0 evidence is green.

### 0.1 Repository reset (2 hrs)

- [x] Delete the previous framework implementation and generated artifacts.
- [x] Delete the old `docs/` folder.
- [x] Delete the previous cancelled mission directory.
- [x] Preserve and rewrite `PLAN.md`, `ROADMAP.md`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, `README.md`, `.gitignore`, `.editorconfig`, and `.npmrc`.
- [x] Confirm all agent instruction links resolve.
- [x] Keep this roadmap synchronized with implementation evidence.

### 0.2 Nuxt 4 + Bun setup (2 hrs)

- [x] Scaffold Nuxt 4 using the `app/` source directory.
- [x] Configure `package.json` scripts for dev, build, generate, preview, check, lint, format, test, and E2E.
- [x] Configure strict TypeScript and Nuxt compatibility date.
- [x] Add Bun lockfile and `.gitignore` for Nuxt/Nitro output.
- [x] Run `bun run dev` and confirm the default route renders.
- [x] Run `bun run check` and `bun run build` with exit 0.

### 0.3 Core dependencies and tooling (1 hr)

- [x] Install `nuxt@4`, Vue, Vue Router, and TypeScript.
- [x] Install `tailwindcss@4` and `@tailwindcss/vite`.
- [x] Install `primevue@4.5.5`, `@primevue/nuxt-module@4.5.5`, and compatible `@primeuix/themes`.
- [x] Install `oxfmt`, `oxlint`, Playwright, and axe-core.
- [x] Add `lefthook` and `commitlint` configuration.
- [x] Confirm no npm/yarn/pnpm lockfile or command is used.

### 0.4 Tailwind and PrimeVue theme (3 hrs)

- [x] Register Tailwind Vite plugin in `nuxt.config.ts`.
- [x] Import Tailwind v4 from `app/assets/css/main.css`.
- [x] Configure the PrimeVue Nuxt module with explicit tree-shaken components.
- [x] Create an Aura preset with blue semantic primary tokens.
- [x] Define light/dark surface, typography, focus, spacing, radius, and motion tokens.
- [x] Confirm PrimeVue components use the theme instead of scattered overrides.

### 0.5 App shell and visual direction (6 hrs)

- [x] Apply taste-skill v2 design read before coding.
- [x] Build the top command bar.
- [x] Build the search-first tool launcher.
- [x] Build category rail/filters.
- [x] Build `/tools` collection route.
- [x] Build mobile tool drawer/sheet.
- [x] Add theme, empty, error, success, offline, and update states; async loading states remain reserved for future tool work.
- [x] Use general-audience copy and examples.
- [x] Avoid a generic admin dashboard or fixed left sidebar.
- [x] Verify keyboard focus, touch targets, reduced motion, and 375px layout.

### 0.6 PWA baseline (2 hrs)

- [x] Configure the Nuxt-compatible PWA module.
- [x] Add installable manifest and standard/maskable icons.
- [x] Add offline shell caching and fallback.
- [x] Add user-prompted update flow.
- [x] Verify no user data leaves the browser.
- [x] Measure precache size and record the Phase 0 budget.

### 0.7 Phase 0 quality evidence (3 hrs)

- [x] Add Playwright shell and accessibility specs.
- [x] Verify 375px, 768px, and 1440px layouts.
- [x] Capture light and dark screenshots.
- [x] Run axe with zero critical/serious violations.
- [x] Record Lighthouse LCP, CLS, INP, and bundle results.
- [x] Verify offline reload through a real browser test.
- [x] Run `bun run ci:local` and save exact output.
- [x] Confirm only Phase 0 files are staged.

**✅ Gate Phase 0:** Nuxt 4 shell, PrimeVue Aura blue, Tailwind v4, responsive UX, PWA, accessibility, performance, and CI evidence all green.

---

## PHASE 1 — Core Infrastructure (Week 2)

> Goal: foundation for future tools without building the tools yet.

> **Done when:** a new tool can be scaffolded, registered, routed, tested, and discovered.

### 1.1 Tool metadata and registry

- [x] Define tool metadata and typed tool contracts. — evidence: T1, app/types/tool.ts; bun test tests/unit/tool-metadata.test.ts
- [x] Add registry register/get/list behavior. — evidence: T3, app/data/tool-registry.ts; bun test tests/unit/tool-registry.test.ts
- [x] Add lazy Vue component loading. — evidence: T7, app/components/ToolHost.vue; bun run test:e2e
- [x] Add category and search metadata. — evidence: T3, app/data/tool-search.ts; bun test tests/unit/tool-search.test.ts
- [x] Generate the registry from source metadata. — evidence: T2, scripts/generate-tool-registry.ts; bun run generate:registry -- --check

### 1.2 Tool scaffolder

- [x] Add a Bun scaffolder command. — evidence: T4, scripts/scaffold-tool.ts; bun test tests/unit/scaffold-tool.test.ts
- [x] Generate one folder per tool. — evidence: T4, scripts/scaffold-tool.ts; bun test tests/unit/scaffold-tool.test.ts
- [x] Generate pure logic, schema, component, and test stubs. — evidence: T4, scripts/scaffold-tool.ts; bun test tests/unit/scaffold-tool.test.ts
- [x] Add generator validation and a scaffold smoke test. — evidence: T4, scripts/scaffold-tool.ts; bun test tests/unit/scaffold-tool.test.ts

### 1.3 Tool routing and collection

- [x] Add `/tools` collection route. — evidence: T8, app/pages/tools/index.vue; bun run test:e2e
- [x] Add `/tools/[slug]` route. — evidence: T8, app/pages/tools/[slug].vue; bun run test:e2e
- [x] Add SEO-safe metadata and error state. — evidence: T8, app/error.vue; bun run test:e2e
- [x] Verify unknown tools produce a useful 404. — evidence: T9, tests/e2e/tool-infrastructure.pw.ts; bun run test:e2e
- [x] Verify search and category filters scale with many records. — evidence: T9, tests/e2e/tool-infrastructure.pw.ts; bun run test:e2e

### 1.4 Shared component system

- [x] Add shared copy/download action component. — delivered: T6, app/components/ToolActions.vue. Its copy/download logic delegates to app/utils/browser-actions.ts, which is unit-tested (bun test tests/unit/browser-actions.test.ts); tests/unit/shared-components.test.ts asserts the component imports that logic and exposes its expected bindings, but the component is still not rendered by any route or browser test.
- [x] Add shared empty/error/loading state components. — evidence: T6, app/components/ToolState.vue; bun run test:e2e
- [x] Add tool header/footer composition. — evidence: T7, app/components/ToolHeader.vue; bun run build
- [x] Add dual-pane and file-drop patterns for future tools. — delivered: T7, app/components/ToolDualPane.vue, app/components/ToolFileDrop.vue. Both compile (bun run build), and tests/unit/shared-components.test.ts asserts each parses, compiles, and exposes its expected bindings. Neither is rendered by a route or a browser test, and both keep their logic inline in the component rather than in a tested utility, so no unit test exercises their behaviour. They wait for the first tool that uses them.
- [x] Use PrimeVue components and project tokens only. — evidence: T9, tests/e2e/accessibility.pw.ts; bun run test:e2e

> Coverage gap: `ToolActions.vue`, `ToolDualPane.vue`, and `ToolFileDrop.vue` are shared primitives delivered ahead of the tools that will use them. `tests/unit/shared-components.test.ts` now verifies that each parses and compiles with no template or script errors and exposes its expected top-level bindings, and that `ToolActions.vue` is the component importing the tested `copyText`/`downloadText` logic from `app/utils/browser-actions.ts`. That is a compile and contract check, **not** render coverage: no component is mounted, and **none of the three is rendered by a route or a browser test**, so the shared component system is still **not** covered end to end — a component that compiles and then behaves wrongly would pass. Closing the gap needs a component-rendering test runner (a dev dependency such as `@vue/test-utils`) or a test-only route, both out of scope here. `scripts/coverage-gate.ts` measures the unit-tested logic, not rendering.

### 1.5 Testing and quality harness

- [x] Keep pure logic under `bun test`. — evidence: T9, playwright.config.ts; bun test
- [x] Add Playwright shell/tool smoke coverage. — evidence: T9, tests/e2e/tool-infrastructure.pw.ts; bun run test:e2e
- [x] Add axe accessibility coverage. — evidence: T9, tests/e2e/accessibility.pw.ts; bun run test:e2e
- [x] Add performance budget checks. — evidence: T9, tests/e2e/tool-infrastructure.pw.ts; bun run test:e2e
- [x] Add CI test/build order. — evidence: T9, package.json; bun run ci:local

### 1.6 URL-state utility

- [x] Add validated URL-state encoding. — evidence: T5, app/utils/url-state.ts; bun test tests/unit/url-state.test.ts
- [x] Define size limits and clear overflow behavior. — evidence: T5, app/utils/url-state.ts; bun test tests/unit/url-state.test.ts
- [x] Add round-trip tests. — evidence: T5, app/utils/url-state.ts; bun test tests/unit/url-state.test.ts
- [x] Keep URL state optional and privacy-safe. — evidence: T5, app/utils/url-state.ts; bun test tests/unit/url-state.test.ts

> Not yet consumed: `app/utils/url-state.ts` is delivered and unit-tested, but **no route or component imports it** — nothing reads or writes tool state in the query string today. The `pockettools-pages` navigation-cache rule in `nuxt.config.ts` is keyed by path rather than by query string so it stays correct once that wiring lands; that fix is anticipatory, not a response to current query traffic. Wiring the codec is product behaviour and is out of scope for this infrastructure mission.

### 1.7 Error handling

- [x] Add local error boundary/logging conventions. — evidence: T7, app/components/ToolHost.vue; bun test tests/unit/error-reporting.test.ts; bun run test:e2e
- [x] Add actionable error copy patterns. — evidence: T6, app/components/ToolState.vue; bun run test:e2e
- [x] Keep failures visible without breaking the shell. — evidence: T9, tests/e2e/tool-infrastructure.pw.ts; bun run test:e2e

**✅ Gate Phase 1:** scaffold → registry → route → lazy component → tests works.

---

## PHASE 2 — First General-Purpose Tools (Week 3)

> Goal: first tools that work for everyday and technical users.

> **Done when:** the first tool set is usable and demonstrates the general-purpose catalog pattern.

### 2.1 JSON formatter and validator

- [x] Pure formatter/minifier/validator logic. — evidence: app/tools/json-formatter/logic.ts, json-parser.ts (hand-rolled parser with engine-independent errors); bun test app/tools/json-formatter
- [x] Schema and shareable state. — evidence: app/tools/json-formatter/schema.ts; state shared via app/utils/url-state.ts in ToolComponent.vue
- [x] PrimeVue input/output layout. — evidence: app/tools/json-formatter/ToolComponent.vue, app/components/ToolDualPane.vue
- [x] Specific line/column errors. — evidence: app/tools/json-formatter/json-parser.ts; bun test app/tools/json-formatter/json-parser.test.ts
- [x] Unit, E2E, and accessibility tests. — evidence: app/tools/json-formatter/{logic,json-parser}.test.ts; tests/e2e/json-formatter.pw.ts; bun run test:e2e
- [x] Light/dark screenshots. — evidence: .mugiwara/missions/pockettools-phase2-general-tools/evidence/screenshots/json-formatter-{light,dark}.png (captured before mission cleanup)

### 2.2 Text cleaner and counter

- [x] Whitespace and case cleanup. — evidence: app/tools/text-cleaner/logic.ts; bun test app/tools/text-cleaner
- [x] Word/character/line count. — evidence: app/tools/text-cleaner/logic.ts (countText); bun test app/tools/text-cleaner
- [x] Copy and download actions. — evidence: app/tools/text-cleaner/ToolComponent.vue (ToolActions)
- [x] Unit, E2E, and accessibility tests. — evidence: app/tools/text-cleaner/logic.test.ts; tests/e2e/text-cleaner.pw.ts; bun run test:e2e

### 2.3 Base64 encoder/decoder

- [x] Text encode/decode. — evidence: app/tools/base64-tool/logic.ts; bun test app/tools/base64-tool
- [x] File drag/drop. — evidence: app/tools/base64-tool/ToolComponent.vue (ToolFileDrop); tests/e2e/base64-tool.pw.ts
- [x] Auto-detect direction. — evidence: app/tools/base64-tool/logic.ts (looksLikeBase64); bun test app/tools/base64-tool
- [x] Copy and download. — evidence: app/tools/base64-tool/ToolComponent.vue (ToolActions)
- [x] Unit, E2E, and accessibility tests. — evidence: app/tools/base64-tool/logic.test.ts; tests/e2e/base64-tool.pw.ts; bun run test:e2e

### 2.4 UUID/ULID generator

- [x] UUID versions and batch size. — evidence: app/tools/uuid-generator/logic.ts (UUID v4, v7, ULID via native crypto), schema.ts (1-100 batch); bun test app/tools/uuid-generator
- [x] Copy actions. — evidence: app/tools/uuid-generator/ToolComponent.vue (per-row copy + ToolActions copy-all)
- [x] Unit, E2E, and accessibility tests. — evidence: app/tools/uuid-generator/logic.test.ts; tests/e2e/uuid-generator.pw.ts; bun run test:e2e

**✅ Gate Phase 2:** first tools are understandable to non-developers and still useful for technical work. Evidence: `bun run ci:local` green (fmt, lint, typecheck, registry check, coverage gate, audit, 319 unit tests, build, 43 Playwright specs including axe + 44px touch targets at 375px for all four tools).

---

## PHASE 3 — Shell Features (Week 4)

> Goal: make discovery and repeated use effortless.

> **Done when:** search, shortcuts, favorites, recent tools, and paste assistance work without a sidebar bottleneck.

### 3.1 Command palette

- [x] Keyboard-first command surface. — evidence: app/components/PaletteDialog.vue (Ctrl/⌘+K global, layout focus restoration); tests/e2e/shell-features.pw.ts
- [x] Fuzzy search across tools and actions. — evidence: app/utils/fuzzy-search.ts (subsequence scorer, typo-tolerant); tests/unit/fuzzy-search.test.ts; palette e2e (`jsn` → JSON formatter)
- [x] Recent and favorite ranking. — evidence: PaletteDialog empty-query ranking (recents → favorites → rest) via use-tool-library; palette e2e
- [x] Full-screen mobile treatment. — evidence: bottom-sheet position via useResponsivePosition + fullscreen-ish padding; shell.pw 375px bottom-sheet assertions still green
- [x] Keyboard navigation and focus restoration. — evidence: ↑↓/Enter/Esc + invoker focus restore in app/layouts/default.vue; shell-features focus e2e

### 3.2 Favorites

- [x] Favorite store/repository. — evidence: app/composables/use-tool-library.ts (localStorage, `pockettools-favorites`); tests/unit/tool-library.test.ts
- [x] Accessible favorite control. — evidence: ToolCard star toggle (aria-pressed/label); axe clean in shell-features e2e
- [x] Favorites section in the scalable tool collection. — evidence: app/pages/tools/index.vue (favorites view + favorites-first); shell.pw + shell-features e2e
- [x] Local persistence and clear empty state. — evidence: `clearFavorites()` + "No favorites yet." empty state; shell-features clear e2e

### 3.3 Recent tools

- [x] Track recent tool visits. — evidence: `markRecent()` on card open + detail mount; TOOL_LIBRARY_RECENT_CAP = 5
- [x] Show recent tools in the collection. — evidence: recent view in app/pages/tools/index.vue; palette empty-query suggestions
- [x] Cap and clear recent history. — evidence: cap 5 + `clearRecent()` + "Nothing recent yet." empty state; shell-features e2e

### 3.4 Local history

- [x] Define retention and privacy policy. — evidence: 20 entries/tool, 30-day prune on read, browser-only note in ToolHistory UI ("Kept only in this browser for 30 days. Nothing is uploaded.")
- [x] Add per-tool history repository. — evidence: app/utils/tool-history.ts; tests/unit/tool-history.test.ts; recorders wired into json-formatter, text-cleaner, base64-tool via app/composables/use-tool-history.ts (debounced, deduped)
- [x] Add restore/delete/clear controls. — evidence: app/components/ToolHistory.vue (restore via window event, per-row delete, clear all)
- [x] Show history only when useful. — evidence: `v-if="entries.length > 0"` + collapsible toggle; e2e records a text-cleaner run and sees the toggle

### 3.5 Paste detection

- [x] Add safe content detectors. — evidence: app/utils/paste-detect.ts (JSON, Base64, UUID/ULID, hex color, long text; short text ignored); tests/unit/paste-detect.test.ts
- [x] Suggest relevant tools without stealing focus. — evidence: app/components/PasteSuggest.vue (`role=status`, dismissible, focus stays in search); shell-features paste e2e asserts focus
- [x] Add user setting to disable detection. — evidence: "Don't suggest again" persists `pockettools-paste-optout`
- [x] Never upload pasted content. — evidence: pure local detectors, no network; wired to home + library search paste events only

### 3.6 Keyboard shortcuts

- [x] Maintain a central shortcut registry. — evidence: app/data/shortcuts.ts (palette, search, help, home, library, close); tests/unit/shortcuts.test.ts
- [x] Add discoverable shortcut help. — evidence: app/components/ShortcutHelp.vue (`?` + header `?` button + palette action); shell-features help e2e
- [x] Keep all core actions keyboard reachable. — evidence: global keys in app/layouts/default.vue (`/`, `?`, `g h`, `g t`, Esc; typing contexts respected); palette footer hints; slash + `g t` e2e

### 3.7 Landing and product polish

- [x] Search-first landing composition. — evidence: app/pages/index.vue (hero fits viewport: kicker + 2-line display + lead + search + kbd hint + try-chips)
- [x] Real catalog preview. — evidence: first-6 real ToolCards + empty state; no fake content
- [x] Honest privacy/offline points. — evidence: privacy principle + launcher footer ("Everything stays in your browser") + PWA status; no fake metrics
- [x] Responsive and dark-mode polish. — evidence: 375/768/1440 no-overflow e2e, `app-dark` parity via tokens, reduced-motion collapse; screenshots evidence/screenshots/home-{1440,375}-{light,dark}.png; taste-skill v2 design read (calm-electric cobalt, one blue accent, one radius)
- [x] SEO metadata and structured data. — evidence: useSeoMeta (home + library) + JSON-LD WebSite block

**✅ Gate Phase 3:** the product feels approachable and easy to navigate with a growing catalog.

---

## PHASE 4 — MVP Tools (Week 5–6)

> Goal: a useful everyday toolkit, not a developer-only collection.

### 4.1 Data and developer tools

- [ ] JWT decoder.
- [ ] Hash generator.
- [ ] Regex tester.
- [ ] Diff checker.
- [ ] Cron parser/builder.
- [ ] cURL/code converter.

### 4.2 Text and writing

- [ ] Markdown editor/preview.
- [ ] Table to Markdown.
- [ ] Case converter.

### 4.3 Everyday

- [ ] Password generator.
- [ ] Unit converter.
- [ ] Color converter/picker.
- [ ] Date/time helper.

### 4.4 Media

- [ ] QR code generator.
- [ ] Image compressor.
- [ ] Image resizer/converter.

**✅ Gate Phase 4:** the MVP is useful for everyday and technical work.

---

## PHASE 5 — Workspace & Polish (Week 7)

> Goal: one coherent application experience.

### 5.1 Multi-tab workspace

- [ ] Open/close tabs.
- [ ] Reorder and overflow behavior.
- [ ] Persist local workspace state.
- [ ] Keep mobile interaction simple.

### 5.2 Settings

- [ ] Theme and density.
- [ ] Privacy controls.
- [ ] Export/import settings.
- [ ] Clear local data with confirmation.

### 5.3 Polish pass

- [ ] Audit against taste-skill preflight.
- [ ] Fix spacing, hierarchy, copy, and responsive issues.
- [ ] Lighthouse audit.
- [ ] Real-device/mobile audit.
- [ ] Accessibility audit.

### 5.4 PWA polish

- [ ] Offline audit for all shipped tools.
- [ ] Update prompt UX.
- [ ] Install prompt after meaningful use.
- [ ] Cache budget review.

**✅ Gate Phase 5:** performance, accessibility, and offline behavior meet the product standards.

---

## PHASE 6 — v1.0 Launch (Week 8)

> Goal: ready to publish without compromising privacy.

### 6.1 Documentation

- [ ] Final README.
- [ ] CONTRIBUTING.
- [ ] CHANGELOG.
- [ ] LICENSE.
- [ ] Final PLAN/ROADMAP consistency.

### 6.2 Deploy

- [ ] Cloudflare Pages setup.
- [ ] Production domain.
- [ ] CI deploy workflow.
- [ ] Preview deployments.
- [ ] Production build verification.

### 6.3 SEO and distribution

- [ ] Sitemap.
- [ ] Robots.
- [ ] Truthful OG assets.
- [ ] Structured data.
- [ ] Privacy-preserving analytics decision.

### 6.4 Launch

- [ ] Prepare release notes.
- [ ] Publish product and privacy story.
- [ ] Monitor feedback.
- [ ] Triage launch issues.

**🎉 v1.0 LAUNCHED**

---

## PHASE 7 — v1.1 (Week 9–12)

### 7.1 Add 10 tools

- [ ] JSON/YAML/TOML/XML/CSV conversion.
- [ ] .env/JSON/YAML conversion.
- [ ] SQL formatter.
- [ ] JS/TS formatter.
- [ ] JSON to typed source.
- [ ] IP/subnet calculator.
- [ ] HTTP status reference.
- [ ] Text counters.
- [ ] Case converter improvements.
- [ ] Image conversion tools.

### 7.2 Advanced media

- [ ] QR scanner.
- [ ] Barcode generator.
- [ ] Favicon generator.
- [ ] SVG optimizer.

### 7.3 Shell features

- [ ] Internationalization.
- [ ] Pipeline/chaining mode.
- [ ] Additional privacy controls.
- [ ] Optional encrypted sync only after a separate privacy review.

**✅ v1.1:** larger catalog and stronger everyday coverage.

---

## PHASE 8 — v2 (Post-launch)

### 8.1 Advanced tools

- [ ] PDF tools.
- [ ] Background removal.
- [ ] Image color extraction.
- [ ] Certificate decoder.
- [ ] Key pair generator.
- [ ] Unicode inspector.
- [ ] Fake-data generator.
- [ ] File conversion tools.

### 8.2 Advanced features

- [ ] Split-view workspace.
- [ ] Snippet manager.
- [ ] Optional encrypted sync.
- [ ] Public API only if privacy and abuse risks are solved.

---

## Milestones

| Milestone | Deliverable                                        | Status                                      |
| --------- | -------------------------------------------------- | ------------------------------------------- |
| M0        | Nuxt 4 shell + PWA baseline                        | `[ ]`                                       |
| M1        | Registry, routing, shared components, test harness | `[x]` — evidence: T1–T10, bun run ci:local  |
| M2        | First general-purpose tools                        | `[x]` — evidence: Phase 2, bun run ci:local |
| M3        | Palette, favorites, history, paste, landing        | `[x]` — evidence: Phase 3, bun run ci:local |
| M4        | MVP everyday toolkit                               | `[ ]`                                       |
| M5        | Workspace, polish, Lighthouse, mobile              | `[ ]`                                       |
| M6        | v1.0 launch                                        | `[ ]`                                       |
| M7        | v1.1 expanded catalog                              | `[ ]`                                       |
| M8        | v2 advanced features                               | `[ ]`                                       |

---

## Daily Workflow

1. Read `PLAN.md`, `ROADMAP.md`, and `AGENTS.md`.
2. Pick one task and mark it `[~]`.
3. Implement within the task's file scope.
4. Run focused tests, then `bun run ci:local`.
5. Commit with Conventional Commits when explicitly requested.
6. Mark `[x]` only with evidence.
7. Record blockers in `.mugiwara/missions/<mission>/blockers.md`.

---

## Anti-Stuck Rules

- Stuck > 30 minutes: read the relevant PLAN section.
- Stuck > 1 hour: log the blocker and reduce the task.
- Stuck > 2 hours: split the task or request a plan amendment.
- If two options are equally complex, choose the simpler one.

---

## Anti-Overengineering Rules

- YAGNI: no speculative tool framework before real tools need it.
- One tool pattern, not a framework of hypothetical abstractions.
- Prefer native browser features and official packages.
- New dependency requires a measured requirement or ADR.
- New feature updates `ROADMAP.md` before implementation.
- Do not mix UI systems.

---

## v1.0 Release Checklist

- [ ] All required MVP tools finished.
- [ ] Lighthouse targets met.
- [ ] Core tools work offline.
- [ ] Search finds every tool.
- [ ] URL sharing works where promised.
- [ ] Mobile responsive at 375px.
- [ ] Dark mode is consistent.
- [ ] Keyboard-only navigation works.
- [ ] No production console errors.
- [ ] Initial bundle budget met.
- [ ] CI green.
- [ ] Documentation complete.
- [ ] Domain and SSL working.
- [ ] Truthful OG assets.
- [ ] Sitemap and robots correct.
- [ ] No PII analytics.

---

## Related Files

- `PLAN.md` — technical architecture and standards.
- `ROADMAP.md` — full phase/task execution order.
- `AGENTS.md` — AI coding standard.
- `README.md` — product and development overview.
- `.mugiwara/missions/pockettools-phase1-core-infrastructure/` — active mission state and evidence.

**Last updated:** 2026-09-25
**Next review:** after Phase 1 infrastructure gate.

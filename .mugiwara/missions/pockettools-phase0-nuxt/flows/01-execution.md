# Execution log — pockettools-phase0-nuxt

## [task 1/7] T1 — Reset repository and preserve allowlist · done

- Decision: delete the previous implementation and cancelled mission; preserve and rewrite only repository documentation/standards plus the new mission state.
- Action: removed source/config/test/docs/generated artifacts and old mission; preserved and rewrote PLAN.md, ROADMAP.md, AGENTS.md, README.md, .gitignore, .editorconfig, .npmrc, and agent links; restored the full multi-phase PLAN/ROADMAP structure and applied targeted Nuxt/PrimeVue/Tailwind/Bun/Oxc migration.
- Result: `src/`, `docs/`, `.svelte-kit/`, and `.mugiwara/missions/pockettools-foundation/` absent; all ROADMAP task markers unchecked; Phase 0–8 preserved; agent links resolve.
- Evidence: `cleanup-allowlist.md`, `PLAN.md`, `ROADMAP.md`, `AGENTS.md`, path/link checks.
- Partial next state: T2 scaffold files and Nuxt dependencies were started before the document correction; they are not yet accepted as a completed task.
- Commit (user-controlled): `chore(T1): reset repository for nuxt phase 0`

## T2 status

- In progress: `package.json`, `nuxt.config.ts`, `tsconfig.json`, `bunfig.toml`, `app/app.vue`, `app/layouts/default.vue`, `app/pages/index.vue`, Nuxt/Vue/TypeScript dependencies.
- Blocked until the restored PLAN/ROADMAP are reviewed and T2 acceptance is rerun.

## [user follow-up] Development PWA route short-circuit · done

- Decision: keep `devOptions.enabled: false` and disable the `@vite-pwa/nuxt` client plugin only when `NODE_ENV=development`; add one Nuxt `devServerHandlers` entry for `/dev-sw.js` so both the plain and query-string requests return `204` before Vue Router.
- Action: updated `nuxt.config.ts`; retained the existing production client registration setting and made no production PWA changes.
- Result: fresh `bun run dev` returned `200` for `/` and `204` for both `/dev-sw.js` and `/dev-sw.js?dev-sw`; server log contained zero `VUE_ROUTER_R0004` warnings.
- Evidence: `nuxt.config.ts`, `/tmp/pockettools-dev-shortcircuit.log`, `bun run fmt:check`, `bun run check`, `bun run build`, production `/sw.js` HTTP `200`.
- Deviation: no commit, push, branch switch, merge, archive, changelog, workflow, or performance work.

## [user follow-up] PrimeVue theme serialization experiment · reverted

- Decision: revert only `primevue.importTheme` plus the `ready` runtime-config deletion; restore the stable imported `AuraBlue` preset under `primevue.options.theme.preset`.
- Measurement: the experiment reduced serialized `window.__NUXT__.config` from `108,098` to `2,399` raw bytes, but increased initial client JavaScript from `175,549` to `281,962` raw bytes (`55,866` to `69,147` gzip); combined HTML + initial JS gzip increased by about `1,053` bytes.
- Lighthouse: experiment `74` / LCP `4419 ms`; stable previous `73` / LCP `4594 ms`; final stable run `74` / LCP `4414 ms`; single-run score variation did not offset the deterministic transfer regression.
- Result: final build restored the smaller client bundle and retained the working Aura theme; `bun run fmt:check`, `bun run check`, `bun run lint`, and `bun run build` all exit `0`.
- Evidence: isolated baseline build `/tmp/pockettools-theme-baseline.NB18wj`, current experiment Lighthouse `/tmp/pockettools-theme-current-lighthouse.json`, baseline Lighthouse `/tmp/pockettools-theme-baseline-lighthouse.json`, final Lighthouse `/tmp/pockettools-theme-final-lighthouse.json`.
- Deviation: no unrelated product files, commit, push, branch switch, merge, deploy, or archive.

## [task 1/1] Mobile Lighthouse blocker · done

- Decision: try Nitro's built-in public-asset precompression as the smallest dependency-free change; retain it only if repeated Lighthouse runs and targeted PWA/accessibility checks improve.
- Action: added `nitro: { compressPublicAssets: true }`, rebuilt, verified Brotli response negotiation, ran three validation Lighthouse passes plus one saved final pass, and ran targeted PWA/accessibility tests.
- Result: three validation runs scored 89; the final report scored 90. Median FCP/LCP improved from 4.4/4.8 s to 2.9/3.0 s, TBT from 280 ms to 30 ms, and transfer from 607 KiB to about 325 KiB. Final LCP was 2.9 s, CLS 0, TBT 20 ms, and transfer 320 KiB.
- Evidence: `nuxt.config.ts`, `evidence/lighthouse-mobile.json`, generated `.output/public/_nuxt/*.br` and `*.gz`, `bun run fmt:check`, `bun run build`, `bun run check`, `bun run lint`, and 7 passing PWA/accessibility tests.
- Blocker: performance 90 and LCP 2.9 s remain below the Phase 0 `>=95` / `<2.5 s` targets; the 190,823-byte SSR HTML is still uncompressed and is 58% of final transfer.
- Deviation: no dependency, threshold, PWA behavior, accessibility behavior, changelog/workflow, commit, push, branch switch, merge, deploy, or archive change.

## [Flow 8 follow-up] Final review blockers · done

| Task | Status | Evidence | Deviation |
|---|---|---|---|
| Detail icon and PrimeIcons regression | PASS | [`app/pages/tools/[slug].vue`](../../../../app/pages/tools/%5Bslug%5D.vue), [`tests/e2e/shell.spec.ts`](../../../../tests/e2e/shell.spec.ts) | Test failed first because the expected SVG was absent, then passed after replacement. |
| Category groups and static theme name | PASS | [`app/pages/index.vue`](../../../../app/pages/index.vue), [`app/pages/tools/index.vue`](../../../../app/pages/tools/index.vue), [`app/components/AppHeader.vue`](../../../../app/components/AppHeader.vue) | Removed only the category/launcher labels requested; retained the named collection-view group. |
| Hashed JS/CSS precache | PASS | [`nuxt.config.ts`](../../../../nuxt.config.ts), generated `.output/public/sw.js` | Added a 512 KiB total and 256 KiB per-file build budget; generated shell is 443.00 KiB. |
| Decorative launcher wrapper | PASS | [`app/pages/index.vue`](../../../../app/pages/index.vue) | Removed the present dead `aria-label`; no other launcher behavior changed. |

- RED evidence: the new detail assertion failed on missing `.pt-tool-icon > svg`; the static-name assertion failed to find a `Dark theme` button.
- Static gates: `bun run fmt:check && bun run lint && bun run check` exited 0; format check covered 37 files.
- Build: `bun run build` exited 0; 6 pages plus 6 payloads prerendered; PWA generated 41 precache entries / 443.00 KiB.
- Generated-worker proof: the rendered entry `_nuxt/DQUF_eJM.js` is present in `sw.js`; 23 JS precache entries were found.
- Focused browser gates: 2 shell assertions passed (detail route and theme state), 4 accessibility checks passed, and 3 PWA/security/offline tests passed.
- Blocker: none in the requested scope.
- Deviation: no commit, push, branch switch, merge, deploy, evidence deletion, or mission archive.

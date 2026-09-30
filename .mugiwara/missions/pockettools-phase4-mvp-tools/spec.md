# Spec — pockettools-phase4-mvp-tools

Source: ROADMAP.md Phase 4 (4.1-4.4), RFC sections 6-7, AGENTS.md. Only Phase 4; Phase 5+ untouched.

## Goal
A useful everyday toolkit, not a developer-only collection. Gate: the MVP is useful for everyday and technical work, every tool understandable to non-developers and still useful for technical work, with `bun run ci:local` green and ROADMAP Phase 4 + M4 flipped with evidence before push.

## Problem restatement
Ship 16 MVP tools (6 data/dev, 3 text, 4 everyday incl. 2 placeholders to finish, 3 media) on the proven Phase 1-3 rails (scaffold → registry → route → lazy component → unit+e2e+axe), native-first and offline-first, with taste-skilled UI that stays calm-electric cobalt, plus the mandatory roadmap-before-push closure rule.

## Baseline (what already exists, verified by read)
- Proven tool pattern: `app/tools/<slug>/{metadata,schema,logic,ToolComponent}.vue + logic.test.ts` (json-formatter, text-cleaner, base64-tool, uuid-generator). Thin PrimeVue components over pure framework-independent logic; `ToolDualPane` + `ToolActions` + `ToolHistory` + `useToolHistoryRecorder`; URL state via `app/utils/url-state.ts` (v1 base64url, 4096-byte cap); history repo `app/utils/tool-history.ts` (20/tool, 30-day prune).
- Placeholders: `color-picker` and `password-generator` exist as metadata-only entries rendering `ToolPlaceholder.vue` via the generated registry. They must be finished, not re-scaffolded.
- Registry: `scripts/scaffold-tool.ts` + `scripts/generate-tool-registry.ts` (`--check` in CI); generated files never hand-edited.
- Quality rails: `bun test` (unit) + Playwright `*.pw.ts` (never `*.spec.ts`) + axe + coverage gate (new 85 / modified 90) + `bun run ci:local` (fmt, lint, check, registry check, coverage gate, audit, test, build, Playwright).
- Shell: palette fuzzy search, favorites/recent, per-tool history, paste detectors, shortcut registry, SEO meta — all wired; new tools are discovered automatically once registered.

## Round 1 — sharp questions (auto-resolved, logged as AI decisions)
- Q1 Markdown: [A] safe hand-rolled subset now vs [B] marked+DOMPurify now vs [C] defer markdown entirely → **Decided A** (AI, auto mode). Reason: zero dep, XSS-safe by construction, bundle-safe; full CommonMark deferred with explicit subset label so the UI never misleads.
- Q2 QR: [A] vendored zero-dep encoder util vs [B] qrcodejs dep now vs [C] maintained QR dep now → **Decided A** (AI). Reason: offline, pure-testable, no ADR; qrcodejs killed on SSR/types/maintenance (see Round 2); maintained dep stays as fallback behind an ADR.
- Q3 Images: [A] canvas main-thread + size/loading guards vs [B] Web Worker now → **Decided A** (AI). Reason: RFC forbids prebuilt workers; YAGNI worker until a heavy tool proves the need.

## Round 2 — options with trade-offs + kill criteria (pre-research, validated after)

### Markdown preview (4.2)
- A1 hand-rolled safe subset (headings, bold/italic, inline code, fenced code, lists, links, blockquote; NO raw HTML — escaped; explicit "supports a simple subset" note). Zero dep, offline, XSS-safe, tiny bundle. **Dies if** acceptance demands full CommonMark/GFM (nested tables, footnotes, task lists, autolinks) — then the subset would mislead and A2 is required.
- A2 `marked` + sanitizer (`DOMPurify`/`js-xss`/`sanitize-html`), ADR required. Full GFM, maintained (Context7 `/markedjs/marked`: browser/server/CLI, fast). Cost: two deps, larger bundle, sanitization wiring, SSR/lazy care. Marked does NOT sanitize by default (docs: must sanitize output). **Dies if** the pair pushes the initial route over the 120 KB gzip budget, or sanitization is skipped (XSS), or chunks are not lazy/offline-cached.
- Killed for MVP: A2 (deferred to v1.1 behind ADR + bundle proof). Research used: Context7 resolve `/markedjs/marked` + docs query (sanitize behavior).

### QR generator (4.4)
- B1 vendored zero-dep encoder: pure `encodeQr(text, ecc) -> modules` util + canvas render + PNG/SVG download, license carried, unit-tested. Offline, testable, no ADR. **Dies if** edge cases fail (long URLs, unicode, ECC levels) or vendored code grows unmaintainable — then B3 via ADR.
- B2 `qrcodejs` dep (`/davidshimjs/qrcodejs`: pure JS, zero deps, canvas/table, `new QRCode(el, {text,width,height,colorDark,colorLight,correctLevel})`, `makeCode`, `toDataURL`). **Dies if** Vue/SSR mismatch, missing TS types (strict violation), or unmaintained status bites. Research confirms direct-DOM API + no types + legacy maintenance → **killed for MVP**.
- B3 maintained QR dep (e.g. node-qrcode family, canvas/PNG/SVG), ADR required. **Dies if** ADR rejected, bundle over budget, or SSR chunk not lazy. Kept as fallback only.
- Research used: Context7 resolve `qrcode` + docs query (`/davidshimjs/qrcodejs` API/behavior).

### Image compressor + resizer/converter (4.4)
- C1 canvas-only main thread: `drawImage` → `toBlob` quality/format (png/jpeg/webp), single file, ≤10 MB guard, loading state for ops over 200 ms, EXIF-orientation note. Zero dep. **Dies if** large images block UI without loading feedback or orientation is wrong on real photos.
- C2 worker/Comlink now. **Killed for MVP**: RFC forbids prebuilt workers; no heavy tool has proven the need.

### Data/dev + text + everyday remainder (all native, zero dep)
- JWT decoder: base64url decode + JSON parse, decode-only (no signature verify; UI says so). **Dies if** scope creeps to verify/JWKS/network.
- Hash generator: Web Crypto `subtle.digest` (SHA-256/384/512; SHA-1 labeled weak-only) + hex/base64, async with loading state. **Dies if** scope creeps to bcrypt/argon2/KDFs.
- Regex tester: native `RegExp`, JS flavor only, flag toggles, match list with capture groups, catastrophic-backtracking guard (input/size caps + timeout note). **Dies if** multi-flavor (PCRE/Python) demanded.
- Diff checker: hand-rolled line Myers/LCS, 2-way, line+char highlight, ignore-whitespace toggle. **Dies if** 3-way/word-merge/folder diff demanded.
- Cron parser/builder: 5-field standard + preset builder + human description + next-3 runs (local TZ stated). **Dies if** seconds/years/timezone-DB/quartz demanded.
- cURL converter: subset parser (method, URL, headers, data, basic auth) → `fetch` snippet + copy. **Dies if** full flag matrix or multi-language export demanded.
- Table to Markdown: CSV/TSV paste → markdown table, delimiter detect, alignment row. **Dies if** Excel-binary/xlsx demanded.
- Case converter: lower/UPPER/Title/Sentence/camel/snake/kebab + copy per variant. No dep.
- Password generator: finish placeholder with `crypto.getRandomValues`, length/sets/exclude-ambiguous, strength hint, copy; never persisted. No dep.
- Unit converter: pure tables (length, mass, temp, volume, speed, data) with explicit precision/rounding. **Dies if** live rates/currency-API demanded (network forbidden).
- Color converter/picker: finish placeholder (hex/rgb/hsl + picker input + copy per format + contrast hint). No dep.
- Date/time helper: timestamp ↔ ISO ↔ local, relative ("in 3 days"), Intl formatting, explicit TZ label. No dep.

## Round 3 — recommendation + fragility + second-order cost
Recommendation: **native-first for 14 tools + hand-rolled markdown subset + vendored QR encoder + canvas-only images**, all on the Phase 2 component pattern (`ToolDualPane`, `ToolActions`, history recorder, URL state where the payload fits the 4096-byte cap, paste-detector wiring where useful).
- Fragility: **this recommendation dies if** (a) markdown acceptance is raised to full CommonMark fidelity, (b) QR edge cases fail on real payloads, or (c) any image flow needs background processing — each triggers its named ADR fallback, not a silent dep add.
- Second-order cost: the markdown subset forces ONE shared pure subset-parser util (not per-tool copies) with its supported-syntax list shown in the UI; whoever extends markdown pays the "extend the shared util + its tests + the UI list" cost. The vendored QR encoder makes us the owner of QR correctness; the seam is the pure `encodeQr(text, ecc) -> modules` interface so a future ADR swap deletes one file. Canvas-only images force every future heavy-media tool to add its own loading/size guard until a worker is proven — the worker migration is then one deliberate ADR, not drift.

## Acceptance criteria
- Per tool: pure `logic.ts` + `schema.ts` with `Result` errors (no throw to UI), `ToolComponent.vue` on `ToolDualPane` with toolbar/input/output/footer slots, real empty/error/success states, history recording where input/output pairs make sense, `ToolActions` copy/download, URL state only when the encoded payload stays under the cap (large image/markdown payloads must refuse URL sharing clearly, never truncate), unit tests under `bun test`, one Playwright spec per tool reusing `tests/e2e/helpers/app.ts` (no `waitForTimeout`, bounded waits, role/name/testid queries), axe zero critical/serious, 375/768/1440 sanity, light/dark parity via tokens, 44px targets, visible focus, reduced-motion collapse.
- Placeholders finished: `color-picker` and `password-generator` render real components (no `ToolPlaceholder`), registry regenerated, `--check` green.
- Catalog: search finds every new slug, categories scale, paste detectors extended only where detectors already exist (JSON/base64/uuid/hex-color/long-text); no new network detectors.
- Global: Bun only, PrimeVue only, tokens only (no raw color/spacing/radius in components), TS strict (no `any`), `bun run ci:local` green, coverage gate green, no new dependency without ADR, no hand-edited generated files, no cross-tool imports, no console logs in production code, no user data leaves the browser.
- Slop risks named: no 3-card tool grids, no purple glow, no div-based fake previews/screenshots, no emoji icons, verb-first buttons, real labels (never placeholder-as-label), hero/tool views fit viewport.

## Risks / unknowns
- QR vendored encoder correctness on unicode/long payloads (mitigate: unit vectors + real-scan spot check documented as evidence, fallback ADR ready).
- Markdown subset honesty (mitigate: supported-syntax list in UI + tests proving HTML is escaped, never rendered).
- Hash async + image canvas flows need loading states (rule: loading only for ops over 200 ms, but async boundaries must still be keyboard/axe clean).
- 16 tools in one mission is large: registry churn + e2e time growth; Nami must order waves so shared seams (QR util, markdown util, unit tables) land before their tools, and Zoro must keep one logical commit per tool.
- Scope creep is the top risk (full CommonMark, verify-JWT, bcrypt, PCRE, 3-way diff, quartz, curl-matrix, currency API, EXIF-perfect images). Each has its kill line above; anything past the line is cut to v1.1.

## Open questions for Nami (must answer in plan.md)
1. Exact slug/metadata list for the 14 new tools (names, descriptions, categories, keywords, icons from the closed `AppIconName` set) + finished descriptions for the 2 placeholders.
2. Which tools get URL-state sharing vs explicit refusal (payload-size reasoning per tool)?
3. Shared util placement: single QR encoder file + single markdown-subset file + single unit-table file (paths, JSDoc, owners) so no per-tool forks.
4. E2E file plan: one `*.pw.ts` per tool vs grouped specs, reusing helpers, with 5x-focused + 3x-full stability proof noted.
5. Wave order + commit-per-tool mapping on `feature/phase-4-mvp-tools` with `auto_commit=on`.

## What to cut (v1.1 or later, not this mission)
Full CommonMark/GFM + export, JWT verify/JWKS, bcrypt/argon2, multi-flavor regex, 3-way/folder diff, cron seconds/years/TZ-DB, full curl flag matrix + multi-language export, xlsx import, currency/live rates, batch/EXIF-preserving image pipelines, workers/Comlink, Dexie, workspace tabs, i18n, sync, deploy. Taste polish beyond the tool views (landing rework) is out; tool views only.

## Constraints
Bun 1.2+, Nuxt 4 `app/`, PrimeVue 4.5.5 Aura blue, Tailwind v4 tokens, oxfmt/oxlint, `bun test` + Playwright + axe, Conventional Commits, no cross-tool imports, no network from logic, offline-first PWA, 120 KB gzip initial-route budget, 30 KB CSS budget, WCAG 2.2 AA. Closure: ROADMAP.md Phase 4 checkboxes + M4 + CHANGELOG with evidence before push; branch handoff only (no PR/merge/deploy by crew).

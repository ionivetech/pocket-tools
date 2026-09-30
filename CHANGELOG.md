# Changelog

## Unreleased

### Phase 4 — MVP tools

#### Fixed after an independent review and security pass

Nine defects surfaced only once the work was reviewed by something that had not
written it. Each fix names the root cause, because in five cases the symptom and
the cause were in different places.

- **The markdown renderer could freeze the tab.** The catch-all paragraph branch
  could consume zero lines, so input like `***bold***`, `# `, or `----` left the
  loop spinning. It now always consumes a line, with ten regression inputs.
- **The regex tester could freeze the tab for half a minute**, reachable from a
  share link before any interaction. Input caps cannot bound backtracking, so the
  scan now runs in a worker the UI terminates after two seconds.
- **The QR error-correction level L is gone.** An independent decoder rejected our
  L output at every mask while accepting M. Rather than ship a code nobody can
  scan, L was removed and M is now verified against a third-party decoder. The
  format-information reader had been mirroring the writer, which is why the wrong
  bit order passed one review; it is now pinned to a literal format word.
- **The JWT decoder no longer stores the token** in the URL or in local history.
  A credential in a query string reaches browser history, server logs, and any
  Referer header.
- **cURL Basic auth handles non-Latin-1 passwords** instead of throwing out of
  `btoa`.
- **Image tools stop above 40 megapixels**, checked after decode and before any
  canvas is allocated. A 10 MB file cap never bounded decoded memory.
- **A PWA glob that matched nothing was deleted.** Nuxt emits hash-only chunk
  names, so tool JavaScript cannot be excluded by name at all; the comment now
  records the measured evidence instead of implying otherwise.
- **A literal NUL can no longer collide** with the markdown placeholder channel.
- **An out-of-range date returns an error** instead of throwing out of the tool's
  result contract and blanking the panel.
- Still no new runtime dependency, and no user data leaves the browser.

- Shipped 16 MVP tools on the same rails as Phase 2: pure, unit-tested logic plus a thin PrimeVue component reusing `ToolDualPane`, `ToolActions`, `ToolHistory`, and URL-state sharing. The catalog is now 20 tools.
- Data and developer: JWT decoder (decode-only — the UI says the signature is never checked), hash generator (Web Crypto SHA-256/384/512 plus SHA-1 labeled for old checksums, hex/base64), regex tester (JavaScript patterns, capture groups, match and input caps so a runaway pattern cannot hang the page), diff checker (line LCS with an ignore-spacing toggle), cron helper (5-field schedule read in plain words, presets, next three runs with the time zone labeled), and a cURL-to-fetch converter that names any flag outside its subset instead of dropping it.
- Text: markdown preview from a hand-rolled safe subset (raw HTML escaped, only `http(s)` links, the supported syntax list shown in the UI), table-to-markdown with delimiter detection and quoted-field support, and a case converter that lists all seven cases with per-variant copy.
- Everyday: finished the password generator (platform random, one character guaranteed from every chosen set, lookalike skipping, entropy hint — never stored, never in the URL) and the color picker (hex/rgb/hsl both ways, native picker, WCAG contrast hint); added a unit converter (length, mass, temperature, volume, speed, data — no network) and a date/time helper (second/millisecond auto-detect, ISO, local/UTC/relative wording).
- Media: a QR generator backed by a vendored zero-dependency encoder (byte mode, versions 1-6, Reed-Solomon with mask selection) offering SVG and PNG downloads, plus a canvas image compressor and resizer with a 10 MB guard, quality/size controls, JPEG/WebP/PNG output, and honest before/after sizes.
- Fixed dialog focus: opening the palette, the shortcut help, or a tool's options drawer now focuses its primary control instead of PrimeVue's close button, while keeping visible focus, the focus trap, Esc, and invoker focus restoration. Verified 5x under load and across the full suite.
- Kept the offline install lean: lazy tool chunks are no longer precached (they runtime-cache on demand) and the measured PWA precache budget moved 1088 → 1160 KiB with the per-tool accounting recorded in `nuxt.config.ts`.
- No new runtime dependency. Deliberate limits to read in the UI: markdown is a labeled subset, JWT decoding never verifies signatures, QR holds up to 106 bytes at correction M, and images are re-encoded on canvas (no EXIF, no batch).
- Gate: `bun run ci:local` green twice back to back — 517 unit tests, 114 Playwright specs (axe + 44px touch targets at 375px for every tool), coverage gate 93.31% new / 91.18% modified, production build and PWA precache budget green.

### Phase 3 — Shell features

- Upgraded the command palette: typo-tolerant fuzzy search, recent/favorite ranking on empty query, action rows (home, library, theme, shortcuts), footer hints, and focus restoration; still a bottom sheet on phones.
- Hardened favorites and recents: persistent store with a documented cap of 5 recents, clear controls, and announced empty states in the tool library.
- Added per-tool local history: the last 20 runs kept 30 days in the browser only, with restore, per-row delete, and clear-all, shown only when entries exist (JSON, text, and Base64 tools record automatically).
- Added paste suggestions: safe local detectors (JSON, Base64, UUID/ULID, hex color, long text) suggest the right tool without stealing focus, with a "Don't suggest again" opt-out and no upload path.
- Added a central shortcut registry and help (`?` or the header `?` button): `Ctrl+K` palette, `/` focus search, `G H` home, `G T` library, `Esc` close.
- Polished landing and shell: search-first hero that fits the viewport, real 6-tool catalog preview, honest privacy/offline points, responsive + dark-mode parity with screenshots, and SEO metadata with JSON-LD.
- Raised the home initial-JS budget 128 → 140 KiB with measured evidence (135.3 KiB; async palette tried and measured worse) and kept `bun run ci:local` green (417 unit tests, 62 Playwright specs including axe + 44px touch targets).

### Phase 2 — First general-purpose tools

- Added the JSON formatter/validator: a hand-rolled JSON parser reporting exact line/column syntax errors (independent of JS engine), format/minify, and shareable state through the URL.
- Added the text cleaner: whitespace/case cleanup with live word, character, and line counts.
- Added the Base64 encoder/decoder: text encode/decode with auto-detected direction, plus file drag-and-drop.
- Added the UUID/ULID generator: UUID v4, UUID v7 (time-ordered), and ULID, batch 1-100, generated with the native Web Crypto API (no new dependency).
- Each tool ships pure, unit-tested logic; a PrimeVue Aura-blue component reusing the shared `ToolActions`/`ToolDualPane`/`ToolFileDrop` primitives; and a dedicated Playwright spec covering its core flow plus zero critical/serious axe violations and 44px touch targets at 375px.
- Gave `ToolDualPane`'s input and result panes their own card surface, matching the existing design language.

### Phase 0 — Nuxt foundation

- Rebuilt PocketTools as a Nuxt 4.5.2 application with the `app/` source layout and Bun 1.2+ for runtime and package management.
- Added PrimeVue 4.5.5 through `@primevue/nuxt-module`, an Aura blue semantic theme, and a small inline SVG icon system.
- Added Tailwind CSS v4 through `@tailwindcss/vite` and CSS-first design tokens for light and dark surfaces, focus, spacing, radius, and motion.
- Added a mobile-first, non-sidebar shell with search, categories, `/tools`, `/tools/[slug]`, favorites, recent tools, local browser persistence, theme switching, mobile navigation, and useful empty and offline states.
- Added the Nuxt-compatible PWA baseline with an install manifest, local icons, service-worker caching, an offline fallback, and user-prompted updates.
- Kept tool work and preferences in the browser with no account, tracking, or upload path.
- Added accessibility and quality evidence: strict TypeScript, reduced-motion and visible-focus behavior, axe checks, Playwright Chromium coverage, responsive screenshots, Lighthouse reports, security headers, and the Bun-only `bun run ci:local` gate.
- Added a read-only GitHub Actions workflow for pull requests targeting `main` and pushes to `main` or `feature/**`; it installs the frozen lockfile and Chromium before running CI, with no deployment or merge steps.

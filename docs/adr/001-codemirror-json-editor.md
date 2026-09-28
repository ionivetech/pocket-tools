# ADR 001 — CodeMirror 6 for the JSON formatter editor

Status: accepted (2026-09-28). Amends the Phase 2 zero-dependency stance for one surface: the JSON editor.

## Context

The JSON formatter shipped with an enhanced native textarea (gutter, Tab handling, jump-to-error) to avoid a new dependency without an ADR (repo rule: new deps need an ADR or a Phase 0 requirement). The user explicitly asked for a real code editor "like Monaco but lighter" and accepted ADR evolution.

## Decision

Use CodeMirror 6 cherry-picked modules in the JSON tool only:
`@codemirror/state`, `@codemirror/view`, `@codemirror/commands`,
`@codemirror/language`, `@codemirror/lang-json`, `@codemirror/lint`,
`@lezer/highlight` (all MIT). Explicitly rejected: the `basicSetup`
bundle (pulls autocomplete/fold/search weight we don't use), the
`vue-codemirror` wrapper (a thin local component is enough), Monaco
(~2 MB+, would repeat the Phase 2 JS-budget finding).

## Consequences

- Single lint source is our own `parseJsonWithLocation` (exact messages kept); `jsonParseLinter` skipped to avoid duplicate diagnostics.
- SSR safety via dynamic `import()` in `onMounted`; theming via `--pt-*` tokens so `.app-dark` follows automatically.
- Imports live only in the lazy `json-formatter` chunk: the home 120 KiB JS budget test must stay green.
- Bundle impact (measured, `_nuxt` JS raw): 555.2 KiB / 25 chunks before → precache manifest 951.2 KiB after (+~247 KiB of editor). Largest single chunk 223.8 KiB, under the 256 KiB per-file cap, so the JSON tool keeps working offline. Total budget raised 704 → 1024 KiB deliberately on this evidence (`nuxt.config.ts` comment).
- e2e output assertions read `.cm-line` divs instead of `toHaveValue` (CodeMirror renders lines, not a textarea value).

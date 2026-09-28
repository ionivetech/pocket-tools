# pockettools-json-codemirror (Lane 2 Standard)

Baseline: `feature/ui-tool-workspace-polish` green (387 unit, 48 pw). Stack on it.

## Key decisions
- CodeMirror 6 cherry-picked modules only (`state/view/commands/lang-json/lint`, `@lezer/highlight`); never the `basicSetup` bundle, never `vue-codemirror` wrapper, never Monaco.
- Single lint source = our `parseJsonWithLocation` errors (exact messages preserved); `jsonParseLinter` skipped to avoid duplicate diagnostics.
- SSR safety via dynamic `import()` inside `onMounted` (no top-level CM imports in the component).
- Theming via `EditorView.theme` + `main.css` `.cm-*` overrides on `--pt-*` tokens, so `.app-dark` follows automatically.
- Testids preserved; e2e output assertions switch from `toHaveValue` to per-line join (CM renders lines as divs).

## Tasks
| # | Task | Files | Acceptance |
|---|------|-------|------------|
| T1 | Deps + ADR + bundle baseline | `package.json`, `bun.lock`, `docs/adr/001-codemirror-json-editor.md`, `nuxt.config.ts` (comment only) | `bun add` resolves 6.x; ADR merged; pre/post precache numbers recorded |
| T2 | `JsonCodeEditor.vue` + wire into ToolComponent | `app/tools/json-formatter/JsonCodeEditor.vue`, `ToolComponent.vue`, `json-diagnostics.ts` + unit, `main.css` | unit green; v-model loop-free; readonly output; diagnostics map exact lines |
| T3 | e2e update + full gates | `tests/e2e/json-formatter.pw.ts` | focused file green incl. axe/44px/375px; full `ci:local` chain green; home JS budget green |

CODEOWNERS: `app/tools/json-formatter/` T2–T3; repo root dep/config T1. Sequential (T2 needs T1's packages; T3 needs T2's DOM).
Rollback: `git revert` the dep commit / component commit respectively; fallback is the current textarea editor (kept in git history).

## Pre-mortem
Most likely failure: CM chunk blows the 704 KiB precache budget or leaks into the home chunk. Countered at T1 (measure first, raise deliberately with ADR note; imports live only in the lazy tool component) and proven at T3 by the budget e2e + precache manifestTransform.

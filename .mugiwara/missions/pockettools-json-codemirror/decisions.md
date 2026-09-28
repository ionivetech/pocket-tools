# Decisions — pockettools-json-codemirror

## Flow 0 — Luffy (triage) — 2026-09-28
- Classification: Explicit. Reason: user chose CodeMirror and accepted ADR evolution; direction settled, no design exploration needed.
- Lane: 2 Standard. Reason: ~6 files (package.json/bun.lock, ADR, new editor component, ToolComponent, e2e, nuxt comment) + new-dependency risk (bundle/precache/a11y/SSR) needs plan + full gates but not a multi-wave campaign.
- Mode: auto (from `.mugiwara/config`), solo (same signals as prior mission). Execution posture: inline-sequential.
- CLI: still degraded (direct file ops). Baseline: prior mission closed green on `feature/ui-tool-workspace-polish` (387 unit, 48 pw, gate 98.72%); this mission stacks on that branch (single PR).
- Spec bridge: goal = replace the zero-dep textarea editor with CodeMirror 6 keeping every `json-formatter-*` testid, all gates green, ADR recording the dependency + bundle impact. Acceptance: focused json pw 6/6 incl. axe/44px/375px; precache budget re-measured and deliberately adjusted if needed; home-page JS budget test still green (CM stays in the lazy tool chunk).
- Route: → Flow 2 Nami (compact plan) → Flow 3 Zoro. Actor: AI: muse-spark-1.3-contributor-free. Requester: user: farid nugraha <farid.nugraha@mekari.com>.

## Execution — Zoro — 2026-09-28
- T1 deps+ADR: `bun add` CM 6.43/6.11/6.12/6.0/6.9 + lezer 1.2.5 (all MIT); `docs/adr/001-codemirror-json-editor.md`. Bundle: `_nuxt` JS 555.2 KiB → precache 951.2 KiB; largest chunk 223.8 KiB < 256 KiB per-file cap (offline safe); budget 704 → 1024 KiB deliberately with comment. HighlightStyle lives in `@codemirror/language` in current versions (fixed a wrong import caught by typecheck).
- T2 editor: `JsonCodeEditor.vue` (dynamic import, our-parser lint source, token theming, v-model, readonly, focusLine) + `json-diagnostics.ts` (unit-tested) + footer slot in ToolDualPane + `.pt-cm` styles. Feedback round: jump button moved inline into the status row (no layout push); editors auto-height with flex-fill so both share top+bottom edges (verified via modlens screenshots + DOM measurement after two failed CSS attempts).
- T3 gates: everything green (see closure). Two transient parallel-load pw failures mid-run, green on re-runs; pre-commit hooks (lint/format/typecheck/commitlint) clean — one commit message reworded for subject-case.
- Commits: `f23bcf5` on `feature/ui-tool-workspace-polish`. Actor: AI: muse-spark-1.3-contributor-free.

## Closure — Luffy — 2026-09-28
- Verdict: GO. Evidence: fmt/lint/typecheck green, registry 6/0, audit clean, 392 unit, build green, 48 Playwright (axe+44px+375px+home-budget), coverage new 100%/modified 98.72%. Nothing pushed — push + local-main reset still await the user (one PR for both missions now).

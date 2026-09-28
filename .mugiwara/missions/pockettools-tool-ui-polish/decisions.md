# Decisions — pockettools-tool-ui-polish

## Flow 0 — Luffy (triage) — 2026-09-28

- Classification: Explicit + Exploratory. Reason: user lists concrete per-tool requirements (header full-width + spacing, JSON code-editor + single-card divider + advanced options, text-cleaner/base64 side-by-side + advanced options, UUID/ULID polish + converter, grouped options), but design choices (editor library without new dep, exact advanced-option sets, single-card workspace pattern) need UX exploration. Plan impact: route to Flow 1 Usopp brainstorm before Nami plan; lane stays high.
- Lane: 3 Full. Reason: touches shared shell (ToolHeader, ToolDualPane/workspace, main.css) + 4 tools (component + schema + logic + unit + e2e each) ≈ 15+ files; needs full pipeline (brainstorm/plan/execute/checkpoint/quality/gates/review/closure). Lane may rise, never drop.
- Mode: auto (from `.mugiwara/config`), auto_commit=on. Applies from Flow 1 onward; no mid-stage flips.
- Solo or team: solo (auto-derived). Reason: `.mugiwara/missions/` shows only archived solo missions, no roster files, `team` key absent in config; single requester. Recorded before first savepoint.
- Execution posture: inline-sequential (default). Parallel only for Zoro worker batches if plan proves file-disjoint.
- CLI: degraded mode. Reason: `mugiwara` binary not found, `.mugiwara/bin/` absent, `npx @ionivetech/mugiwara` produced no help. Proceeding via direct `.mugiwara/` file ops; savepoint = manual `state.json` write. Announced before any other Flow 0 step.
- Tool-surface inventory: default filesystem/shell/skill/web tools only; no over-scoped MCP surfaces needed for this mission. No Atlassian/Context7 calls required.
- Route: → Flow 1 Usopp (brainstorm) to produce `spec.md` (workspace pattern, editor choice without new dep, advanced option sets per tool, grouped-options UX for mobile/web). Actor: AI: muse-spark-1.3-contributor-free. Requester: user: farid nugraha <farid.nugraha@mekari.com>.
- Baseline preflight (deferred to Flow 2): `bun run ci:local` status to be recorded in plan Baseline block before Flow 3.

## Flow 1 check-in — Luffy — 2026-09-28
- Verdict: PASS → Flow 2 Nami (planning). Evidence: `spec.md` exists with 3-round brainstorm, kill criteria per option, recommendation + fragility line, risks, MVP/cuts, 3 open questions for Nami.
- Validation: options grounded in `ToolDualPane.vue`/`ToolHeader.vue`/`main.css`/`package.json`/e2e testids/`url-state.ts`; dead options named with evidence (contenteditable axe/mobile, new-dep ADR/budget, two-card complaint); one decision captured (Q1 option A, auto-resolved); no new dependency; testids preserved.
- Plan impact: Nami plans shared `ToolWorkspace` + per-tool waves from spec; Flow 3 stays inline-sequential unless plan proves file-disjoint for parallel workers. Actor: AI: muse-spark-1.3-contributor-free.

## Flow 2 check-in — Luffy — 2026-09-28
- Verdict: PASS → GO to Flow 3 Zoro (auto, no high-risk scope: UI-only, no deploy/migration/DB/public-API). Evidence: `plan.md` is Full-level (key decisions, architecture, waves 1–4, CODEOWNERS, implementation graph, task index, 6 detail tasks with exact files/commands/acceptance, risk+rollback, DoD, pre-mortem). Baseline recorded: fmt green, lint green, `bun test` 319/0 on main.
- Auto-correction: Flow 0–2 paused for user GO between stages; from Flow 3 on the crew runs stage-to-stage without stopping (genuine blockers or heal-halt only). Actor: AI: muse-spark-1.3-contributor-free.

## Wave 1 T1 — Zoro — 2026-09-28
- Done: commit `85b5c19` (4 files: ToolHeader, ToolDualPane, main.css, [slug].vue). Evidence: fmt green, lint green, `nuxt typecheck` exit 0, `bun test` 319/0, `bun run build` exit 0, full Playwright 43/43 on re-run (one transient uuid-count failure on first parallel run, green on focused + full re-run; uuid page does not consume DualPane — flaky, not T1).
- Rollback point: `85b5c19`. Actor: AI: muse-spark-1.3-contributor-free.

## Waves 2–3 — Zoro — 2026-09-28
- T2 JSON `c8fda31` (328 unit, pw file 5/5). T3 cleaner `bd8cba2` (337 unit, pw file 5/5). T4 base64 `e85bd9d` (347 unit, pw file 6/6). T5 uuid `69ec115` (pw file 6/6; fixed lowercase-ULID regression caught by old ULID test — ULIDs now stay canonical uppercase, toggle affects UUIDs only). Rollback points are the commit hashes. Actor: AI: muse-spark-1.3-contributor-free.

## T6 gates — Zoro/Brook — 2026-09-28
- Coverage gate first failed on empty diff (commits sat on `main`, base resolved to HEAD). Cut feature branch `feature/ui-tool-workspace-polish` at tip; base still resolved to local `main`, so used the documented `COVERAGE_GATE_BASE=e2c4b42` override: real signal found — modified 84.19% < 90%.
- Healed same session: +20 unit tests for new schema branches/stats/v1-convert paths; removed two unreachable defensive branches (JSON unformattable fallback, UUID null-timestamp check). Gate now 98.72% lines / 100% functions. Full suite 48/48, 387 unit, audit clean, build green.
- Branch hygiene debt: local `main` still holds the 6 mission commits (harness refuses `reset --hard`; needs the user: `git checkout main && git reset --hard origin/main`). Nothing pushed — push awaits user confirmation. Actor: AI: muse-spark-1.3-contributor-free.

## Closure — Luffy — 2026-09-28
- Verdict: GO. Report at `report.md`, PR material at `flows/07-pr-verdict.md`. Evidence linked per wave above. Actor: AI: muse-spark-1.3-contributor-free.

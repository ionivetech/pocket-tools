# pockettools-ux-round2 (Lane 3 Full, stacked on feature/ui-tool-workspace-polish)

## Waves
| Wave | Focus | Tasks | Gate |
|------|-------|-------|------|
| 1 | Toast + ToolSwitch foundations | T1 plugin/layout/ToolActions, T2 ToolSwitch + replace booleans in 4 tools | unit + lint + json/cleaner/base64/uuid pw files |
| 2 | Shell + pages | T3 sticky/spacing/header/offline-note/footer-removal/back-to-top, T4 tools favorites-first, T5 home palette + polish | shell/tools/home pw |
| 3 | Mobile drawer + UUID restructure | T6 DualPane drawer + e2e helper, T7 UUID two-card converter + e2e | focused pw + axe/44px/375px |
| 4 | Gates + evidence | T8 full ci chain + screenshots + commits | ci green, modlens audit clean |

CODEOWNERS: `app/components/ToolActions|ToolSwitch` T1–T2; `app/tools/*/` per-tool; `app/{pages,assets}/` T3–T5; e2e alongside. Sequential (shared shell first).
Rollback per wave commit; fallback for drawer/switch regressions is the current inline UI (git history).
Acceptance per task: named pw files green + `bun run ci:local` chain at T8.
Pre-mortem: likeliest failure is PrimeVue service/component weight leaking into the home chunk or a Drawer focus-trap axe failure — countered by keeping Toast/Drawer usage measured (home-budget e2e) and running axe on every touched spec.

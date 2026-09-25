# Todos — pockettools-phase0-nuxt

Mode: semi · Branch: `feature/phase-0-nuxt` · Commit style: conventional · `auto_commit=on` (overridden: no commit) · Base branch: `main` · Ship verdict: GO for PR.

## Flow 8 — final review blocker follow-up

- [x] Replace the remaining detail-page PrimeIcons binding with `AppIcon` ([execution evidence](01-execution.md#flow-8-follow-up-final-review-blockers--done))
- [x] Correct category-group and theme-toggle accessibility semantics ([execution evidence](01-execution.md#flow-8-follow-up-final-review-blockers--done))
- [x] Match hashed Nuxt JS/CSS in the bounded PWA precache and verify `sw.js` ([execution evidence](01-execution.md#flow-8-follow-up-final-review-blockers--done))
- [x] Add minimal detail-icon and PrimeIcons-regression Playwright assertions ([execution evidence](01-execution.md#flow-8-follow-up-final-review-blockers--done))
- [x] Remove the decorative launcher wrapper's dead `aria-label`, if present ([execution evidence](01-execution.md#flow-8-follow-up-final-review-blockers--done))
- [x] Run focused format, lint, typecheck, Playwright, and build gates ([execution evidence](01-execution.md#flow-8-follow-up-final-review-blockers--done))

- [x] T1 Reset repository and preserve allowlist
- [x] T2 Scaffold Nuxt 4 + Bun baseline
- [x] T3 Configure Oxfmt/Oxc, Tailwind v4, PrimeVue 4.5.5
- [x] T4 Build visual system and Aura blue tokens
- [x] T5 Build scalable non-sidebar shell
- [x] T6 Add PWA baseline and resilient states
- [x] T7 Prove quality, UX, accessibility, performance
- [x] Flow 8 healing cycle 1 — resolve audit blockers
- [x] Re-run checkpoint, quality, gates, review, security, and ship verdict
- [x] Rewrite `CHANGELOG.md` and add GitHub PR CI workflow
- [x] Verify dev PWA warning short-circuit
- [x] Run final `bun run ci:local` and Lighthouse/smoke checks
- [ ] Delete mission `evidence/` before the final feature commit
- [ ] Commit and push the healed feature branch
- [ ] Archive mission and push archive cleanup
- [ ] Hand off `feature/phase-0-nuxt` for PR to `main`

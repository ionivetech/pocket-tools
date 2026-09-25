# Gates — pockettools-phase0-nuxt

## Final gate verdict: PASS

The final healing pass is verified on `feature/phase-0-nuxt`. Raw evidence is intentionally removed after the final report is written, per user request; the measured results are preserved in `report.md`.

| Gate | Verdict | Result |
|---|---|---|
| Format | PASS | `bun run fmt:check`, 37 files |
| Lint | PASS | `bun run lint` |
| Typecheck | PASS | `bun run check` |
| Unit | PASS | 3 tests, 6 assertions |
| Unit coverage | PASS (scoped) | 100% functions/lines for `app/data/tools.ts`; initial-import exception documented |
| Dependency audit | PASS | `bun audit`: no vulnerabilities |
| Production build | PASS | Nuxt/Nitro build, 6 routes prerendered, PWA precache 41 entries / 443.00 KiB |
| E2E | PASS | 15 Playwright tests |
| Accessibility | PASS | Axe serious/critical violations: 0; 44px target assertions pass |
| PWA/offline | PASS | Registration, static fallback, fresh context/unvisited route, runtime cache tests pass |
| Responsive | PASS | 375/768/1440 light and dark evidence |
| Lighthouse mobile | PASS | Performance 96, FCP 2.1s, LCP 2.3s, CLS 0, TBT 30ms, accessibility/best-practices/SEO 100 |
| Lighthouse desktop | PASS | Performance 100, FCP 0.5s, LCP 0.5s, CLS 0, TBT 0ms, accessibility/best-practices/SEO 100 |
| Dev PWA warning | PASS | `/dev-sw.js` and query return 204; zero `VUE_ROUTER_R0004` |
| Diff size | WAIVED (user-directed cleanup) | 819 insertions / 22,579 deletions; 22,172 deletions are the already-pushed raw evidence files the user explicitly ordered removed. The remaining 407 deletions are the planned PrimeIcons/font removals and superseded artifacts. Waiver is limited to this cleanup and archive commit. |
| DoD | PASS | Phase 0 checklist and final route smoke pass |

## Limitations

- `bun pm scan` is unavailable because no optional scanner is configured; `bun audit` is the supported check and passes.
- Lighthouse INP is `notApplicable`; TBT and interaction flows are recorded instead.
- GitHub's remote default-branch setting still requires authenticated `gh` or repository settings; the branch itself exists and is pushed.

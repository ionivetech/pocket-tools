# Decisions — pockettools-ux-round2

## Flow 0 — Luffy (triage) — 2026-09-28
- Classification: Explicit (13 concrete notes) + Exploratory (palette/switch/drawer patterns need taste judgment). Reason: every item names its surface and expected behavior; taste-skill used for the enterprise bar, not for discovery.
- Design read: utility-tool product UI for everyone, calm PrimeVue/Aura-blue language, Tailwind tokens. Dials: VARIANCE 4, MOTION 3, DENSITY 5. Pulling only the universal rules (one accent, one radius, real states, 44px, visible focus, reduced-motion) — landing-page devices stay off.
- Lane: 3 Full. Reason: ~14 files across shell/pages/4 tools + new global service (Toast) + palette + drawer pattern + UUID restructure + e2e updates everywhere; full gates required. Never drops.
- Mode: auto, solo, inline-sequential. CLI still degraded. Baseline: `f23bcf5` green on `feature/ui-tool-workspace-polish`; stack on it (still unpushed).
- Key technical calls (auto-resolved, recorded): PrimeVue Toast via local plugin + one global `<Toast>` in default layout (service is tiny; component cost measured by home-budget e2e); booleans unified into a new `ToolSwitch` (label row + real ToggleSwitch input stretched to 44px — plain checkboxes would fail the repo's own touch-target gate); mobile options via DualPane bottom Drawer moving the single toolbar DOM node (no duplicate IDs); UUID restructured to options+readonly result on top, two converter cards below; sticky fixed with `overflow-x: clip` (hidden breaks sticky); footer removed from tool pages, offline note moved into header.
- Route: → Flow 2 compact plan → Flow 3 execute wave by wave without stopping. Actor: AI: muse-spark-1.3-contributor-free. Requester: user: farid nugraha <farid.nugraha@mekari.com>.

## Flow 9 closure — Luffy — 2026-09-28
- Verdict: GO. Evidence: `bun run ci:local` exit 0 (398 unit, 53 Playwright, typecheck 0, registry 6/0, audit clean, coverage new 100% / modified 100%, build green), recorded in `report.md`. Stability proven: 5x full suite, 5x uuid repeat-each, 6x 404 repeat-each — all green, zero retries.
- Flake handling (not masked): the recurring uuid/404 failures were traced to prerendered tool markup being clicked before mount; fixed with real readiness signals (`data-tool-ready`, `data-error-ready`), which also fixed a live UX defect (dead 404 recovery buttons). Latent `ToolComponentLoader` type bug fixed at the source.
- Coverage discipline: gate rejected the new `useResponsivePosition` module; logic extracted to a unit-tested `responsive-position.ts`, lifecycle shell allowlisted with a reason, and its behaviour asserted in Playwright.
- Ship: branch `feature/ui-tool-workspace-polish` (15 commits, 3 missions) with `pr-verdict.md`. Push awaits user confirmation per the standing rule; local `main` reset is the user's command since the harness refuses `reset --hard`.

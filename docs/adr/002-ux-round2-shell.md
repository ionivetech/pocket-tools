# ADR 002 — UX round 2 shell (toast, switches, palette, drawers)

Status: accepted (2026-09-28). Follows ADR 001.

## Context

Thirteen UX notes demanded PrimeVue toasts, a unified switch control, a global
quick-search palette, a mobile options drawer, and a restructured UUID page —
all PrimeVue components, per the repo's component-system rule.

## Decision

- Toast: `ToastService` via a tiny `app/plugins/primevue-toast.ts`; one
  `<Toast>` per tool route (`tools/[slug].vue`), never in the entry chunk, so
  the 120 KiB home JavaScript budget keeps passing.
- Booleans unified into `ToolSwitch` (label row + real `ToggleSwitch` whose
  native checkbox is stretched to the 44px hit area the repo gate measures).
  Plain checkboxes were rejected: their 22px box fails that same gate.
- Palette: global `Ctrl/⌘+K` from the default layout, UI in an async
  `PaletteDialog` (PrimeVue `Dialog`, `v-if` mounted) with the search field in
  the dialog header (fixed) and a scrollable capped results list.
- Mobile options: `ToolDualPane` moves the single toolbar DOM node into a
  bottom `Drawer` (no duplicate IDs), with a bounded rAF settle loop because
  the drawer body renders lazily.
- Bundle impact: precache 951.2 → 1025.6 KiB (Dialog + Toast + ToggleSwitch
  chunks, all lazy). Largest single chunk still 223.8 KiB < 256 KiB per-file
  cap (offline safe). Total budget raised 1024 → 1088 KiB deliberately.
- Home initial JavaScript: 117.6 → 127.0 KiB. The palette's `Dialog` chunk
  (6.5 KiB compressed) ships with the shell because Ctrl/⌘+K is a global
  keyboard affordance, not a page feature. Home JavaScript budget raised
  120 → 128 KiB with that measurement recorded in the e2e test; demand-loading
  the palette was tried first and measured _worse_ (131.4 KiB) because Nuxt
  preloads dynamic imports, so the static import is the smaller honest cost.
  Both surfaces (palette, tool options) are `Dialog` with
  `breakpoints: { mobile: 'bottom' }`, per the UX review: modal on desktop,
  bottom sheet on a phone.

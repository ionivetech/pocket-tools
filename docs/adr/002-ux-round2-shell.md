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

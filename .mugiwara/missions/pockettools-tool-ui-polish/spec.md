# Spec — pockettools-tool-ui-polish (Flow 1 Usopp brainstorm)

## Problem
Tool detail pages feel cramped: `ToolHeader` is a bordered gradient card capped at 720px, and it visually sticks to the workspace cards below. The four tools use raw `Textarea` pairs (JSON, cleaner, base64) with few options scattered inline, and the UUID tool is a loose control row + list. Request: full-width eye-catching header with real spacing, one-card side-by-side input/result workspaces with a divider (stacked on mobile), a code-editor feel for JSON without a new dependency, richer but grouped options per tool, and a UUID↔ULID converter.

## Design read
Tool workspace for everyday users + developers, calm PrimeVue/Aura-blue language, Tailwind tokens. Dials: VARIANCE 4, MOTION 3, DENSITY 5 (workspace, not landing; taste-skill Sections 4–6 apply, landing-only devices do not).

## Round 1 — Understand (sharp questions, auto-resolved)
- Q1: JSON editor — [A] zero-dep enhanced textarea [B] contenteditable highlight [C] new dep (CodeMirror/Shiki)? Auto-decision: A. Reason: `package.json` has zero editor deps; AGENTS.md forbids new deps without ADR/Phase-0 requirement; prior mission hit PWA/JS-budget findings. Recorded as the one user decision (auto-resolved, actor AI).
- Q2: Single-card workspace — one shared `ToolWorkspace` vs per-tool CSS? Auto-decision: one shared pattern (rework `ToolDualPane` + `main.css` tokens), per-tool slots for options.
- Q3: Options placement — toolbar row vs grouped fieldsets vs sidebar? Auto-decision: grouped `<fieldset>` + `<legend>` toolbar above the single card (3-col desktop → 1-col mobile), never a left sidebar (AGENTS.md forbids permanent left-sidebar shell).

## Round 2 — Options with kill criteria
### Shared shell
- O1 Plain header (no card, no wash). Dies if user finds it flat vs "eye catching" request.
- O2 Full-width gradient band header (100% width wash, no border). Dies if it reintroduces card-clutter or breaks one-theme lock.
- Chosen: O2-lite — full-width, borderless, subtle blue wash at 8–10% + display h1 + privacy strip with `border-t`; page width 900px → 1180px for workspace tools; header→workspace gap 2.5rem via token. Grounded in `main.css` `.pt-detail-card` (lines 1177–1219) and `[slug].vue` stacking Header/Host/Footer with zero gap.

### JSON editor
- O-A Enhanced textarea (gutter line numbers aria-hidden + scroll-sync, Tab inserts indent, error-line highlight, click status jumps to line, mono, stats bar). Dies if caret/gutter sync proves unusable on mobile keyboards.
- O-B contenteditable pre/code highlight. Dies if axe fails (focus/announce) or mobile keyboards misbehave — high risk, no e2e coverage.
- O-C New dep editor. Dies if ADR/JS-budget/PWA precache fails — kills immediately: no ADR exists, `package.json` has no editor, AGENTS.md gate explicit.
- Chosen: O-A. Preserves `json-formatter-input/output/status/format/minify/indent` testids so `tests/e2e/json-formatter.pw.ts` `fill()`/`toHaveValue()` keeps working.

### Workspace card
- O1 Two separate cards (current `ToolDualPane`). Dies if it keeps the "cards sticking together" complaint.
- O2 One card, divider inside (vertical `border-left` desktop → horizontal `border-top` mobile, equal heights via stretch, min-height 320px). Dies if 375px overflows horizontally.
- Chosen: O2, shared component + tokens, `prefers-reduced-motion` respected, divider uses `--pt-line`.

## Round 3 — Validate + converge
Checked against: `app/components/ToolDualPane.vue` (two `.pt-tool-state` cards, `md:grid-cols-2`), `ToolHeader.vue` (`.pt-detail-card`), `main.css` `.pt-detail-page` 900px + `.pt-tool-state`, `package.json` deps, e2e testids above, `url-state.ts` flat-primitive share state (new options must stay primitives to keep `?s=` links working). All options survive except O-B/O-C/O1 per kill evidence. Converged recommendation below.

## Recommendation
1. Shared: borderless full-width `ToolHeader` + `ToolWorkspace` single card with divider + grouped options fieldsets. One blue accent, one radius (`--radius-panel`/`--radius-control`), real `<label>`s, verb-first buttons, 44px targets, visible focus, full empty/loading/error/success/offline states.
2. JSON: enhanced-textarea code editor + toolbar groups [Mode: Format|Minify segmented] [Indent: 2/4/Tab + Sort keys switch] [Sample|Clear|Copy escaped] + gutter + error jump + stats bar (size, lines, keys, depth). No new dep.
3. Cleaner groups: [Whitespace: trim, collapse, trailing-space, line-ending LF/CRLF/keep] [Lines: remove empty, remove duplicates, sort?] [Case: existing 5] [Strip: HTML tags]. Stats: words/chars/no-spaces/lines + reading time + removed count.
4. Base64 groups: [Direction: Auto|Encode|Decode segmented] [Format: URL-safe switch, wrap none/64/76, newline LF/CRLF] + file drop stays. Status shows detected direction + byte size.
5. UUID groups: [Generate: type select, count stepper, uppercase switch, hyphens switch (UUID only), Generate IDs] [Results: list + per-row copy + copy-all + download] [Converter: paste ID → Detect → inspect (type, version, timestamp ISO for v7/ULID, nil handling) → Convert timestamp-preserving both directions]. Converter is honest: keeps 48-bit ms timestamp, regenerates randomness; never claims lossless bit mapping (v7 version/variant bits vs ULID 80-bit rand differ).
- Fragility: this recommendation dies if a new editor dependency gets approved via ADR (then O-C reopens) or if 375px tests show the single-card divider overflows (then O1 fallback per-tool).

## Mockup (structure only)
```
[full-width header: kicker / H1 / description / privacy border-t]
<gap 2.5rem>
[fieldset toolbar: Group A | Group B | Group C]   (3-col → 1-col mobile)
[single card workspace
  input pane (label, editor, hint) || divider || output pane (label, result, actions)
]  (side-by-side → stacked, result below, on mobile)
[status/stats bar]
```

## Risks / unknowns
- Gutter scroll-sync + Tab handling must not break screen-reader announcements or mobile keyboards; needs axe + 375px e2e proof.
- `?s=` share state must stay flat primitives; sort-keys/wrap/urlSafe booleans are safe, but large text still capped by `URL_STATE_MAX_BYTES`.
- UUID↔ULID wording must avoid implying lossless conversion; copy must say "timestamp-preserving".
- Slop risks: generic card grids, unmotivated gradients, template-shaped layouts — mitigated by one wash, one radius, one accent.

## Open questions for Nami
- Sort-keys default off? Wrap default none? URL-safe default off? (propose all off/keep).
- Converter copy wording approval ("timestamp-preserving conversion").
- Widen `.pt-detail-page` to 1180px for all tools or per-tool class?

## What to cut (nice-to-haves, out of MVP)
JSON tree/fold view, JSON5/comments, jq filter, schema validation; cleaner regex find/replace, emoji strip, transliteration; base64 image preview, streaming; UUID bulk convert, custom timestamp input, prefix/suffix. Ship grouped MVP above; revisit cuts only with new evidence.

## Validation checklist
- [x] Every option grounded in codebase/web facts, zero guessed versions.
- [x] Every option has a pre-research kill criterion; dead options named with evidence (O-B axe/mobile, O-C ADR/budget, O1 complaint).
- [x] One user decision captured (Q1 option A, auto-resolved and logged).
- [x] Recommendation has reasoning + fragility + risks.
- [x] MVP vs cuts separated.
- [x] Spec written with Nami's open questions.

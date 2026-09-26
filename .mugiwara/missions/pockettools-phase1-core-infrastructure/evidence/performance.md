# Phase 1 Performance Evidence

- Measured at: `3dc815d`
- Command: measured against the built app, mirroring the budget test in `tests/e2e/tool-infrastructure.pw.ts:150`
- Initial JavaScript: `111,213 B` across 11 resources / budget `122,880 B`
- Initial CSS: `5,993 B` across 1 resource / budget `30,720 B`
- Lazy tool chunks: excluded from initial transfer totals
- Result: PASS — headroom 11,667 B on JS, 24,727 B on CSS
- Enforced by: `tests/e2e/tool-infrastructure.pw.ts`

**Re-measured, not carried forward.** Identical to the `2343df1` measurement, verified by re-running
it: waves R7 and R8 changed documentation, the PWA cache rule, and the coverage gate script, and
**zero `app/` files**, so the initial transfer is unchanged. The budget test itself is byte-unchanged
since `5d63a7c`, so the method is provably the same.

History: the figures were first `111,204 B` / `5,680 B` at `ca9b5ec`. The CSS figure genuinely moved
to 5,993 B during R4 because `app/data/tools.ts` changed and is bundled data a measured route renders
from — which is why an earlier revision was re-measured rather than relabelled. The file also carried
a "human waiver" note about the `Response has been disposed` race; **deleted**, root-cause fixed in
`7999bbd`.

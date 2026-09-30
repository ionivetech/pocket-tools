# Flow 8 — healing cycle 2 (review + security)

Commit: `8fccd9b`. Trigger: Flow 7 independent review (Robin) and security audit
(Jinbe). Cycle 2 of a maximum of 3.

## What the reviewers found

Robin: 2 blockers (QR format string, markdown renderer loop) + lower findings.
Jinbe: 2 blocking availability defects (markdown loop, regex ReDoS) + 7 security
findings. Both agreed the markdown loop was the worst defect. "No user data
leaves the browser" was upheld.

## Root causes, not symptoms

| # | Root cause | Fix |
|---|---|---|
| Markdown freeze | The catch-all paragraph branch could consume **zero** lines: a line satisfying the paragraph terminator (`***`, `# `, `---`) while matching no block branch, because the rule branch requires a bare `***`. The loop never advanced. | The branch now consumes the line, guaranteeing progress. 10 regression inputs. |
| Regex freeze | Event loop cannot be timed, and input caps do not bound backtracking. A 34s freeze was reachable from a share link. | Scan moved to `app/workers/regex-tester.worker.ts`; the UI terminates it after 2s. Validation and compile checks still run inline so common cases never spawn a thread. |
| QR unreadable | The format-information reader **mirrored the writer**, so the round-trip test could not detect a wrong bit order. Level L was rejected by an independent decoder at every mask while M passed. | Reader pins the spec's LSB-first numbering against a literal format word and asserts the mirrored arrangement is rejected. **L removed** rather than shipped unproven; M verified 7/7 by jsQR. |
| Credential persistence | `useToolHistoryRecorder` + URL state wrote a bearer token to localStorage and the query string. | Both removed; e2e asserts the token appears in neither. |
| Basic auth crash | `btoa` throws above U+00FF, so any non-Latin-1 password failed the whole conversion. | UTF-8 encode before base64. |
| Image bomb | A 10 MB byte cap never bounded decoded memory. | 40 MP ceiling checked after decode, before any canvas allocation. |
| `node:crypto` fallback | Could never work in a browser bundle. | Removed; missing Web Crypto fails honestly. |
| NUL placeholder | A literal NUL in user text could collide with the internal sentinel. | Stripped at the input boundary, not in `escapeHtml` (which also runs over the internal placeholders — doing it there broke fenced code, caught by an existing test). |
| Misleading PWA glob | `**/ToolComponent.*.js` matched nothing while reading as if it worked. Nuxt emits hash-only chunk names (`2uch8Usm.js`), so tool JS is **not** matchable by any glob. | Deleted the dead pattern; the comment now records the verified evidence (20 dot-named CSS files, 0 matching JS). |
| Date RangeError | `Number.isNaN(parsed)` rejects unparseable text but not a large finite number that overflows `Date`; `toISOString` then threw outside the `Result` contract. | `Number.isNaN(date.getTime())` guard returns `invalid_date`. |

## Corrections to prior claims

- **The earlier "format bits are reversed" fix was wrong.** The spec numbers
  format positions LSB-first at position 0; the committed reader was mirrored.
  The wrong fix survived one review because reader and writer agreed with each
  other. Root cause: a self-confirming test. Now pinned to a literal word.
- **"ToolComponent-HASH.js" was wrong.** Build output is `ToolComponent.HASH.css`
  for CSS; JS chunks carry no component name at all.
- Robin's "image controls are inert" is a **false positive**: `plan` is a
  `computed` over `targetWidth`, so the estimate updates live.

## Verification

`bun run ci:local` exit 0 — 554 unit pass, 113 Playwright pass, coverage
93.01% new / 91.18% modified, build clean, no duplicated-import warnings.
Out of tree: jsQR read 7/7 M matrices (unicode + a realistic order string).

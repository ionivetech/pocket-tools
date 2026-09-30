# Cross-mission lessons

Append-only. Captured at closure, surfaced at triage.

## 2026-09-30 — pockettools-phase4-mvp-tools

### A round-trip test whose reader shares the writer's assumptions proves nothing

The QR format-information bug survived a full review cycle because the round-trip
test re-read the matrix using the same mirrored bit order the writer used. Writer
and reader agreed, the test went green, and the codes were unreadable by any real
scanner. It survived a second pass too, until a **third-party** decoder was run
against the output.

- Pin layout conventions to a **literal** constant, not to a value the writer
  produced: assert bit `i` of a known word lands at position `i`.
- Also assert the **wrong** arrangement is rejected. A test that only confirms the
  happy path passes just as happily when both sides are wrong together.
- When a test's reader and the code under test share an assumption, that
  assumption is the untested thing. Move it to a constant or get an outside
  decoder.

### Verify a subagent finding before acting on it — and verify the fix before shipping it

Three claims turned out to be wrong in one cycle: the format bit order (my own,
already "fixed" once in the wrong direction), the PWA chunk naming (both halves
invented; the built name was `ToolComponent.HASH.css` and tool JS carries no
component name at all), and "image controls are inert" (a `computed` already
handled it). Meanwhile a reviewer claim of a "34s ReDoS" could not be reproduced
in the local runtime at all.

- A finding is a hypothesis with evidence attached, not a verdict. Check the
  evidence, then check whether the fix is real.
- A "fix" that makes a previously-passing test fail is telling you the test was
  wrong in an interesting way. Read the failure before working around it.
- When a fix cannot be reproduced locally, say so in the report and prove the
  *mechanism* instead. "Any slow pattern is abandonable" is true everywhere;
  "this pattern takes 34s" was not true in this runtime.

### Two process guards worked, and are worth keeping

The coverage gate refused two new modules with no unit coverage, and the
`ABSENT_FROM_LCOV_ALLOWLIST` test refused the widening by name. Both turned a
"just this once" into a deliberate, reviewed edit with a recorded reason. The
diff-size exception went into the decision log against the mission rather than
into the gate config, which is what kept the cap meaningful for the next task.

### Ship the provable subset

When one error-correction level could not be proven against an independent
decoder and the cause stayed unknown, the level was removed rather than shipped
and documented as "probably fine". M-only at 106 bytes is a smaller feature that
works; L at 106 bytes that some scanners reject is a bug waiting for a user.

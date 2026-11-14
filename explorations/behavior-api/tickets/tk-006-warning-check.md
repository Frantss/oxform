# TK-006: Second check (`warning`) proves registration and `exclusive`

A second check is the real test of check registration and of the `exclusive` flag.

**Dependencies:** TK-004.

**Maps to:** Checks section (`warning` does not block, `risk` blocks); Inner workings 4
(`exclusive` replaces all its issues in scope; other checks refresh only entries of the selected
event and keep untyped ones); open question 2.

**Verification:**

- `warning` issues do not change `valid`.
- An event refresh leaves untyped `warning` entries intact.

# TK-005: `defineForm`, `configureForm` and `extendForm` runtime

Assembles behaviors into a form definition and an instance.

**Dependencies:** TK-004.

**Maps to:**

- Concepts table: `defineForm`, `configureForm`, `extendForm`, `configured`.
- Options section: option kinds, `ctx.options()` and `ctx.onOptions`.
- Open question 9 (option sources): the spike implements "later wins" as a proposal only.

**Verification:** the `type-tests/` consumer cases still hold against the real runtime.

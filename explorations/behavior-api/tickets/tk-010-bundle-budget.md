# TK-010: Bundle budget in tiers

Checklist criteria 5a to 5c cannot be decided without measurement.

**Dependencies:** TK-005, TK-006.

**Maps to:** Plan step 3. Measure minified, gzipped and tree-shaken size, and compare with
today's `@oxform/core`. Set a budget from the result and add it to CI.

- Tier (a): values and one check.
- Tier (b): the lean login form.
- Tier (c): the full preset. Blocked: it needs behaviors the spike does not build. See the
  coverage gaps in the [readme](./readme.md).

**Verification:** a CI job fails when a measured tier exceeds its budget.

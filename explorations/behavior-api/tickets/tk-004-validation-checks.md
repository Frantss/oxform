# TK-004: `createValidation` and `createCheck` with the `error` check

Validation runs registered checks per event and shares the stale-result lanes.

**Dependencies:** TK-003.

**Maps to:**

- Checks section: `blocking`, `exclusive`, the issue `type` added by the check, results grouped
  by check name.
- Inner workings 4: implicit registration; `valid` is true while no check is registered.
- Open question 3 (registration) stays open. The spike must not close it silently.

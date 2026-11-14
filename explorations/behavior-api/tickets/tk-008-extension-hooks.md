# TK-008: Hooks for extensions

Extensions reach the form only through these hooks.

**Dependencies:** TK-003, TK-004.

**Maps to:** "Extensions" hook table rows `values.intercept` with `details.cancel()`,
`values.onChange` and `validation.onRun`.

**Excluded:** `submit.intercept` and `submit.onResult`. Submit is not in the spike. See the
coverage gaps in the [readme](./readme.md).

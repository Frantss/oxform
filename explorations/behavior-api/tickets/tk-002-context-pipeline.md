# TK-002: Context and change pipeline

`createChange` is the only path for value changes, so every later behavior builds on it.

**Dependencies:** TK-001.

**Maps to:** Inner workings 1 (context: `store`, `options()`, `onOptions`, `onDestroy`,
`instance()`, `slice`) and 2 (interceptors, then write, then listeners; `details` carry `reason`,
`source` and `cancel()`).

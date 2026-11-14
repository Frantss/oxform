# TK-001: Spike package scaffold with type tests wired in

The spike needs an isolated home so it cannot affect `@oxform/core`.

**Dependencies:** None.

**Maps to:** Plan step 2 (throwaway package). `type-tests/` must keep passing.

**Verification:** `tsc` over `type-tests/` passes against the new package. `pnpm run check:all`
is unaffected for existing workspaces.

---
id: TK-004
title: Module-sharing proof
phase: 1
work_package: P1-03
status: done
depends_on: [TK-003]
branch: codex/P1-03-module-sharing
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-004: Module-sharing proof

## Outcome

All four built core entry points reach one copy of an internal channel. A spec fails if a source module is
emitted in two chunks, or if a built entry exports an `*Internals` name.

## Scope

- In: a placeholder `WeakMap` channel in a placeholder module, reached through every entry point. The Node
  specs in `packages/core/tests/package/`: an object made through one entry is known to the others, no source
  module is in two chunks, and no built `.d.ts` entry exports an `*Internals` name. The `test:package` script
  of core, run on `dist`, and its step in `check:package`.
- Out: the real channels of `01#5` (phase 2 and 3). The tree-shaking check (TK-005). The "preset uses only
  public exports" spec (TK-030).

## Read first

- `02-structure.md#Entry points and shared chunks`: why one pack configuration shares modules, and the two
  approaches.
- `02-structure.md#Source tree`: rules for internal channels.
- `03-testing.md#Packaging layer`: the row "Entry-point module sharing".
- `01-public-api.md#5. Internal channels`: what the placeholder channel stands for.

## Decisions to apply

- D05: keep bundled entries with shared chunks. If a module is in two chunks, set `unbundle: true` in the core
  pack configuration and record it.
- R01: this ticket retires the risk that several entries do not share chunks.
- Gap 6: the "no source module in two chunks" spec is part of `test:package`.

## Acceptance

- [x] `vp run @oxform/core#test:package` passes after `pnpm run build`.
- [x] The sharing spec fails when the channel module is copied into a second chunk (check it once by hand, for
      example with a second pack configuration, and revert).
- [x] `vp run @oxform/core#check:package` runs `test:package` and passes.

## Evidence

- Channel: the placeholder `WeakMap` from a form to its extensions in `src/main/form.ts`. The spec reaches it
  through all four built entries: `defineForm` (`.`), `standard` (`./presets`, which applies `values` from
  `./behaviors`) and `slotsOf` (`./adapter`).
- `tests/package/module-sharing.spec.ts` (10 tests) imports the entries by package name, which resolves through
  `exports` to `dist`: with `dist` removed, the run fails with `Failed to resolve entry for package
  "@oxform/core"`. It checks that one channel instance is shared, that no source module is in two chunks (the
  `sources` of every `.js.map`), and that no entry exports an `*Internals` name at runtime or in its `.d.ts`.
- Chunk list of `dist`: the entries `index.js`, `behaviors.js`, `presets.js`, `adapter.js`, and the shared
  chunks `form-*.js` (main and internal modules) and `behaviors-*.js`.
- Hand check: with one pack configuration per entry (reverted), "share one instance of a module-private
  channel" and "emit each source module in one chunk only" fail, and the other 8 pass.
- D05: bundled entries with shared chunks are kept. No `unbundle`. R01 is retired.
- The core `test` block no longer spreads the root browser configuration: Vitest 5 inline projects inherit the
  root configuration and merge its arrays, so the root `include` would leak into each project. The `package`
  project runs in Node. `test:package` runs `vp test --project package`, and `check:package` runs it last.
  `@types/node` 26.6.5 is a new core dev dependency (the version that `@oxform/solid` uses).
- `pnpm run check` and `vp run @oxform/core#check:package` pass.

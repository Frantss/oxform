---
id: TK-004
title: Module-sharing proof
phase: 1
work_package: P1-03
status: todo
depends_on: [TK-003]
branch: codex/P1-03-module-sharing
pr: null
started: null
completed: null
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

- [ ] `vp run @oxform/core#test:package` passes after `pnpm run build`.
- [ ] The sharing spec fails when the channel module is copied into a second chunk (check it once by hand, for
      example with a second pack configuration, and revert).
- [ ] `vp run @oxform/core#check:package` runs `test:package` and passes.

## Evidence

Record the command results, the chunk list of `dist`, the D05 path taken (bundled or `unbundle`) and any
deviation from the plan here.

---
id: TK-024
title: Arrays extension
phase: 3
work_package: P3-06
status: done
depends_on: [TK-022, TK-021]
branch: codex/P3-06-arrays
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-024: Arrays extension

## Outcome

`arrays` needs `values` and `status`. Each operation changes the array, shifts or resets the item state, and
keeps stable item ids. Check entries follow their items.

## Scope

- In: `src/behaviors/arrays.ts` with the internal `createArrays`, the `arrays` extension and `arraysInternals`
  (`ids`). The calls to `statusInternals` and `checkInternals.remap`, and the read of the validation link. The
  arrays types of `01#3.3`. The sibling spec, the type tests of these exports, and its line in
  `export/behaviors.ts`.
- Out: `remap` itself and the check rows of `03#check(name, options) (createCheck)` (TK-021). Array handles
  (TK-027).

## Read first

- `01-public-api.md#3.1`: the `arrays` row.
- `01-public-api.md#3.3`: the "arrays" row.
- `01-public-api.md#5`: the `arraysInternals`, `statusInternals` and `checkInternals` rows.
- `01-public-api.md#8`: the insertion updater row.
- `02-structure.md#Source tree`: what `behaviors/arrays.ts` holds, and its channel imports.
- `03-testing.md#Built-in extensions: rows that every one has` and `#arrays (createArrays)`.
- Spike, read only: `explorations/extension-api/spike/src/arrays.ts` and `arrays.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createArrays` is internal.
- D53: read `validation` through the validation link. With no `validation`, change validation does nothing.
- `01#8`: `append`, `prepend` and `insert` take an item. `update` takes an updater of the item at the clamped
  index. `replace` takes an updater of the whole array.

## Acceptance

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `arrays`, also the row "on a
      chain with no `validation`".
- [x] Each scenario group of `03#arrays (createArrays)` has a passing test in `src/behaviors/arrays.spec.ts`.
      Each row that cites `B:` passes.
- [x] Each need (`values`, `status`) has a negative type case and a unit case for its runtime error at
      `create`.
- [x] The specs build the shortest chain and do not import `standard`.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (751 statements, 343 branches).
- `src/behaviors/arrays.spec.ts` (chain: `values`, `status`, `arrays`, or with `validation` and `check('error')`; no
  `standard`):
  - Wrapper rows: exactly the `arrays` api, no state, no option; a `create` without `values` and one without
    `status` each throw and name the extension and the need; on a chain with no `validation` the array changes and
    nothing is requested (D53); `ids` is not on `ArraysApi`; `arraysInternals` refuses an object that `arrays` did
    not make.
  - Append, prepend, insert: end, start with the item state shifted, an index and a negative index, padding after
    the end, an absent array, an item that is a function is stored as the item (an insertion takes no updater,
    `01#8`).
  - Swap and move: the order of the others; same index and an index after the end are no-ops (nothing marked);
    the item state moves with the items.
  - Update: a value or an updater; a clamped index; the state of the item resets; an empty array.
  - Remove: a clamped index; the later states shift; an empty array; validation is always skipped.
  - Replace: an array or an updater; every item state resets and trailing states drop.
  - Marks and validation: the array and its ancestors; change validation of the array when a check has a change
    validator; none without one or with `should.validate: false`; `should.dirty` and `should.touch`; a refused
    write changes nothing.
  - Check entries follow swap, insert and remove through `checkInternals(check).remap`.
  - Item ids: stable between reads; follow swap, move and remove; new for new items; all new after replace; follow
    a write of the array outside `arrays`.
- `export/behaviors.ts` exports `arrays` and `ArraysApi`, `ArrayOperations`; no `createArrays`.
- Type tests: a positive and a negative case for `arrays` (a negative case for each need), `ArraysApi` (a path that
  is not an array, an updater as an inserted item) and `ArrayOperations`.
- Deviations from the spike: `append` has no remap, because no index moves; `move` to the same index is a no-op, so
  it marks nothing.

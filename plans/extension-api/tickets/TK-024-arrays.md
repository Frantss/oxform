---
id: TK-024
title: Arrays extension
phase: 3
work_package: P3-06
status: todo
depends_on: [TK-022, TK-021]
branch: codex/P3-06-arrays
pr: null
started: null
completed: null
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

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `arrays`, also the row "on a
      chain with no `validation`".
- [ ] Each scenario group of `03#arrays (createArrays)` has a passing test in `src/behaviors/arrays.spec.ts`.
      Each row that cites `B:` passes.
- [ ] Each need (`values`, `status`) has a negative type case and a unit case for its runtime error at
      `create`.
- [ ] The specs build the shortest chain and do not import `standard`.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `export/behaviors.ts` exports no `createX` function.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

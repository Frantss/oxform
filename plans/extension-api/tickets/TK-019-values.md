---
id: TK-019
title: Values extension
phase: 3
work_package: P3-01
status: todo
depends_on: [TK-013]
branch: codex/P3-01-values
pr: null
started: null
completed: null
---

# TK-019: Values extension

## Outcome

`defineForm(...).extend(values)` gives an instance with `values` in its api and in its state. A change goes
through one pipeline: interceptors, the write, then the listeners. `values` needs nothing.

## Scope

- In: `src/behaviors/change.ts` with the internal `createChange` (no extension). `src/behaviors/values.ts` with
  the internal `createValues` and the `values` extension. The change and values types of `01#3.3`. The sibling
  specs, the type tests of these exports, and their lines in `export/behaviors.ts`.
- Out: `validation` (TK-020). Status marks on a change (TK-022). Field events that call `values.set`
  (TK-023).

## Read first

- `01-public-api.md#3.1`: the `values` row, "Rules that hold for every built-in" and how a custom extension
  uses `deps.values.intercept` and `deps.values.onChange`.
- `01-public-api.md#3.3`: the "change, values" row.
- `01-public-api.md#9`: G15.
- `02-structure.md#Source tree`: what `behaviors/change.ts` and `behaviors/values.ts` hold, and the rules for a
  `createX` function.
- `03-testing.md#Built-in extensions: rows that every one has` and `#values (createValues, createChange)`: the
  scenario groups to test.
- `03-testing.md#Matrix`: the row "Each built-in extension and its `*Api` type".
- Spike, read only: `explorations/extension-api/spike/src/change.ts`, `change.spec.ts`, `values.ts` and
  `values.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createChange` and `createValues` are internal. `export/behaviors.ts` exports `values` and the types
  only.
- G15 (D24): one details input type for `ValuesApi.set` and `ChangeApi.run`. Remove `source` and `event`.
- G15 leaves `ChangeSource` with no use, but `01#3.3` still lists it. Ask the owner before you drop the export.
  Record the answer under Evidence.

## Acceptance

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `values`. `values` has no need,
      so the rows about a missing need and a chain with no `validation` do not apply.
- [ ] Each scenario group of `03#values (createValues, createChange)` has a passing test in
      `src/behaviors/change.spec.ts` or `src/behaviors/values.spec.ts`. Each row that cites `B:` passes.
- [ ] The specs build the shortest chain and do not import `standard`.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `export/behaviors.ts` exports no `createX` function.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results, the `ChangeSource` answer and any deviation from the plan here.

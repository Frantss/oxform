---
id: TK-019
title: Values extension
phase: 3
work_package: P3-01
status: done
depends_on: [TK-013]
branch: codex/P3-01-values
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `values`. `values` has no need,
      so the rows about a missing need and a chain with no `validation` do not apply.
- [x] Each scenario group of `03#values (createValues, createChange)` has a passing test in
      `src/behaviors/change.spec.ts` or `src/behaviors/values.spec.ts`. Each row that cites `B:` passes.
- [x] The specs build the shortest chain and do not import `standard`.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (349 statements, 145 branches).
- `src/behaviors/change.spec.ts`: write then notify and return `true`, rewrite, chained rewrites, cancel (no write, no
  notify), no notify without a change, details with the default reason, a cancel seen by later interceptors,
  unsubscribe.
- `src/behaviors/values.spec.ts` (chain: `values` alone, no `standard`): exactly the `values` api and state and no
  option; whole and path reads; a path write that keeps sibling references and leaves `defaultValues` alone; updater;
  `false` and no notify for an equal value; interceptors before the write; cancel; the reason reaches listeners; two
  instances stay apart; the store starts from the `defaultValues` of `create`; a later `defaultValues` option does
  not replace the values; the schema never runs, so a schema transformation never replaces the values.
- Wrapper rows: the missing-need rows, the "no validation" row and the "internal channels" row do not apply, because
  `values` has no need and no internal channel.
- `export/behaviors.ts` exports `values` and the change and values types, and no `createX` function.
- Type tests: a positive and a negative case for `values`, `ValuesApi`, `Change`, `ChangeInterceptor`,
  `ChangeListener`, `ChangeApi`, `ChangeDetails`, `ChangeDetailsInput`, `ChangeReason` and `ChangeSource`.
- G15: `ChangeDetailsInput` holds `reason` only. `source` and `event` are gone from the details.
- `ChangeSource`: kept as an export with no use, because the owner was not available to answer during this run. It is
  an open question in the run report.

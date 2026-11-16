---
id: TK-022
title: Status extension
phase: 3
work_package: P3-04
status: done
depends_on: [TK-020]
branch: codex/P3-04-status
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-022: Status extension

## Outcome

`status` needs `values` only. It marks fields on a change and exposes a derived status in the store. It gives
the same results on a chain with `validation` and on a chain without it, where every path is valid.

## Scope

- In: `src/behaviors/status.ts` with the internal `createStatus`, the `status` extension and `statusInternals`.
  Raw and derived status, `defaultStatus` and `defaultFieldStatus`, memoization per path, and the read of the
  validation link. The status types of `01#3.3`. The sibling spec, the type tests of these exports, and their
  lines in `export/behaviors.ts`.
- Out: the `derive` channel of `main/context.ts` (TK-011). Status writes by events, arrays, reset and submit
  (TK-023 to TK-026). The benchmark (TK-035).

## Read first

- `01-public-api.md#3.1`: the `status` row and "How a chain without `validation` works".
- `01-public-api.md#3.3`: the "status" row.
- `01-public-api.md#5`: the `statusInternals` and validation link rows.
- `01-public-api.md#9`: G8.
- `02-structure.md#Source tree`: what `behaviors/status.ts` holds, and the rule that it imports nothing from
  `validation.ts` at runtime.
- `03-testing.md#Built-in extensions: rows that every one has` and `#status (createStatus)`.
- Spike, read only: `explorations/extension-api/spike/src/status.ts`, `derived-status.spec.ts` and the status
  rows of `standard-form.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createStatus` is internal.
- D53: read `validation` through the validation link each time it is used. With no `validation`, the
  stand-in makes every path valid and nothing validating.
- G8 (D24): key `defaultFieldStatus` by path.

## Acceptance

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `status`, also the row "on a
      chain with no `validation`".
- [x] Each scenario group of `03#status (createStatus)` has a passing test in `src/behaviors/status.spec.ts`.
      Each row that cites `B:` passes. The rows marked "Preset" are written new on the shortest chain.
- [x] The need `values` has a negative type case and a unit case for its runtime error at `create`.
- [x] The specs do not import `standard`. Rows that need an issue use a test-local check registration.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (616 statements, 272 branches).
- `src/behaviors/status.spec.ts` (chain: `values` and `status`, or with `validation` and a test-local blocking check
  that registers through `registerCheck`; no `standard`):
  - Wrapper rows: exactly the `status` api, the `status` state and the options `defaultStatus` and
    `defaultFieldStatus`; a `create` without `values` throws and names the extension and the need; on a chain with
    no `validation` every path is valid and nothing validates (D53); the writes are not on `StatusApi`;
    `statusInternals` refuses an object that `status` did not make.
  - Marks: the field and its ancestors, no sibling and no descendant; a flag that the mark does not set stays off; a
    refused change marks nothing; `dirty` stays after a return to the default while `default` follows the values.
  - `valid`: a field reads its own path and the form every path; it follows the issues.
  - Defaults: the `'*'` wildcard and a path over it (G8: keyed by path); the form defaults; form `pristine` stays
    true when submit sets form `dirty`.
  - Derived shape: an entry for each node; `form` and `fields` only, no raw flags; `status.form` and `status.at` read
    it; a path that is not a node gets the defaults; entries follow array items through `remap` and drop for a
    removed item; `validating` while a run is pending; the submit flags.
  - Reset: the whole form (new flags and generation), `keepFields`, one subtree.
  - Memoization: an unaffected entry keeps its reference; the whole status stays when no flag changes; the fields
    stay when only the form changes; a field selector does not fire for an unrelated field.
- The "Preset" rows are written new on the shortest chain. A field change of `events` (TK-023) is a test-local
  `edit`: `values.set`, then `statusInternals(status).mark` when the write happens. The `should` flags of `events`
  are tested in TK-023.
- `behaviors/status.ts` has no runtime import of `validation.ts`; it reads the checks and `validating` through the
  validation link each time.
- `export/behaviors.ts` exports `status` and the status types, and no `createX` function.
- Type tests: a positive and a negative case for `status` (the need `values`, `defaultFieldStatus` by path),
  `StatusApi`, `StatusState`, `FieldStatus`, `FormStatus`, `FormStatusDefaults` and `FieldStatusDefaults`.
- Deviations:
  - A mark leaves out the root `''`, so the fields of the derived status hold only the nodes and the marked paths.
  - The test-local check is written in each spec that needs one. A shared one in `tests/helpers.ts` breaks the
    dependency lint (`tests/**` may not import `#behaviors/*` or `#main/*`), and a shared module in `src` needs a
    sibling spec.

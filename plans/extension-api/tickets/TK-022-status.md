---
id: TK-022
title: Status extension
phase: 3
work_package: P3-04
status: todo
depends_on: [TK-020]
branch: codex/P3-04-status
pr: null
started: null
completed: null
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

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `status`, also the row "on a
      chain with no `validation`".
- [ ] Each scenario group of `03#status (createStatus)` has a passing test in `src/behaviors/status.spec.ts`.
      Each row that cites `B:` passes. The rows marked "Preset" are written new on the shortest chain.
- [ ] The need `values` has a negative type case and a unit case for its runtime error at `create`.
- [ ] The specs do not import `standard`. Rows that need an issue use a test-local check registration.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `export/behaviors.ts` exports no `createX` function.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

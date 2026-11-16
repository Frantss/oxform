---
id: TK-025
title: Reset extension
phase: 3
work_package: P3-07
status: done
depends_on: [TK-023]
branch: codex/P3-07-reset
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-025: Reset extension

## Outcome

`reset` needs `values`, `status` and `events`. `reset.all` restores the defaults, the field state, the issues
and the form status, and clears the element refs unless `keep.refs`. `reset.at(path)` resets one subtree.

## Scope

- In: `src/behaviors/reset.ts` with the internal `createReset` and the `reset` extension. The calls to
  `statusInternals` and `eventsInternals`, and the read of the validation link. The reset types of `01#3.3`.
  The sibling spec, the type tests of these exports, and its line in `export/behaviors.ts`.
- Out: the `reset` slot and the root's `reset` event (TK-028). Reset during a validation run or a submit across
  extensions, I2 (TK-032).

## Read first

- `01-public-api.md#3.1`: the `reset` row and the rule that `reset` needs `events`.
- `01-public-api.md#3.3`: the "reset" row.
- `01-public-api.md#8`: the field reset row.
- `02-structure.md#Source tree`: what `behaviors/reset.ts` holds, and the rule that it imports nothing from
  `validation.ts` at runtime.
- `03-testing.md#Built-in extensions: rows that every one has` and `#reset (createReset)`.
- Spike, read only: `explorations/extension-api/spike/src/reset.ts` and the reset rows of
  `standard-form.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createReset` is internal.
- D53: read `validation` through the validation link. With no `validation`, there is no pending run to discard.
- `01#8`: `reset.at(path, { value? })` honors no `status` and no `keep`. Those exist on `reset.all` only.

## Acceptance

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `reset`, also the row "on a
      chain with no `validation`".
- [x] Each scenario group of `03#reset (createReset)` has a passing test in `src/behaviors/reset.spec.ts`. Each
      row that cites `B:` or `C:` passes. The rows marked "Preset" are written new on the shortest chain.
- [x] Each need (`values`, `status`, `events`) has a negative type case and a unit case for its runtime error
      at `create`.
- [x] The specs do not import `standard`. The `keep` row for checks uses a test-local check registration.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (773 statements, 360 branches).
- `src/behaviors/reset.spec.ts` (chain: `values`, `status`, `events`, `reset`, or with `validation` and two
  test-local checks that register through `registerCheck`; no `standard`):
  - Wrapper rows: exactly the `reset` api, no state, no option; a `create` without `values`, without `status` and
    without `events` each throw and name the extension and the need; on a chain with no `validation` the form
    resets (D53).
  - `reset.all`: the default values, the field state, the entries and the form status; given values keep the
    default values; a status override; `keep.checks` as a list and as `true`; `keep.refs`; `keep.fields` over
    `checks` and `refs`.
  - `reset.at`: the default value of a subtree, its field state and its entries, with the siblings kept; a given
    value. It takes no status and no `keep` (`01#8`, a negative type case).
  - Validation: a pending run is discarded (the write of the root makes it stale); reset does not validate.
- Fix in `behaviors/validation.ts` (TK-020): a write of the root `''` makes every pending run stale, as in the spike.
  The TK-020 code had dropped that rule. A new case in `validation.spec.ts` covers it.
- `behaviors/reset.ts` has no runtime import of `validation.ts`; it reads the checks through the validation link.
- `export/behaviors.ts` exports `reset` and `ResetApi`, `ResetOptions`; no `createReset`.
- Type tests: a positive and a negative case for `reset` (a negative case for each need), `ResetApi` and
  `ResetOptions`.

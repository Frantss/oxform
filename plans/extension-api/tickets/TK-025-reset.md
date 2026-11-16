---
id: TK-025
title: Reset extension
phase: 3
work_package: P3-07
status: todo
depends_on: [TK-023]
branch: codex/P3-07-reset
pr: null
started: null
completed: null
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

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `reset`, also the row "on a
      chain with no `validation`".
- [ ] Each scenario group of `03#reset (createReset)` has a passing test in `src/behaviors/reset.spec.ts`. Each
      row that cites `B:` or `C:` passes. The rows marked "Preset" are written new on the shortest chain.
- [ ] Each need (`values`, `status`, `events`) has a negative type case and a unit case for its runtime error
      at `create`.
- [ ] The specs do not import `standard`. The `keep` row for checks uses a test-local check registration.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `export/behaviors.ts` exports no `createX` function.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

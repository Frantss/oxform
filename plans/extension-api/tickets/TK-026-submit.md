---
id: TK-026
title: Submit extension
phase: 3
work_package: P3-08
status: todo
depends_on: [TK-022, TK-021]
branch: codex/P3-08-submit
pr: null
started: null
completed: null
---

# TK-026: Submit extension

## Outcome

`submit` needs `values` and `status`. `submit.run(intent)` sets the form status, validates, and calls
`onSubmit` or `onInvalid` with the instance. It gives the same results with `validation` and without it, where
every run is valid.

## Scope

- In: `src/behaviors/submit.ts` with the internal `createSubmit` and the `submit` extension. Shared attempts,
  aborts, rejections, `intercept`, `onResult`, the read of the validation link, and the channel imports
  `isDiscarded` and `checkInternals`. Typed check names in `onInvalid` and `submit.onResult`. The submit types
  of `01#3.3`. The sibling spec, the type tests of these exports, and its line in `export/behaviors.ts`.
- Out: the root slot that calls `submit.run` and handles its rejection (TK-028). Change and reset during a
  submit across extensions, I2 (TK-032).

## Read first

- `01-public-api.md#3.1`: the `submit` row and how a custom extension uses `deps.submit.intercept` and
  `deps.submit.onResult`.
- `01-public-api.md#3.3`: the "submit" row.
- `01-public-api.md#9`: G4 and G16.
- `02-structure.md#Source tree`: what `behaviors/submit.ts` holds, and its channel imports.
- `03-testing.md#Built-in extensions: rows that every one has`, `#submit (createSubmit)` and the row
  "`onSubmit` and `onInvalid` instance argument" of `#Matrix`.
- Spike, read only: `explorations/extension-api/spike/src/submit.ts` and `submit.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createSubmit` is internal.
- D21 (G4): type the check names of `onInvalid` and `submit.onResult` from `CheckNamesOf` of the chain. Use
  the fallback path that TK-021 recorded.
- D53: read `validation` through the validation link. With no `validation`, a run resolves valid.
- G16 (D24): an error in `onSubmit` rejects `submit.run()`. A second `run(intent)` during a submit drops its
  intent. State both rules in the type comments.

## Acceptance

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `submit`, also the row "on a
      chain with no `validation`".
- [ ] Each scenario group of `03#submit (createSubmit)` has a passing test in `src/behaviors/submit.spec.ts`.
      Each row that cites `B:` or `C:` passes.
- [ ] Each need (`values`, `status`) has a negative type case and a unit case for its runtime error at
      `create`.
- [ ] The specs build the shortest chain and do not import `standard`.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`. The instance
      argument of `onSubmit` and `onInvalid` carries the api and field members of the whole chain.
- [ ] `export/behaviors.ts` exports no `createX` function.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

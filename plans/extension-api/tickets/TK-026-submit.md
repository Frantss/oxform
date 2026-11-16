---
id: TK-026
title: Submit extension
phase: 3
work_package: P3-08
status: done
depends_on: [TK-022, TK-021]
branch: codex/P3-08-submit
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `submit`, also the row "on a
      chain with no `validation`".
- [x] Each scenario group of `03#submit (createSubmit)` has a passing test in `src/behaviors/submit.spec.ts`.
      Each row that cites `B:` or `C:` passes.
- [x] Each need (`values`, `status`) has a negative type case and a unit case for its runtime error at
      `create`.
- [x] The specs build the shortest chain and do not import `standard`.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`. The instance
      argument of `onSubmit` and `onInvalid` carries the api and field members of the whole chain.
- [x] `export/behaviors.ts` exports no `createX` function.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all` (with the depth guard), `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (826 statements, 380 branches).
- `src/behaviors/submit.spec.ts` (chain: `values`, `status`, `submit`, or with `validation`, `check('error', {
  blocking })` and `check('warning')`; no `standard`):
  - Wrapper rows: exactly the `submit` api and the options `onSubmit` and `onInvalid`, no state; a `create` without
    `values` and one without `status` each throw and name the extension and the need; on a chain with no
    `validation` the submit is valid (D53).
  - `run`: `submitting` and form `dirty` before validation; `onSubmit` with the values, the instance and the intent;
    the result in the form status; `onInvalid` with every current issue, the instance and the intent; a kept
    blocking issue fails a valid run; a non-blocking issue does not.
  - Concurrent calls share one attempt and drop the later intent (G16); a new attempt after it settles.
  - Aborts: a value change during validation, a newer validation run, a reset. No callback runs, the attempt
    settles, and after a reset the attempt does not write the status.
  - Rejections: `onSubmit` throws, the validation rejects. `run()` rejects (G16) and `successful` is false.
  - `intercept` (sync, async, cancel that skips the later interceptors) and `onResult`; unsubscribe.
- D21 (G4): the check names of `onInvalid` and `submit.onResult` are typed from `CheckNamesOf` of the chain, with the
  path of TK-021 (no fallback). `onInvalid` takes a private `SelfIssues` marker in `main/types.ts`, which
  `configure` and `create` replace with `IssuesByCheck` of the chain, as they replace `Self`. `Instance` replaces the
  `submit` member with `SubmitApi<Values, CheckNamesOf<Api>>`, beside `validation`, through a homomorphic mapped type
  (an `Omit` broke apis with an index signature).
- Type tests: `onSubmit` gets the instance with a member of a later extension; `onInvalid` gets
  `IssuesByCheck<'error'>`; a member or a check name that the chain lacks is a type error; a negative case for
  each need; `SubmitApi`, `SubmitAttempt`, `SubmitResult`.
- `export/behaviors.ts` exports `submit` and `SubmitApi`, `SubmitAttempt`, `SubmitResult`; no `createSubmit`.
- Deviations: `submit.ts` imports `isDiscarded` but not `checkInternals`, because no submit rule moves or reads
  check internals. `SelfIssues` is a new private type, not on any entry point.

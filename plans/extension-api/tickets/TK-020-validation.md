---
id: TK-020
title: Validation extension
phase: 3
work_package: P3-02
status: done
depends_on: [TK-019]
branch: codex/P3-02-validation
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-020: Validation extension

## Outcome

A chain with `values` and `validation` runs validators, groups the result by check name and discards stale
runs. `onRun` observes each applied run. `validation` registers the validation link, so later built-ins read
it in place of the stand-in.

## Scope

- In: `src/behaviors/validation.ts` with the internal `createValidation` and the `validation` extension. The
  check registry, stale runs, `onRun`, the registration of the validation link, and the internal channels
  `registerCheck`, `isDiscarded` and `isInScope`. The validation types of `01#3.3`. The sibling spec, the type
  tests of these exports, and their lines in `export/behaviors.ts`.
- Out: the validation link and its stand-in in `main/context.ts` (TK-011). The `check` extension, exclusive and
  blocking rules and typed check names (TK-021). Scope validators (TK-029). Lanes and races across extensions,
  I2 (TK-032).

## Read first

- `01-public-api.md#3.1`: the `validation` row and "How a chain without `validation` works".
- `01-public-api.md#3.3`: the "validation" row.
- `01-public-api.md#5`: the validation link and the `registerCheck` row.
- `01-public-api.md#8`: the `onRun` row.
- `01-public-api.md#9`: G2, G3 and G20.
- `02-structure.md#Source tree`: what `behaviors/validation.ts` holds.
- `03-testing.md#Built-in extensions: rows that every one has` and `#validation (createValidation)`.
- Spike, read only: `explorations/extension-api/spike/src/validation.ts`, `validation.spec.ts` and
  `validation-lanes.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createValidation` is internal.
- D23 (G3): a discarded run resolves an empty list per check.
- D53: `validation` registers its api in the validation link when its `api` runs.
- G2 (D24): `ValidatorInput` has `values` only. It has no `status`.
- G20 (D24): do not carry the comment "check names stated by the kind" (`api.ts:636`) into the new source.
- `01#8`: `onRun` does not fire for a discarded run. Its type comment says that it observes applied runs.

## Acceptance

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `validation`.
- [x] Each scenario group of `03#validation (createValidation)` has a passing test in
      `src/behaviors/validation.spec.ts`. Each row that cites `B:` or `C:` passes. Rows that need a check use a
      test-local registration through `registerCheck`.
- [x] The need `values` has a negative type case and a unit case for its runtime error at `create`.
- [x] The specs build the shortest chain and do not import `standard`.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (458 statements, 189 branches).
- `src/behaviors/validation.spec.ts` (chain: `values`, `validation` and test-local checks that register through
  `registerCheck`; no `standard`):
  - Wrapper rows: exactly the `validation` api, the `validating` state and no option; a `create` without `values`
    throws and names the extension and the need; no validator runs at creation; `registerCheck` refuses an api that
    `validation` did not make; the api is the validation link of the instance (D53).
  - Results: no check is valid; issues by check name with the event; a check that does not block keeps the run
    valid; validity covers this run only; a schema result without issues; a validator function gets the full
    values, also for a targeted run, and no `status` (G2).
  - Targets: whole form (pathless issues in), a target with descendants (siblings and pathless out), ancestors out,
    a list, an empty list, `{ key }` segments.
  - Events: every event without a type, one event with a type, entries kept when a check has no validator.
  - Stale runs: overlapping change, any change for a whole-form run, an ancestor change, an unrelated change kept,
    a newer run in the same lane, other lanes side by side. A discarded run resolves an empty list per check (G3,
    D23), and `isDiscarded` marks only that result.
  - Rejection: the run rejects, the lane clears, `onRun` is not called.
  - `validating`: true while a run is pending, and until the last of two runs settles.
  - `onRun`: each applied run, not a discarded run, unsubscribe.
  - Read path: `checks` in registration order, `issues(path?)` without validating.
- The validation link stand-in on a form without `validation` is covered in `src/main/context.spec.ts` (TK-011).
- `export/behaviors.ts` exports `validation` and the validation types, and no `createX` function.
- Type tests: a positive and a negative case for `validation` (the need `values`), `ValidationApi`,
  `ValidationRunOptions`, `ValidationRun`, `IssuesByCheck`, `ValidationEvent`, `ValidatorInput`, `CheckValidator`
  and `CheckValidators`.
- G20: the comment about check names "stated by the kind" is not in the new source. The `onRun` comment says it
  observes applied runs (`01#8`).
- Deviations: `CheckEntry`, `CheckApi` and `CheckSetMode` are in `behaviors/validation.ts` and are not exported yet.
  TK-021 owns their export. A types-only `behaviors/check.ts` would fail `check:test-structure`, which asks for a
  sibling spec.

---
id: TK-020
title: Validation extension
phase: 3
work_package: P3-02
status: todo
depends_on: [TK-019]
branch: codex/P3-02-validation
pr: null
started: null
completed: null
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

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `validation`.
- [ ] Each scenario group of `03#validation (createValidation)` has a passing test in
      `src/behaviors/validation.spec.ts`. Each row that cites `B:` or `C:` passes. Rows that need a check use a
      test-local registration through `registerCheck`.
- [ ] The need `values` has a negative type case and a unit case for its runtime error at `create`.
- [ ] The specs build the shortest chain and do not import `standard`.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `export/behaviors.ts` exports no `createX` function.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

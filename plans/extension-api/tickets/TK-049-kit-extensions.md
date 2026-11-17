---
id: TK-049
title: Kit extensions
phase: 7
work_package: P7-02
status: done
depends_on: [TK-048]
branch: codex/P7-02-kit-extensions
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-049: Kit extensions

## Outcome

The example kit holds the custom extensions and slot groups of rows E06 to E14, and the `houseForm` preset of row E04. Each one solves the problem
of its row on its domain form, and each has a passing spec.

## Scope

- In: kit modules in `examples/kit/src/` for E06 and E07 (`autosave` with `onSaveError`), E08
  (`normalizeEmail`), E09 (`funnel`), E10 (`confirmExternal`), E11 (`masks`), E12 (`formErrorSlots`), E13
  (the replaced `submit` slot) and E14 (`warnings`). E04 (`houseForm`: `standard`, then E08, E12 and E13). A sibling `*.spec.ts` for each module.
- Out: the domain forms E01 to E03 and E05 (TK-048). The behavior rows E15 to E28
  (TK-050). The parts that render these slots (TK-051, TK-052, TK-053).

## Read first

- `04-documentation.md#4.2`: the rows E04 and E06 to E14.
- `04-documentation.md#8`: the single-source rule.
- `02-structure.md#Examples`: the kit layout.
- `01-public-api.md#2.1`, `#2.2` and `#2.3`: `defineExtension`, `defineSlots`, `on`, `option` and `Self`.
- `01-public-api.md#3.1`: the extension hooks `values.intercept`, `validation.onRun`, `submit.intercept` and
  `submit.onResult`.
- `01-public-api.md#7.5`: the findings on casts and state factories in a named extension.
- Spike, read only: `explorations/extension-api/kit/autosave.ts`, `masks.ts` and `warnings.ts`, and
  `explorations/extension-api/examples/06-custom-behaviors.ts`. Write the code new.

## Decisions to apply

- D37: the kit holds no rendering code. It imports only `@oxform/core` entry points.
- D19: a custom extension uses a behavior through `Needs`, `deps` and the extension hooks. It imports no
  `createX` function.
- D51: every need is required. A missing need is a type error at `.extend` and a runtime error at `create`.
- D21: check names come from `CheckNamesOf` of the chain. If the depth guard fails, they stay `string`.
- D16: a cleanup runs at each unmount and at `destroy()`, and can run many times.

## Acceptance

- [x] Each of E04 and E06 to E14 is one kit module that matches its row of `04#4.2`, with a passing sibling spec.
- [x] `autosave` is inert at creation: its timer starts on a change (E06).
- [x] `masks` adds `unmasked()` only to string fields (E11). `confirmExternal` cancels before validation
      (E10).
- [x] No file is copied from the spike.
- [x] `vp run example-oxform-kit#test` and `vp run example-oxform-kit#check:types` pass.
- [x] `pnpm run check:all` passes.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. The kit has 37 specs, all pass, and its type
  check passes.
- Modules, each with a sibling spec: E04 `house-form.ts`, E06 and E07 `autosave.ts`, E08 `normalize-email.ts`, E09
  `funnel.ts`, E10 `confirm-external.ts`, E11 `masks.ts`, E12 `form-error-slots.ts`, E13
  `strict-submit-slots.ts`, E14 `warnings.ts`. `testing.ts` reads a part from its slot in Node, for the slot specs.
- `autosave` starts its timer on a change: a new instance saves nothing after every timer ran. `onSaveError` gets
  the instance, and the spec sets a warning on `title` through it (E07).
- `masks` adds `unmasked()` to string fields only: a `@ts-expect-error` case and a runtime case on `billing`.
  `confirmExternal` cancels before validation: a canceled submit of an invalid team sets no error.
- The extensions use the behaviors through `needs`, `deps` and the hooks. They import no `createX` function and no
  spike file.
- Deviation in E14: a generic preset that adds an option needs the casts of `standard`, so `warnings` is the check
  and `warningSlots` is the group, and a form spreads both. Reported.
- Deviation in E12: E01 stays a lean chain of built-in groups (TK-048). The spec of `formErrorSlots` shows the
  sign-in form with it.
- Core fix: `@oxform/core` exports `CheckNamesOf`. Without it, `houseForm` failed with TS2883 in a project that emits
  declarations. Reported, with type cases.
- Limit of E08: `normalizeEmail` sees the path of a write. A write of a whole `members` array is not cleaned.

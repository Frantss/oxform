---
id: TK-049
title: Kit extensions
phase: 7
work_package: P7-02
status: todo
depends_on: [TK-048]
branch: codex/P7-02-kit-extensions
pr: null
started: null
completed: null
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

- [ ] Each of E04 and E06 to E14 is one kit module that matches its row of `04#4.2`, with a passing sibling spec.
- [ ] `autosave` is inert at creation: its timer starts on a change (E06).
- [ ] `masks` adds `unmasked()` only to string fields (E11). `confirmExternal` cancels before validation
      (E10).
- [ ] No file is copied from the spike.
- [ ] `vp run example-oxform-kit#test` and `vp run example-oxform-kit#check:types` pass.
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results and any deviation from the plan here.

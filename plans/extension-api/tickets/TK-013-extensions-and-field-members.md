---
id: TK-013
title: Extensions and field members
phase: 2
work_package: P2-04
status: todo
depends_on: [TK-012]
branch: codex/P2-04-extensions-and-field-members
pr: null
started: null
completed: null
---

# TK-013: Extensions and field members

## Outcome

An author defines an extension as one object with typed `needs`, options, state, api, slots and field
members. A `needs` list that differs from the `Extendable` parameter is a type error. Field members from `on`
appear on the field handles whose value fits.

## Scope

- In: `defineExtension` and `on` in `src/main/form.ts`. The `slots` member of a definition, merged in chain
  order, and the internal `slotsOf(form)` reader that its tests use. Field members and `decorateField` in
  `src/main/context.ts`. The `Extension`, `Extendable`, `Needs`, `BuiltInApis`, `FormContext`, `StateSlice`,
  `FieldMembers`, `FieldOf` and `FieldsOf` types in `src/main/types.ts`. Their exports from
  `export/index.ts`. The sibling spec rows and the type tests of these exports.
- Out: `form.extend`, `create` and the needs check at `create` (TK-012). `defineSlots`, `slots(build)` and the
  slot and part types (TK-014). The export of `slotsOf` (TK-017). The `values.intercept` and
  `values.onChange` hooks (TK-019). The real `field` api of `handles` (TK-027). The type cases for the 17
  needs of the built-in extensions (phase 3, one per built-in ticket).

## Read first

- `01-public-api.md#2.1`, `#2.2` and `#2.3`: the `defineExtension`, `FormContext` and `on<T>` rows, and the
  "Form" and "Field" type groups.
- `01-public-api.md#3.1`: every need is required.
- `02-structure.md#Source tree`: what `main/form.ts`, `main/context.ts` and `main/types.ts` hold.
- `03-testing.md#defineExtension` and `#on and field members`: the scenario groups to test.
- `03-testing.md#Matrix`: the rows for `form.extend, Extendable, Needs, BuiltInApis`, for
  `defineExtension, Extension, FormContext, StateSlice` and for `on, FieldMembers, FieldOf, FieldsOf`.
- Spike, read only: `explorations/extension-api/spike/src/form.ts`, `context.ts`, `extension.spec.ts`,
  `field-extras.spec.ts` and `extension-hooks.spec.ts`. Type cases:
  `explorations/extension-api/type-tests/extension-api.ts`. Write the code new.

## Decisions to apply

- D51: every need is required. A `needs` list with a missing or an extra name is a type error, and a missing
  need is a type error at `.extend`.

## Acceptance

- [ ] Each scenario group of `03#defineExtension` and `#on and field members` has a passing test in
      `src/main/form.spec.ts` or `src/main/context.spec.ts`. The rows that need a `field` api or an extension
      hook use a test-local extension. The `values` hook row moves to TK-019. Record the moved row under
      Evidence.
- [ ] A `needs` list that differs from the `Extendable` parameter is a type error, for a missing and for an
      extra name.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results, the moved test rows and any deviation from the plan here.

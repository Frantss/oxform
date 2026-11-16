---
id: TK-013
title: Extensions and field members
phase: 2
work_package: P2-04
status: done
depends_on: [TK-012]
branch: codex/P2-04-extensions-and-field-members
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each scenario group of `03#defineExtension` and `#on and field members` has a passing test in
      `src/main/form.spec.ts` or `src/main/context.spec.ts`. The rows that need a `field` api or an extension
      hook use a test-local extension. The `values` hook row moves to TK-019. Record the moved row under
      Evidence.
- [x] A `needs` list that differs from the `Extendable` parameter is a type error, for a missing and for an
      extra name.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass. Lint reports no warning in core.
- `pnpm run test:coverage`: 100% per file (241 statements, 106 branches).
- `src/main/form.spec.ts`: `defineExtension` (api, option and state; inert, then work, then cleanup; any order
  that gives the needs; extension hooks in the order applied) and `on` (live members, base members kept, the
  guard, several extensions, no `field` api). The `field` api is the test-local `fielded`, and the hook is the
  test-local `pinger`.
- `src/main/context.spec.ts`: `decorateField` (registration order, live getters, the guard, the path, a member
  that redefines a handle member, a member of two extensions).
- Type tests: a `needs` list with a missing name, with an extra name, and a missing `needs` are type errors.
  With every `@ts-expect-error` removed, each case reports its own error.
- Moved rows:
  - `03#defineExtension`, "Extension hooks: `values.intercept` with `cancel()`, `values.onChange`; two instances
    stay apart" moves to TK-019.
  - `03#on and field members`, "Scoped handles carry the members at any depth; the builder gets the relative
    path": the builder gets the path that `decorateField` receives (tested here). The scoped handles that pass a
    relative path are `handles` (TK-027).
  - `03#defineExtension`, "Adds a slot, keeps earlier slots, replaces a slot with an earlier key", and the
    `slots` member of a definition, move to TK-014, which owns the slot types that the member needs.
- Deviations:
  - `BuiltInApis` has one stand-in member, `field`, typed with `FieldOf`. Each phase 3 ticket adds its api,
    and TK-027 replaces `field` with the handle type.
  - `FieldOf` has `get` and `change`. TK-023 and TK-027 add `state`, `focus`, `blur`, `register`,
    `unregister` and `reset` when their types exist.
  - `needs` lists are exact through `NeedsMember` (private). A missing name shows as a required `missing`
    member that names it.

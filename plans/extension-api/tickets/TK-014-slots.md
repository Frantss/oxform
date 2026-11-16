---
id: TK-014
title: Slots
phase: 2
work_package: P2-05
status: done
depends_on: [TK-013]
branch: codex/P2-05-slots
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-014: Slots

## Outcome

An author makes a slot group with `defineSlots({ name, needs }, build)` and adds slots with `slots(build)`.
`create` throws for a group with a missing need and names the group and the need. `element: 'inptu'` is a
type error.

## Scope

- In: `defineSlots` and `slots` in `src/main/form.ts`, with the needs check of each group at `create`. The
  `Slot`, `SlotFactory`, `SlotDefinition`, `SlotRecord`, `PartSpec`, `PartHandle`, `PartEventContext`,
  `PartDomProps`, `PropKind`, `PropsOf`, `KeyProp`, `Attributes`, `ElementTag` and `PartsOf` types in
  `src/main/types.ts`. Their exports from `export/index.ts`. The sibling spec rows and the type tests of these
  exports.
- Out: the `slots` member of `defineExtension` and the internal `slotsOf` reader (TK-013). The export of
  `slotsOf` (TK-017). The five built-in slot groups and the rows of `03#slots, defineSlots and the slot groups`
  that test them (TK-028). The adapter type test that each `ElementTag` is an intrinsic element (TK-037).

## Read first

- `01-public-api.md#2.1`, `#2.2` and `#2.3`: the `defineSlots` and `slots` rows, the "Slot" type group, and the
  `defineSlots, slots` and "Slot" contracts.
- `01-public-api.md#7.3`: the decided `ElementTag`.
- `02-structure.md#Source tree`: what `main/form.ts` and `main/types.ts` hold.
- `03-testing.md#slots, defineSlots and the slot groups`: the scenario groups to test.
- `03-testing.md#Matrix`: the rows for `defineSlots, slots, Slot, ...` and for `PartSpec, PartHandle, ...`.
- Spike, read only: `explorations/extension-api/spike/src/form.ts` and `slots.spec.ts`. Type cases:
  `explorations/extension-api/type-tests/part-scope.tsx` and `extension-parts.tsx`. Write the code new.

## Decisions to apply

- D13: `ElementTag` is `keyof HTMLElementTagNameMap` in core.
- D51: every need of a slot group is required. A missing need is a type error and a runtime error at `create`
  that names the group and the need. No instance is made.

## Acceptance

- [x] The rows of `03#slots, defineSlots and the slot groups` that need no built-in group have a passing test
      in `src/main/form.spec.ts`: the missing need at `create`, the spread into any form, the slot order, and
      `slots(build)`. They use test-local groups.
- [x] A group with a missing api need or state need throws at `create` and names the group and the need.
- [x] `element: 'inptu'` is a type error.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (262 statements, 112 branches).
- `src/main/form.spec.ts`: the slots of an extension (added, kept, later key wins in both orders), `defineSlots`
  (spread into any form, needs met, a missing api need and a missing state need at `create` with the group
  and the need named, a group with no needs) and `slots(build)` (no api, option or state; merge across
  `extend`; reads the state of the form). The groups are test-local.
- Type tests: `element: 'inptu'` is a type error in `slot(...)`, in `PartSpec` and in `ElementTag`. A group on a
  form without its api need, without its state need, inside an extension that does not state the need, and a
  `needs` list that differs from the `slot` annotation are type errors. Each case reports its own error.
- This ticket also takes the rows that TK-013 moved: the `slots` member of `defineExtension` and the
  `slotsOf` reader, which now resolves the slots in chain order.
- Deviations:
  - `PartEventContext` names the element `element`, not the spike's `el` (semantic naming).
  - `text` takes `NoInfer<SlotState>`, so only `state` infers the slot state.
  - `PartsFromSlots` is in `main/types.ts`. TK-017 exports it from the adapter entry point.
  - `rootSlots` is a placeholder group (the `root` part as a `form` element) until TK-028.
  - The placeholder users of `slotsOf` (entry-point and module-sharing specs, consumer checks, adapter
    skeletons, kit and parity specs) now read the slot keys.

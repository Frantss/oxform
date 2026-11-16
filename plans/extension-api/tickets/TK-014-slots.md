---
id: TK-014
title: Slots
phase: 2
work_package: P2-05
status: todo
depends_on: [TK-013]
branch: codex/P2-05-slots
pr: null
started: null
completed: null
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

- [ ] The rows of `03#slots, defineSlots and the slot groups` that need no built-in group have a passing test
      in `src/main/form.spec.ts`: the missing need at `create`, the spread into any form, the slot order, and
      `slots(build)`. They use test-local groups.
- [ ] A group with a missing api need or state need throws at `create` and names the group and the need.
- [ ] `element: 'inptu'` is a type error.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

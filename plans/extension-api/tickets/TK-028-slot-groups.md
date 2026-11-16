---
id: TK-028
title: Slot groups
phase: 3
work_package: P3-10
status: todo
depends_on: [TK-025, TK-026, TK-021]
branch: codex/P3-10-slot-groups
pr: null
started: null
completed: null
---

# TK-028: Slot groups

## Outcome

A form gets every part from the five built-in slot groups and writes no slot by hand. Each group needs exactly
what it uses. A missing need is a type error at the spread and a runtime error at `create`. `rootSlots` works
with no `reset`, and `fieldSlots` works with no check.

## Scope

- In: `src/behaviors/slots.ts` with `rootSlots`, `fieldSlots`, `fieldErrorSlots`, `submitSlots` and
  `resetSlots`, each a module-level `defineSlots` call with `/* @__PURE__ */` and its `needs`. One internal
  function that builds the `field` slot of `fieldSlots` and `fieldErrorSlots`. The `id` of the `field` slot.
  The sibling spec, the type tests of the five groups, and their lines in `export/behaviors.ts`. The rows of
  `03#slots, defineSlots and the slot groups` that name a group or a built-in chain.
- Out: `defineSlots`, `slots` and their needs check at `create`, and the rows "Slots resolve in extension
  order" and "`slots(build)` adds slots only" (TK-014). The tier fixtures with slot groups (TK-033). The
  adapter part model (TK-037).

## Read first

- `01-public-api.md#3.2`: the five groups, their 12 needs, the differences from the spike and the chain table.
- `01-public-api.md#7.5`: item 2.
- `01-public-api.md#9`: G7, G10 and G16.
- `02-structure.md#Source tree`: what `behaviors/slots.ts` holds.
- `02-structure.md#Tree-shaking`: the purity rule for module-level calls.
- `03-testing.md#slots, defineSlots and the slot groups` and the slot-group row of `#Matrix`.
- Spike, read only: `explorations/extension-api/spike/src/slots.ts` and `slots.spec.ts`. Write the code new.

## Decisions to apply

- D20: the groups work on a lean form. `rootSlots` works with no `reset`, and `fieldSlots` with no check.
- D26: the state needs of a group are type errors at the spread and runtime errors at `create`.
- D49: a form with no `submit` spreads no root group.
- D51: every need of a group is required.
- D54: five groups, one group per part, with the needs of `01#3.2`.
- G10 (D24): the `field` slot sets `id`, with `idPart`.
- G16 (D24): the `root` slot handles the rejection of `submit.run`.
- R02 fallback: if TK-005 or TK-033 shows that `/* @__PURE__ */` does not survive in `dist`, split `slots.ts`
  into one module per group. Record which path was taken under Evidence.

## Acceptance

- [ ] Each row of `03#slots, defineSlots and the slot groups` that this ticket owns has a passing test in
      `src/behaviors/slots.spec.ts`.
- [ ] Each of the 12 needs of `01#3.2` is a type error at the spread and a runtime error at `create` that names
      the group and the need.
- [ ] `rootSlots` works on a chain with `submit` and no `reset`. `fieldSlots` works on `values`, `status`,
      `events` with no check.
- [ ] A type case shows that a `needs` list that differs from the `slot` annotation is a type error.
- [ ] Each group has a positive and a negative type case in `tests/types/`.
- [ ] Each module-level `defineSlots` call in `src/` carries `/* @__PURE__ */`.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results, the R02 path and any deviation from the plan here.

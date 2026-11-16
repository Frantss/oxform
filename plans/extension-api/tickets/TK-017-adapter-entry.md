---
id: TK-017
title: Adapter entry point
phase: 2
work_package: P2-08
status: todo
depends_on: [TK-014]
branch: codex/P2-08-adapter-entry
pr: null
started: null
completed: null
---

# TK-017: The `@oxform/core/adapter` entry point

## Outcome

An adapter author imports from `@oxform/core/adapter` what an adapter needs: the resolved slots, the option
kinds, the controls of a live instance and the path helpers. Code that imports only `@oxform/core` cannot
change the options of a live instance.

## Scope

- In: `optionKindsOf` and `adapterControlsOf` in `src/main/form.ts`. `export/adapter.ts` with `slotsOf`,
  `optionKindsOf`, `adapterControlsOf`, `joinPath` and `isDeepEqual`. The `AdapterControls`, `ResolveKeys`,
  `PartsFromSlots`, `ChecksOfApi` and `FieldMembersOf` types. The sibling spec rows, the type tests of the
  entry, and the `tests/package/` spec for the entry.
- Out: `slotsOf` itself (TK-013). `joinPath` and `isDeepEqual` themselves (TK-010). `prefixOf` and its export
  (TK-027). The use of the option kinds in an adapter (TK-037).

## Read first

- `01-public-api.md#5`: the `slotsOf`, `adapterControlsOf` and path helper rows.
- `01-public-api.md#7.2`: the contents of the entry point.
- `02-structure.md#Adapter-facing exports`: the decided packaging and its verification.
- `03-testing.md#Adapter controls`: the scenario groups to test.
- `03-testing.md#Packaging layer`: the "Entry-point module sharing" row.
- Spike, read only: `explorations/extension-api/spike/src/form.ts` and `adapter-controls.spec.ts`. Write the
  code new.

## Decisions to apply

- D17: no core-only caller can change the options of a live instance. `adapterControlsOf` is for adapter
  authors and is exported only from `@oxform/core/adapter`.

## Acceptance

- [ ] Each scenario group of `03#Adapter controls`, and the row "How an adapter treats each kind" of
      `03#option`, has a passing test in `src/main/form.spec.ts`.
- [ ] `export/adapter.ts` exports the names of `01#7.2` that this ticket owns, and no other name. No other
      entry point exports them.
- [ ] `test:package` covers the entry: an instance made from `@oxform/core` is known to
      `@oxform/core/adapter`.
- [ ] Each export of the entry has a positive and a negative type case in `tests/types/`, or is on the
      exemption list with a reason.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

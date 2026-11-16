---
id: TK-017
title: Adapter entry point
phase: 2
work_package: P2-08
status: done
depends_on: [TK-014]
branch: codex/P2-08-adapter-entry
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each scenario group of `03#Adapter controls`, and the row "How an adapter treats each kind" of
      `03#option`, has a passing test in `src/main/form.spec.ts`.
- [x] `export/adapter.ts` exports the names of `01#7.2` that this ticket owns, and no other name. No other
      entry point exports them.
- [x] `test:package` covers the entry: an instance made from `@oxform/core` is known to
      `@oxform/core/adapter`.
- [x] Each export of the entry has a positive and a negative type case in `tests/types/`, or is on the
      exemption list with a reason.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (310 statements, 130 branches).
- `src/main/form.spec.ts`, `adapterControlsOf`: new options merge over `configure` and `defineForm`, a new value
  is applied, an action stays current, the id stays when the new options give none, `unmount` runs the cleanups
  and leaves the instance usable, and a non-instance is refused.
- `export/adapter.ts` exports `slotsOf`, `optionKindsOf`, `adapterControlsOf`, `joinPath`, `isDeepEqual` and the
  types `AdapterControls`, `ResolveKeys`, `PartsFromSlots`, `ChecksOfApi` and `FieldMembersOf`. No other entry
  point exports them (`check:type-coverage` reads every entry against `inventory.json`).
- `tests/package/module-sharing.spec.ts`: an instance made from the built `@oxform/core` is known to the built
  `@oxform/core/adapter`.
- Type tests: a positive and a negative case for each export of the entry; each negative case reports its own
  error.
- Deviations:
  - `ChecksOfApi` reads the `HandlesChecks` brand of `main/types.ts`, which `handles` adds in TK-027.
  - An issue found here is in `reports/extension-api-rebuild.md`: an inline extension on a form with an api
    must list every api name and state key in `needs`.

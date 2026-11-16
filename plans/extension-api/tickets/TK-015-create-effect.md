---
id: TK-015
title: createEffect
phase: 2
work_package: P2-06
status: done
depends_on: [TK-012]
branch: codex/P2-06-create-effect
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-015: `createEffect`

## Outcome

`createEffect(instance, selector, effect)` calls the effect for each change of the selection that is not
deeply equal. It does not call it for the first selection. `unsubscribe()` stops it.

## Scope

- In: `src/main/effect.ts` with `createEffect`. Its export from `export/index.ts`. The sibling spec
  `src/main/effect.spec.ts` and the type tests of `createEffect`.
- Out: `isDeepEqual` (TK-010). The type cases of `get` and `idPart`, which share the matrix row (TK-010). The
  adapter effect patterns (TK-038).

## Read first

- `01-public-api.md#2.1` and `#2.3`: the `createEffect` row and contract.
- `02-structure.md#Source tree`: what `main/effect.ts` holds.
- `03-testing.md#createEffect`: the scenario groups to test.
- `03-testing.md#Matrix`: the row for `createEffect, get, idPart`.
- Spike, read only: `explorations/extension-api/spike/src/effect.ts` and `effect.spec.ts`. The spike spec uses
  the `standard` preset. Write the code new, and use a test-local extension with state.

## Decisions to apply

None.

## Acceptance

- [x] Each scenario group of `03#createEffect` has a passing test in `src/main/effect.spec.ts`.
- [x] `createEffect` has a positive and a negative type case in `tests/types/`.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (272 statements, 114 branches).
- `src/main/effect.spec.ts`: five cases on a test-local extension with a `filters` state key: no call for the
  first selection, a call per change, no call for a deeply equal selection, none after `unsubscribe`, and two
  async runs that overlap.
- Type tests: the selection is typed by the state of the instance, and a key that the state does not have is a
  type error.

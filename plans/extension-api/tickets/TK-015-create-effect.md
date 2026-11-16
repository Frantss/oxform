---
id: TK-015
title: createEffect
phase: 2
work_package: P2-06
status: todo
depends_on: [TK-012]
branch: codex/P2-06-create-effect
pr: null
started: null
completed: null
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

- [ ] Each scenario group of `03#createEffect` has a passing test in `src/main/effect.spec.ts`.
- [ ] `createEffect` has a positive and a negative type case in `tests/types/`.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

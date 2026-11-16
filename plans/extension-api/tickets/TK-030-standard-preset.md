---
id: TK-030
title: Standard preset
phase: 4
work_package: P4-01
status: todo
depends_on: [TK-027, TK-028]
branch: codex/P4-01-standard-preset
pr: null
started: null
completed: null
---

# TK-030: Standard preset

## Outcome

`defineForm(...).extend(standard)` gives a form with the nine built-in extensions in order, `handles` last,
and the four slot groups of its chain. The preset needs nothing, and it is written from the public exports
only.

## Scope

- In: `src/presets/standard.ts` and its line in `export/presets.ts`. The unit spec
  `src/presets/standard.spec.ts`. The static "public exports only" check: a deliberate private import in
  `standard.ts` fails `pnpm run check:rules`. The runtime "public exports only" spec in `tests/package/`: it
  writes the `standard` chain again from the built entry points and creates an instance. The `standard` row
  of `03#Matrix`.
- Out: the lint rule itself (TK-006). Running the I1 scenarios on the rewritten chain, and I9 (TK-031). The
  tier fixtures (TK-033). `check:type-coverage` and the depth guard with `standard` (TK-034).

## Read first

- `01-public-api.md#4`: the role and the rules of `standard`.
- `01-public-api.md#3.2`: the chain table, for the four slot groups of `standard`.
- `02-structure.md#Areas and dependency direction` and `#Enforcement of the dependency direction`: what a
  preset may import.
- `03-testing.md#The standard preset` and `#Packaging layer`: the row "Preset uses only public exports".
- Spike, read only: `explorations/extension-api/spike/src/standard.ts` and `form.spec.ts:96-105`. Write the code
  new.

## Decisions to apply

- D19: `standard` imports no `createX` function. It imports only `#core` and `#core/behaviors`.
- D51: `standard` meets each need with an earlier extension of its chain.

## Acceptance

- [ ] Each scenario group of `03#The standard preset` has a passing test in `src/presets/standard.spec.ts`.
- [ ] A deliberate import of a private module in `standard.ts` fails `pnpm run check:rules`.
- [ ] The runtime spec writes the chain again from the built entry points and creates an instance with the
      same api keys and slots as `standard`.
- [ ] `standard` has a positive and a negative type case in `tests/types/`.
- [ ] `vp run @oxform/core#test` and `vp run @oxform/core#test:package` pass.
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Record the command results and any deviation from the plan here.

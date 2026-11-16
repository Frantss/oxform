---
id: TK-010
title: Paths
phase: 2
work_package: P2-01
status: todo
depends_on: [TK-007]
branch: codex/P2-01-paths
pr: null
started: null
completed: null
---

# TK-010: Paths

## Outcome

Core reads, writes and compares values at a dotted path with its own helpers and types. `remeda` and
`type-fest` are no longer dependencies of `@oxform/core`.

## Scope

- In: `src/internal/paths.ts` with `segments`, `getAt`, `setAt`, `joinPath`, `ancestorsOf`, `isWithin` and
  `isDeepEqual`. `src/main/path.ts` with `get` and `idPart`. `src/main/path-types.ts` with `Path`,
  `PathValue`, `ObjectPath`, `ArrayPath`, `ArrayItem`, `ArrayValue`, `Updater`, `MaybePromise`, `Unsubscribe`
  and `DeepPartial`. The exports of `get`, `idPart` and these types from `export/index.ts`. The removal of
  `remeda` and `type-fest` from `packages/core/package.json`. The sibling specs and the type tests of these
  exports.
- Out: the export of `joinPath` and `isDeepEqual` from `@oxform/core/adapter` (TK-017). `createEffect`, which
  shares a matrix row with `get` and `idPart` (TK-015).

## Read first

- `01-public-api.md#2.1` and `#2.2`: the `get` and `idPart` rows, and the "Path" and "Utility" type groups.
- `01-public-api.md#5`: the "Path helpers" row, which lists the internal functions.
- `02-structure.md#Source tree`: what `internal/paths.ts`, `main/path.ts` and `main/path-types.ts` hold.
- `02-structure.md#Package manifest`: why `remeda` and `type-fest` go, and the behavior to keep.
- `03-testing.md#Path helpers (get, idPart, internal path functions)`: the scenario groups to test.
- `03-testing.md#Matrix`: the rows for `createEffect, get, idPart`, for the path types and for the utility
  types.
- Spike, read only: `explorations/extension-api/spike/src/paths.ts` (it has no spec). Write the code new.

## Decisions to apply

- D09: remove `remeda` and `type-fest`. Write new path helpers and path types.

## Acceptance

- [ ] Each scenario group of `03#Path helpers` has a passing test in `src/internal/paths.spec.ts` or
      `src/main/path.spec.ts`.
- [ ] The deep equality rows for dates and files pass (R12).
- [ ] `packages/core/package.json` and `pnpm-lock.yaml` have no `remeda` and no `type-fest` for core, and no
      core source imports them.
- [ ] `get`, `idPart` and each path and utility type have a positive and a negative type case in
      `tests/types/`. `Unsubscribe` and `MaybePromise` are on the exemption list with a reason.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

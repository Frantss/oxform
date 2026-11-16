---
id: TK-010
title: Paths
phase: 2
work_package: P2-01
status: done
depends_on: [TK-007]
branch: codex/P2-01-paths
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each scenario group of `03#Path helpers` has a passing test in `src/internal/paths.spec.ts` or
      `src/main/path.spec.ts`.
- [x] The deep equality rows for dates and files pass (R12).
- [x] `packages/core/package.json` and `pnpm-lock.yaml` have no `remeda` and no `type-fest` for core, and no
      core source imports them.
- [x] `get`, `idPart` and each path and utility type have a positive and a negative type case in
      `tests/types/`. `Unsubscribe` and `MaybePromise` are on the exemption list with a reason.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `src/internal/paths.ts`: `segments`, `getAt`, `setAt(data, path, value)`, `joinPath(prefix, path)`,
  `ancestorsOf`, `isWithin`, `isDeepEqual`. `src/main/path.ts`: `get` and `idPart`. `src/main/path-types.ts`:
  the path and utility types. `export/index.ts` exports `get`, `idPart` and the ten types. The adapter barrel
  is unchanged: it still exports the `joinPath` of TK-003, and TK-017 adds `isDeepEqual`.
- Scenario groups of `03#Path helpers`, in `src/internal/paths.spec.ts` and `src/main/path.spec.ts` (57 cases):
  - `get`: nested keys, array indices, the root, a missing key and a key below `null`.
  - Immutable write: new references for the ancestors only, siblings kept, the original unchanged, arrays kept.
  - Overlap: the same path, ancestor, descendant, sibling, `addressLine` against `address`, and the root.
  - Deep equality (R12): objects, arrays, an array against an object, `undefined` against a missing key, dates
    (by time, also two invalid dates), files (by identity), sets and maps.
  - `idPart`: one escape per code point, the same part for the same path, and six paths that differ only in
    punctuation give six parts.
- Behavior choices for the owner (the plan does not fix them):
  - Paths are dotted only. `a[0]` is not parsed, because the new path types give `a.0`. The 0.x types gave
    `a[0]` for a tuple item, so a 0.x tuple path changes.
  - `isDeepEqual` compares a class instance other than `Date`, `Map` and `Set` by identity, so two `File`
    objects with the same content differ. `remeda` compared their own keys and found them equal. `undefined`
    and a missing key differ, as in the spike.
  - `idPart` is one to one: letters and digits stay, `.` becomes `-`, and any other character becomes
    `_<hex code point>_`. The spike wrote `-` for every other character, so `a.b` and `a-b` gave the same id.
- Types: written new, with no import from the 0.x `types/deep.ts`. A value of type `Date`, `RegExp`, `Blob`
  (so `File`), `Map`, `Set`, a function or a primitive is a leaf. An array item and a path below an optional
  ancestor add `undefined`. `unknown` and depth 10 accept every path. `get` takes `const At extends
  Path<Values>`: without `const`, TypeScript 7.0.2 inferred the whole `Path` union and `get` returned every
  value type.
- Type tests: `tests/types/path.test-d.ts` has a positive and a negative case for `get`, `idPart`, `Path`,
  `PathValue`, `ObjectPath`, `ArrayPath`, `ArrayValue`, `ArrayItem`, `Updater` and `DeepPartial`, and a
  positive case for the exempt `MaybePromise` and `Unsubscribe`. A negative case calls `accepts<Type>(value)`:
  an unused `const` would also fail `noUnusedLocals`, so `@ts-expect-error` could pass for the wrong reason.
  A copy of `tests/types/` without the `@ts-expect-error` lines gave 19 errors, one per negative case, each
  with its own reason (`TS2345`, `TS2554`, `TS2322`, `TS2741`, `TS2349`), and no `TS6133`.
- Check script fixes found here: `check-type-coverage` and `check-test-structure` now accept
  `expectTypeOf<Type>()` as a positive case. `check-test-structure` skips `types.ts` and `*-types.ts`, which
  hold types only (`02#Source tree`).
- `remeda` and `type-fest` are gone from `packages/core/package.json` and from `pnpm-lock.yaml` (no package
  entry is left), and no core source imports them.
- `test:coverage`: `6 files fully covered.`, `Statements : 100% ( 78/78 )`. `pnpm run build`,
  `pnpm run check:all` (with `check:types` and `check:types:dist`) and `pnpm run test` pass.

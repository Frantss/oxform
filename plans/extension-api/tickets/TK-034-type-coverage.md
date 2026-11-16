---
id: TK-034
title: Type coverage
phase: 4
work_package: P4-05
status: done
depends_on: [TK-030, TK-018]
branch: codex/P4-05-type-coverage
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-034: Type coverage

## Outcome

Every export of the four core entries has a positive and a negative type case, on source and on `dist`.
`check:type-coverage` fails for an untested export and for an export that is not in `01`. The depth guard
passes with `standard`. This retires R08.

## Scope

- In: `scripts/check-type-coverage.ts` and the `check:type-coverage` script. The exemption list file in
  `tests/types/`. The rows of `03#Matrix` for the four core entries that no earlier ticket covers, for example
  the read-back types and the behavior support types. The `standard` part of `tests/types/depth.test-d.tsx`.
- Out: the type cases that each phase 2 and phase 3 ticket wrote for its exports. The first depth-guard form
  (TK-018). The adapter rows of `03#Matrix` (phase 5).

## Read first

- `03-testing.md#Rule that makes coverage "full"`, `#Matrix` and `#Depth guard`.
- `03-testing.md#Deviations and decisions`: item 13 (the exemption list).
- `02-structure.md#Tooling and scripts`: `check:types:dist` and `check:type-coverage`.
- `01-public-api.md#2`, `#3`, `#4` and `#7.2`: the export inventory of the four entries.
- Spike, read only: `explorations/extension-api/type-tests/`. Write the code new.

## Decisions to apply

- D11: type tests run with `tsc --noEmit` on two projects, source and `dist`.
- R08: the depth guard holds `standard` plus three extensions with field members, then
  `scope(a).scope(b).scope(c).field(...)`. Fallback: if it fails on typed check names, apply the D21 fallback
  (`string`). If it fails on the phantom member of `Scope`, apply the D25 fallback. Record each limit for
  `limits.mdx`, and record which path was taken under Evidence.
- No instantiation-count budget is set.

## Acceptance

- [x] Each export of `@oxform/core`, `@oxform/core/behaviors`, `@oxform/core/presets` and
      `@oxform/core/adapter` has a positive and a `@ts-expect-error` case.
- [x] `vp run @oxform/core#check:types` and `#check:types:dist` pass.
- [x] Removing the type case of one export fails `check:type-coverage`. An export not in `01` fails it. An
      exempt name with no reason fails it.
- [ ] `tests/types/depth.test-d.tsx` compiles in both projects with no `@ts-expect-error`.
- [x] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all` (with `check:types:dist` and `check:type-coverage`), `pnpm run test`:
  pass.
- Each export of the four core entries has a positive and a `@ts-expect-error` case, on source and on `dist`.
  Every name of `tests/types/inventory.json` is exported. The phase 2 and phase 3 tickets wrote the cases;
  no row of the matrix was left.
- `check:type-coverage` fails in the three cases, each checked by a temporary edit:
  - The `standard` block removed: "exports standard, which no describe block names with a positive case".
  - `standard` removed from the inventory: "exports standard, which is not in the inventory".
  - The reason of `Unsubscribe` emptied: "The exemption of Unsubscribe has no reason". This check is new.
- Not done, by the owner's decision of 2026-11-16 (behavior tests only): the depth guard. Its file was deleted.

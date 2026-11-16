---
id: TK-018
title: Depth guard, first form
phase: 2
work_package: P2-09
status: todo
depends_on: [TK-014]
branch: codex/P2-09-depth-guard
pr: null
started: null
completed: null
---

# TK-018: Depth guard, first form

## Outcome

A type test proves that long chains and large `Values` types compile without "Type instantiation is
excessively deep", before any behavior exists.

## Scope

- In: `tests/types/depth.test-d.tsx` with a duplicate-free chain of nine test-local extensions, a preset that
  applies nine inside a chain, and a `Values` type of 60 fields with nested objects and arrays, used with
  `Path`, `PathValue` and every part type.
- Out: the case with `standard`, three extensions with field members and nested `scope` calls (TK-034). Fixes
  to the types of other tickets. If a case fails, record it and report it to the owner of that type.

## Read first

- `03-testing.md#Depth guard`: the cases of the file.
- `03-testing.md#Rule that makes coverage "full"`: the two type-test projects.
- `06-roadmap.md#Risk register`: row R08.
- Spike, read only: `explorations/extension-api/type-tests/extension-api.ts`. Write the code new.

## Decisions to apply

None.

## Acceptance

- [ ] `tests/types/depth.test-d.tsx` holds the three cases of the In list and no `@ts-expect-error`.
- [ ] The file compiles in `vp run @oxform/core#check:types` and in `vp run @oxform/core#check:types:dist`.
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results and any deviation from the plan here.

---
id: TK-027
title: Handles extension
phase: 3
work_package: P3-09
status: todo
depends_on: [TK-023, TK-024, TK-025, TK-026]
branch: codex/P3-09-handles
pr: null
started: null
completed: null
---

# TK-027: Handles extension

## Outcome

`handles` needs `values`, `status`, `events`, `reset` and `arrays`. It adds `field(path)`, `array(path)` and
`scope(path)` to the instance, with check sugar for each check applied before it. A check applied after
`handles` has no sugar. An adapter reads the prefix of a scope with `prefixOf`.

## Scope

- In: `src/behaviors/handles.ts` with the internal `createHandles`, the `handles` extension, `FieldHandle`,
  `ArrayHandle` and `FieldState`. Field members through `decorateField`, check sugar, `setError`, and
  `form.scope(path)` at any depth. `prefixOf` and the scope prefix key in `main/form.ts`, and `prefixOf` in
  `export/adapter.ts`. The sibling spec, the type tests of these exports, and their lines in the barrels.
- Out: the other adapter exports (TK-017). The `id` of the `field` slot (TK-028). Scope validators, rules 3
  and 4, and the scope view rows of `03#Scopes (defineScope, form.scope)` (TK-029).

## Read first

- `01-public-api.md#3.1`: the `handles` row and the rule on check names in "Rules that hold for every
  built-in".
- `01-public-api.md#3.3`: the "handles" row.
- `01-public-api.md#5`: the `prefixOf`, `eventsInternals` and `arraysInternals` rows.
- `01-public-api.md#7.6`: the row on a check applied after `handles`.
- `01-public-api.md#8`: the row on a scope of the wrong shape.
- `01-public-api.md#9`: G9, G10 and G20.
- `02-structure.md#Source tree`: what `behaviors/handles.ts` and `main/form.ts` hold.
- `03-testing.md#Built-in extensions: rows that every one has`, `#handles (createHandles)`, the rows
  "`handles` and the check-name sugar" and "Behavior support types" of `#Matrix`, and the two pinned gaps
  after the table.
- Spike, read only: `explorations/extension-api/spike/src/handles.ts`, the handles rows of
  `standard-form.spec.ts`, and `scopes.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createHandles` is internal.
- D25: try an invariant phantom member on `Scope` so a scope of the wrong shape is a type error. Fallback: if it
  causes deep instantiation, keep the limit, pin it in a type test and record it for `limits.mdx`. Record which
  path was taken under Evidence.
- D53: read check names from the validation link once, when the `api` of `handles` runs. With no `validation`,
  there is no sugar.
- G9 (D24): cache the scope per prefix.
- G10 (D24): `FieldState.id` uses `idPart`, the same id function as the slots.
- G20 (D24): do not carry the comment "a scope of the wrong shape is rejected" (`api.ts:817`) into the new
  source.
- `01#7.6`: a check applied after `handles` has no sugar, in the types and at runtime. A type test and a unit
  test pin the rule.

## Acceptance

- [ ] Each row of `03#Built-in extensions: rows that every one has` passes for `handles`, also the row "on a
      chain with no `validation`".
- [ ] Each scenario group of `03#handles (createHandles)` has a passing test in `src/behaviors/handles.spec.ts`.
      Each row that cites `B:` passes. The rows marked "Preset" are written new on the shortest chain.
- [ ] Each of the five needs has a negative type case and a unit case for its runtime error at `create`.
- [ ] A check after `handles` has no sugar, in a type test and a unit test.
- [ ] `tests/types/depth.test-d.tsx` still compiles in both type-test projects.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `export/behaviors.ts` exports no `createX` function. `vp run @oxform/core#test:package` covers `prefixOf`.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results, the D25 path and any deviation from the plan here.

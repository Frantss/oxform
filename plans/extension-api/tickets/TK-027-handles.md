---
id: TK-027
title: Handles extension
phase: 3
work_package: P3-09
status: done
depends_on: [TK-023, TK-024, TK-025, TK-026]
branch: codex/P3-09-handles
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `handles`, also the row "on a
      chain with no `validation`".
- [x] Each scenario group of `03#handles (createHandles)` has a passing test in `src/behaviors/handles.spec.ts`.
      Each row that cites `B:` passes. The rows marked "Preset" are written new on the shortest chain.
- [x] Each of the five needs has a negative type case and a unit case for its runtime error at `create`.
- [x] A check after `handles` has no sugar, in a type test and a unit test.
- [x] `tests/types/depth.test-d.tsx` still compiles in both type-test projects.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function. `vp run @oxform/core#test:package` covers `prefixOf`.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all` (with `check:types:dist`, `check:type-coverage`, `test:package` and the depth
  guard), `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (892 statements, 386 branches).
- `src/behaviors/handles.spec.ts` (chain: `values`, `status`, `events`, `arrays`, `reset`, `handles`, or with
  `validation`, `check('error')` before `handles` and `check('late')` after it; no `standard`):
  - Wrapper rows: exactly `field`, `array` and `scope`, no state, no option; a `create` without each of the five needs
    throws and names the extension and the need; on a chain with no `validation`, a field has no sugar (D53).
  - Field handle: a live `state` (`id` through `idPart`, G10; value, default value, element, status); `change`,
    `focus`, `blur`, `register`, `unregister` and `reset` bound to the path; the field members of the extensions,
    with the path relative to the scope.
  - Array handle: every operation on the path, and ids that follow the items.
  - Check sugar: `error()` (also `nested`) and `setError` (also `mode`) for the check before `handles`; none for
    the check after it (`01#7.6`).
  - `setError`: its entries go when the field or an ancestor changes, and at a reset; they stay when another field
    changes; only the entries it set go.
  - Scopes: paths at any depth and on an array item path; the same object per prefix (G9); `prefixOf`, also after a
    spread.
- D25: the primary path holds. `Scope` has an invariant phantom member (`(values: Values) => Values`), so a scope
  of values of another shape is a type error. Without the member the negative case compiles (checked by removing
  it). `depth.test-d.tsx` compiles in both type-test projects. The comment of G20 is not carried over.
- `Scope` is in `main/types.ts` and the main entry point. `BuiltInApis` has `field`, `array` and `scope` from
  `Scope<Values>`, in place of the stand-in. `Instance` adds the field members and the check names of the chain to
  `field` and `scope` through one homomorphic mapped type.
- `prefixOf` and the key `Symbol.for('oxform.scope.prefix')` are in `main/form.ts`; `export/adapter.ts` exports
  `prefixOf`. `test:package` reads the prefix of a scope from the built `behaviors` entry in the built `adapter`
  entry.
- Type tests: `handles` (sugar for the check before it, a negative case for the check after it, for a chain with
  no `validation`, and for each of the five needs), `Scope` (D25, an object path only), `FieldHandle`,
  `ArrayHandle`, `FieldState`, `prefixOf`.
- `export/behaviors.ts` exports `handles` and `FieldHandle`, `ArrayHandle`, `FieldState`; no `createHandles`.
- Changes outside the scope: the test-local `field` stand-in of `form.spec.ts` is cast to the built-in `field`
  type, and a type case of `main.test-d.ts` reads the value type of the built-in field.

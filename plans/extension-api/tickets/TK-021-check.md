---
id: TK-021
title: Check extension
phase: 3
work_package: P3-03
status: done
depends_on: [TK-020]
branch: codex/P3-03-check
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-021: Check extension

## Outcome

`check(name, options)` adds a named check that needs `validation` only. `form.<name>` and its option are typed
for each name. Root issues live at the empty path `''`. Check names outside the field sugar are typed from the
chain.

## Scope

- In: `src/behaviors/check.ts` with the internal `createCheck`, the `check` extension and `checkInternals`.
  Exclusive and blocking rules, `set`, `validates`, `clear`, root issues and entries that follow array items
  through `remap`. The private `CheckNamesOf` type and the typed check names of the `validation` api. The check
  types of `01#3.3`. The sibling spec, the type tests of these exports, and their lines in
  `export/behaviors.ts`.
- Out: the array operations that call `remap` (TK-024). Typed check names in `onInvalid` and
  `submit.onResult` (TK-026). Check sugar on handles (TK-027). Scope validators (TK-029).

## Read first

- `01-public-api.md#3.1`: the `check` row and the rule for `check(name, { blocking?, exclusive? })`.
- `01-public-api.md#3.3`: the "check" row and the note on `CheckNamesOf`.
- `01-public-api.md#7.5`: item 1. `01-public-api.md#7.7`: the root issues row.
- `01-public-api.md#8`: the row on a non-exclusive check with no validator.
- `01-public-api.md#9`: G4 and G5.
- `02-structure.md#Source tree`: what `behaviors/check.ts` holds.
- `03-testing.md#Built-in extensions: rows that every one has`, `#check(name, options) (createCheck)` and
  `#Depth guard`.
- Spike, read only: `explorations/extension-api/spike/src/check.ts`, `warning-check.spec.ts` and the check rows
  of `validation.spec.ts`. Write the code new.

## Decisions to apply

- D19: `createCheck` is internal.
- D21 (G4): type check names from `CheckNamesOf` of the chain. Fallback: if `depth.test-d.tsx` fails, keep
  `string` and record the limit for `limits.mdx`. Record which path was taken under Evidence.
- D22: the empty path `''` is the root, in the types too. No form-level error part ships.
- G5 (D24): `check` needs `validation` only.
- `01#7.5` item 1: keep the casts inside `check`. Prove `form.<name>` and its option are typed for two names.
- `01#8`: a non-exclusive check keeps the entries of an event with no validator until `clear`.

## Acceptance

- [x] Each row of `03#Built-in extensions: rows that every one has` passes for `check`.
- [x] Each scenario group of `03#check(name, options) (createCheck)` has a passing test in
      `src/behaviors/check.spec.ts`. Each row that cites `B:` or `C:` passes. The array row uses `remap`
      through `checkInternals`.
- [x] The need `validation` has a negative type case and a unit case for its runtime error at `create`.
- [x] A type test shows `form.<name>` and its option typed for two names.
- [x] `tests/types/depth.test-d.tsx` still compiles in both type-test projects.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `export/behaviors.ts` exports no `createX` function and no `CheckNamesOf`.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all` (with `check:types:dist` and `depth.test-d.tsx`), `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% per file (514 statements, 223 branches).
- `src/behaviors/check.spec.ts` (chain: `values`, `validation`, `check('error', { blocking, exclusive })`,
  `check('warning')`; no `standard`):
  - Wrapper rows: the name in the api, the options and the state; a second check with the same name throws at
    `extend`; a `create` without `validation` throws and names the extension and the need; no validator runs at
    creation; `checkInternals` refuses an object that `check` did not make.
  - Exclusive: replaces every entry in scope, also manual ones; leaves them when no validator has the event.
  - Not exclusive: refreshes only the event of the run and keeps other events and untyped entries; an event with
    no validator keeps its entries until `clear` (`01#8`).
  - Scope: entries outside the run stay; descendants are in; a nested read.
  - `set`: replace, append, keep (and keep with no entries), an empty set removes the path, the path of an entry
    does not redirect.
  - Blocking: a check blocks only when it says so; two checks do not clear each other.
  - `validates(event)`; `clear(path)` for one subtree; `clear()` for every entry.
  - Root issues at `''` (D22): set, read, nested read of the root, replaced by a whole-form run, kept by a targeted
    run.
  - Array items through `checkInternals(check).remap`: swap, move, prepend and insert, remove.
- `check` needs `validation` only (G5): `needs: { api: ['validation'] }`, and a negative type case.
- D21: the check names are typed from `CheckNamesOf` of the chain. `Instance` replaces the `validation` member with
  `ValidationApi<Values, CheckNamesOf<Api>>`, so `validation.issues()` is `IssuesByCheck<'error' | 'warning'>` and a
  chain without a check gives `IssuesByCheck<never>`. The depth guard still compiles in both projects, so the
  fallback was not needed. `CheckNamesOf` is in `main/types.ts` and is not exported from an entry point.
- `01#7.5` item 1: the three casts stay inside `check`. A type test shows `form.error`, `form.warning` and their
  options typed for two names.
- `export/behaviors.ts` exports `check` and `CheckApi`, `CheckEntry`, `CheckOptions`, `CheckSetMode`, `CheckState`,
  `CheckSugar`; no `createCheck` and no `CheckNamesOf`.
- Type tests: a positive and a negative case for each export of the ticket.
- Deviations: `CheckOptions` has no type parameter and no `name`, because the name is the first argument of
  `check`. `TestIssue` and `reporting` moved to `tests/helpers.ts`, shared by the validation and check specs.

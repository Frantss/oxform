---
id: TK-042
title: React types, package and coverage
phase: 5
work_package: P5-07
status: todo
depends_on: [TK-038, TK-039, TK-040, TK-041]
branch: codex/P5-07-react-types-package
pr: null
started: null
completed: null
---

# TK-042: React types, package and coverage

## Outcome

`@oxform/react` passes its type, package and coverage checks. Every export has type cases. Its `dist` holds no
copy of core, and it imports only `@oxform/core` and `@oxform/core/adapter`. Phase 5 is complete.

## Scope

- In: `packages/react/tests/types/*.test-d.tsx` with the adapter rows of the type matrix and the `ElementTag`
  type test. `packages/react/tests/package/` with the "no copy of core" spec and the "only public exports"
  check. The `test:coverage` script and its thresholds. The manifest peers. `check:package`,
  `check:types:dist`, `check:type-coverage` and `check:consumers` of `@oxform/react`.
- Out: the runtime surface (TK-037 to TK-041). The Solid type tests and coverage (TK-044, TK-045). The
  `@oxform/react` readme (phase 8).

## Read first

- `03-testing.md#Matrix`: the rows "Adapter `createParts`", "Adapter `scope` prop, `useScope`" and "Adapter
  `useForm`, ...".
- `01-public-api.md#7.3`: the `ElementTag` type test in each adapter.
- `01-public-api.md#7.5`: item 3, the `PartProps<'select'>` type test.
- `03-testing.md#Coverage`: the React thresholds and the exclusions.
- `03-testing.md#Packaging layer`: "Adapter uses only public exports", "Adapter bundles no core" and
  "Consumer install".
- `02-structure.md#@oxform/react`: the manifest fields.
- `02-structure.md#Tooling and scripts`: the React scripts and the `check:package` chain.
- `03-testing.md#Deviations and decisions`: item 4.

## Decisions to apply

- D29: React coverage is 100 for statements, functions and lines, and 95 for branches, per file.
- D35: `react-dom` is not a peer of `@oxform/react`. The peers are `@oxform/core` and `react`.
- Gap 4: add `test:coverage` to `@oxform/react`.
- R05: if V8 coverage does not merge the browser project and the Node project into one report, set the
  thresholds per project. Record which path was taken under Evidence.

## Acceptance

- [ ] Each export of `01#6.2` has a positive and a negative type case in `tests/types/`, with the G12 case: an
      option prop beside `form` fails.
- [ ] Every `ElementTag` is a key of React's intrinsic elements.
- [ ] A type test shows that a wrapper forwards `PartProps<'select'>`.
- [ ] `vp run @oxform/react#test:coverage` passes at the thresholds of `03#Coverage`.
- [ ] The "no copy of core" spec reads `dist` and finds no marker of a core module.
- [ ] A deep import of core in `packages/react/src` fails the "only public exports" check.
- [ ] `vp run @oxform/react#check:types`, `#check:package` and `#test:package` pass.
- [ ] Phase 5 exit: `vp run @oxform/react#test` passes P1 to P14 in Chromium and Node.
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results, the R05 path and any deviation from the plan here.

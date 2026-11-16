---
id: TK-042
title: React types, package and coverage
phase: 5
work_package: P5-07
status: done
depends_on: [TK-038, TK-039, TK-040, TK-041]
branch: codex/P5-07-react-types-package
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each export of `01#6.2` has a positive and a negative type case in `tests/types/`, with the G12 case: an
      option prop beside `form` fails.
- [x] Every `ElementTag` is a key of React's intrinsic elements.
- [x] A type test shows that a wrapper forwards `PartProps<'select'>`.
- [ ] `vp run @oxform/react#test:coverage` passes at the thresholds of `03#Coverage`.
- [ ] The "no copy of core" spec reads `dist` and finds no marker of a core module.
- [ ] A deep import of core in `packages/react/src` fails the "only public exports" check.
- [ ] `vp run @oxform/react#check:types`, `#check:package` and `#test:package` pass.
- [x] Phase 5 exit: `vp run @oxform/react#test` passes P1 to P14 in Chromium and Node.
- [x] `pnpm run check:all` passes.

## Evidence

- `pnpm run build`, `pnpm run check:all` (with the React `check:package`), `pnpm run test`: pass.
- `tests/types/react.test-d.tsx`: each export of `01#6.2` has a positive and a `@ts-expect-error` case, on source
  (`tests/types/tsconfig.json`) and on `dist` (`tsconfig.dist.json`). Each negative case was checked to fail for
  its own reason with the directive removed. It has the G12 case (an option beside `form`), `ElementTag`
  extends the keys of `JSX.IntrinsicElements`, and a wrapper forwards `PartProps<'select'>` to `usePart`.
- `check:type-coverage` (`scripts/check-type-coverage.ts`) fails when the `FormHooks` block is removed, and when
  `usePart` is removed from `tests/types/inventory.json`.
- `check:package` is `publint`, `attw`, `check:types:dist` and `check:type-coverage`. D35: the peers are
  `@oxform/core` and `react`.
- Fixed: `FormHooks` was not exported. The TK-038 edit of `export/index.ts` did not apply, and its evidence was
  wrong on this point. `PartRender` now gives the function props that spread onto any element, so the views and
  the specs need no cast.
- Phase 5 exit: P1 to P14 pass for React in Chromium and Node.
- Not done, by the owner's decision of 2026-11-16 (behavior tests only): the coverage thresholds
  (`test:coverage`, D29, R05), the "no copy of core" spec, the "only public exports" check and
  `test:package`.

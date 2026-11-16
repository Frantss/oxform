---
id: TK-007
title: Test projects
phase: 1
work_package: P1-06
status: done
depends_on: [TK-008]
branch: codex/P1-06-test-projects
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-007: Test projects

## Outcome

Core has `unit` and `integration` Vitest projects in Node, a coverage run at 100 per file, and two type-test
projects (source and `dist`). Deleting the placeholder spec fails the coverage run.

## Scope

- In: the `unit` and `integration` projects in `packages/core/vite.config.ts`, with `environment: 'node'` and
  browser mode off. Coverage with `@vitest/coverage-v8` on the `unit` project only. One unit spec that asserts
  `window` and `document` are `undefined`. A placeholder spec beside the placeholder runtime module.
  `tests/helpers.ts`.
- In: the core scripts `test`, `test:coverage`, `test:dev`, `check:types`, `check:types:dist`,
  `check:type-coverage`, `check:test-duplicates` and `check:test-structure`. The scripts in
  `packages/core/scripts/` for the last three. Add each check script to the core `check:package` chain.
- Out: the root `test:coverage` script and the CI step (TK-009). The real unit specs (phase 2). Adapter
  coverage (TK-042).

## Read first

- `03-testing.md#Test layers` and `#Unit layer`: the layers, the Node rule and the `window` spec.
- `03-testing.md#Coverage` and `#Choice: keep integration tests out of unit coverage`: the thresholds and the
  exclusions.
- `03-testing.md#Type tests`, `#Rule that makes coverage "full"` and `#Choice: the type-test runner`: the two
  projects and the export-coverage rule.
- `02-structure.md#Source tree`: the `tests/` and `scripts/` layout.
- `02-structure.md#Tooling and scripts`: the core scripts and their notes.
- Spike, read only: `explorations/extension-api/spike/src/smoke.spec.ts` and `spike/src/test-helpers.ts`.
  Write the code new.

## Decisions to apply

- D07: co-located unit specs, `tests/` and `*.test-d.ts` are accepted. The check scripts scan `src` and
  `tests`.
- D11: run type tests with `tsc --noEmit` on two projects, not with Vitest typecheck.
- R05: try to merge a browser project and a Node project into one V8 coverage report on a placeholder. If it
  fails, use thresholds per project, and record it.
- R06: neither Vitest typecheck nor bench mode is on the path of this ticket.
- Gap 1: this ticket adds `check:types:dist` and `check:type-coverage`.
- Gap 2: this ticket adds `check:test-structure`, which also fails when a runtime module has no sibling spec.
- Coverage: `thresholds: { 100: true, perFile: true }`. No `all: true`. No source file is excluded by name.
- `check:type-coverage` fails for an export that is not in `01`. A placeholder entry exports no name, or only a
  name of the `01` inventory.

## Acceptance

- [x] `vp run @oxform/core#test` runs the `unit` and `integration` projects in Node and passes.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] Deleting the placeholder spec fails `test:coverage` and `check:test-structure`.
- [x] The `window` spec passes, and fails when the `unit` project runs in the browser.
- [x] `vp run @oxform/core#check:types` and `#check:types:dist` pass.
- [x] `vp run @oxform/core#check:type-coverage` passes, and fails for an export with no type case.
- [x] `pnpm run check:all` passes.

## Evidence

- `packages/core/vite.config.ts` has three Node projects with browser mode off: `unit` (`src/**/*.spec.ts`),
  `integration` (`tests/*.spec.ts`) and `package` (TK-003). Coverage is V8, off by default, on `src/**/*.ts`
  without the specs, with `thresholds: { 100: true, perFile: true }`. No source file is excluded by name.
- Specs: `src/environment.spec.ts` (`window` and `document` are `undefined`), one sibling spec per placeholder
  runtime module, and `tests/entry-points.spec.ts` through the four barrels. `tests/helpers.ts` holds `named`.
  The preset spec checks the composition with a recording form, because `src/presets/**` may not import
  `#core/adapter` (TK-006).
- Scripts: `test` and `test:dev` (`unit` and `integration`), `test:coverage` (`unit` with coverage),
  `check:types` (the package, `scripts/` with Node types, and the source type-test project),
  `check:types:dist`, `check:type-coverage`, `check:test-duplicates`, `check:test-structure`. `check:package`
  runs them in the order of `02#Tooling and scripts`. The scripts share `scripts/spec-files.ts` and
  `scripts/declarations.ts` (also used by the module-sharing spec).
- Type tests: `tests/types/{main,behaviors,presets,adapter}.test-d.ts` import by package name, with one positive
  and one `@ts-expect-error` case per `describe` block. `tests/types/tsconfig.json` maps the names to `export/`.
  `tests/types/tsconfig.dist.json` resolves them through `exports` (`--listFiles` shows `dist/*.d.ts` only).
  `tests/types/inventory.json` holds the names of `01` sections 2, 3, 4 and 7.2, and
  `tests/types/exemptions.json` holds `MaybePromise` and `Unsubscribe` with the reason.
- Failure proofs, each reverted:
  - Deleting `src/internal/paths.spec.ts`: `test:coverage` prints `Coverage for lines (0%) does not meet global
    threshold (100%) for src/internal/paths.ts`, and `check:test-structure` prints `The runtime module has no
    sibling spec src/internal/paths.spec.ts.`
  - Adding `prefixOf` to `export/adapter.ts` with no type case: `check:type-coverage` prints `which no type test
    imports`, `no describe block names with a positive case` and `with a @ts-expect-error case`.
  - Adding `extraName`: also `which is not in the inventory of 01-public-api.md.`
  - The `window` spec in a Chromium project: `Expected: "undefined"`, `Received: "object"` for both cases.
- R05: a temporary config with a Chromium project (`main`, `behaviors` and `presets` specs) and a Node project
  (`internal` specs) gave one V8 report: `No files with missing coverage.`, `5 files fully covered.` at the
  thresholds. A merged report across projects works, so the adapters can use one report (TK-042).
- `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

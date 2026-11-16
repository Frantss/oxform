---
id: TK-007
title: Test projects
phase: 1
work_package: P1-06
status: todo
depends_on: [TK-008]
branch: codex/P1-06-test-projects
pr: null
started: null
completed: null
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

- [ ] `vp run @oxform/core#test` runs the `unit` and `integration` projects in Node and passes.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] Deleting the placeholder spec fails `test:coverage` and `check:test-structure`.
- [ ] The `window` spec passes, and fails when the `unit` project runs in the browser.
- [ ] `vp run @oxform/core#check:types` and `#check:types:dist` pass.
- [ ] `vp run @oxform/core#check:type-coverage` passes, and fails for an export with no type case.
- [ ] `pnpm run check:all` passes.

## Evidence

Record the command results, the R05 result (merged report, or thresholds per project) and any deviation from
the plan here.

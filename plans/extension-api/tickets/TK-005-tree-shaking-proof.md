---
id: TK-005
title: Tree-shaking proof and size report
phase: 1
work_package: P1-04
status: todo
depends_on: [TK-003]
branch: codex/P1-04-tree-shaking-proof
pr: null
started: null
completed: null
---

# TK-005: Tree-shaking proof and size report

## Outcome

`pnpm run check:tree-shaking` passes on two placeholder tiers, and fails when a tier holds a forbidden marker.
`pnpm run report:size` prints the gzip size of each tier and exits 0.

## Scope

- In: `packages/core/tests/bundle/` with two placeholder tier fixtures, `markers.ts` and its own
  `vite.config.ts` (one build per tier). A placeholder module-level call marked `/* @__PURE__ */` that one
  tier imports and the other does not. `packages/core/scripts/check-tree-shaking.ts` and
  `scripts/measure-bundles.ts`. The core scripts `check:tree-shaking` and `report:size`, the root scripts of
  the same names, and `check:tree-shaking` in root `check:all`.
- Out: the real tiers of `03#Tree-shaking content check` and the first size report in `reports/` (TK-033).
  The CI step (TK-009).

## Read first

- `02-structure.md#Tree-shaking`: the purity rules and the fallback.
- `02-structure.md#Build`: why the tiers have their own folder and configuration.
- `02-structure.md#Tooling and scripts`: the scripts and their notes.
- `03-testing.md#Tree-shaking content check`, `#Size report` and `#Choice: how to measure`: the fail conditions
  and the method.
- Spike, read only: `explorations/extension-api/spike/vite.config.ts`, `spike/measure-bundles.ts` and
  `spike/src/bundle/tier-*.ts`. Write the code new. The new report has no budget.

## Decisions to apply

- R02: prove that `/* @__PURE__ */` survives in non-minified `dist`. If it does not, use one module per slot
  group, and record it.
- Gap 11: this ticket adds `check:tree-shaking` and `report:size`.
- No size is a gate. `report:size` exits 0 for every size and is not part of `check:all`.
- Tier fixtures import only the built entry points `@oxform/core`, `@oxform/core/behaviors` and
  `@oxform/core/presets`.

## Acceptance

- [ ] `pnpm run check:tree-shaking` passes.
- [ ] It fails when a placeholder tier imports a module whose marker that tier must not contain.
- [ ] The tier that does not import the pure call has no marker of it.
- [ ] It fails when a tier fixture imports outside the three entry points.
- [ ] `pnpm run report:size` prints both tiers and exits 0.
- [ ] `pnpm run check:all` runs `check:tree-shaking` and passes.

## Evidence

Record the command results, the printed sizes, the R02 result (annotation kept, or the fallback taken) and any
deviation from the plan here.

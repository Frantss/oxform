---
id: TK-005
title: Tree-shaking proof and size report
phase: 1
work_package: P1-04
status: in-progress
depends_on: [TK-003]
branch: codex/P1-04-tree-shaking-proof
pr: null
started: 2026-11-16
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

- [x] `pnpm run check:tree-shaking` passes.
- [x] It fails when a placeholder tier imports a module whose marker that tier must not contain.
- [x] The tier that does not import the pure call has no marker of it.
- [x] It fails when a tier fixture imports outside the three entry points.
- [x] `pnpm run report:size` prints both tiers and exits 0.
- [ ] `pnpm run check:all` runs `check:tree-shaking` and passes.

## Evidence

- Placeholders: `defineSlots` in `src/main/form.ts`, and the module-level call
  `rootSlots = /* @__PURE__ */ defineSlots({ name: 'rootSlots' }, ...)` in `src/behaviors/slots.ts`, exported
  from `@oxform/core/behaviors`.
- `tests/bundle/`: `tier-values.ts` (`values` only) and `tier-full.ts` (`standard` and `rootSlots`), `markers.ts`
  (the markers, the forbidden markers of each tier, the full tier, the allowed imports) and `vite.config.ts`
  (one minified build per tier, core and `@tanstack/*` bundled). The fixtures import the package names, which
  resolve through `exports` to `dist`.
- `scripts/check-tree-shaking.ts` fails for a forbidden marker, a marker that the full tier lacks, a fixture
  import outside the three entry points, and a tier with no output. A marker is the content of a string
  literal: the minifier writes `values` with backticks, so the check accepts any quote character.
- `pnpm run check:tree-shaking` prints `Tree-shaking check passed for 2 tiers.` Hand checks, each reverted:
  `tier-values` that imports `rootSlots` fails with `tier-values contains rootSlots, which its chain does not
  import.`; a fixture that imports `../../src/main/form` fails with `tier-values imports ../../src/main/form,
  which is not a public entry point.`
- R02: the annotation is kept in non-minified `dist` (`behaviors-*.js` holds `/* @__PURE__ */ defineSlots(...)`).
  Without it, `tier-values` contains `rootSlots`, so the annotation is what removes the call. No fallback.
- `pnpm run report:size`, exit 0: `tier-values` 271 B minified, 204 B gzip; `tier-full` 392 B minified, 256 B
  gzip.
- Root scripts `check:tree-shaking` and `report:size` run the core scripts. `check:all` is now `check`,
  `check:package`, then `check:tree-shaking`. `report:size` is not in `check:all`.
- The base `tsconfig.json` sets `allowImportingTsExtensions`, because Node runs the scripts and needs the `.ts`
  extension in `import '../tests/bundle/markers.ts'`. The base already sets `emitDeclarationOnly`.
- Open: `pnpm run check:all` stops at `@oxform/solid#check:package` (`publint` finds no assembled `dist`) before
  it reaches `check:tree-shaking`. TK-008 writes the Solid assembly and closes this item.

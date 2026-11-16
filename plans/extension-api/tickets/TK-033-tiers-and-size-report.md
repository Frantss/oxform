---
id: TK-033
title: Tiers and size report
phase: 4
work_package: P4-04
status: dropped
depends_on: [TK-030, TK-005]
branch: codex/P4-04-tiers-and-size-report
pr: null
started: null
completed: 2026-11-16
---

# TK-033: Tiers and size report

## Outcome

Every tier of `03#Tree-shaking content check` is a real form built against `dist`. `pnpm run
check:tree-shaking` passes for every tier and fails for a forbidden marker. `pnpm run report:size` prints the
size of each tier, and the first sizes are in `reports/`.

## Scope

- In: the nine tier fixtures in `tests/bundle/`, with the builder-only tier and the two tiers with slot
  groups. They replace the placeholder tiers of TK-005. One marker per extension and per slot group in `tests/bundle/markers.ts`. The fail conditions of
  `03#Tree-shaking content check`. The first size report, as one file in `reports/` (for example
  `reports/bundle-size.md`).
- Out: the scripts `check-tree-shaking.ts` and `measure-bundles.ts`, and the placeholder tiers (TK-005). The
  comparison sizes (TK-057). The sizes on the docs site (phase 8).

## Read first

- `03-testing.md#Tree-shaking content check`, `#Size report` and `#Choice: how to measure`.
- `02-structure.md#Tree-shaking` and `#Entry points and shared chunks`: the purity rules and the fallbacks.
- `02-structure.md#Tooling and scripts`: `check:tree-shaking` and `report:size`.
- Spike, read only: `explorations/extension-api/spike/src/bundle/tier-*.ts`,
  `explorations/extension-api/spike/measure-bundles.ts` and `explorations/extension-api/spike/vite.config.ts`.
  Write the code new.

## Decisions to apply

- D05: keep bundled entries with shared chunks. Fallback: if a chunk boundary keeps code alive and the check
  fails, move to `unbundle: true`.
- R02: fallback if `/* @__PURE__ */` does not survive in non-minified `dist`: split `slots.ts` into one module
  per slot group.
- Record which path was taken for D05 and R02 under Evidence.
- No size is a gate (owner decision 12). The report states the spike size of each tier as a reference.

## Acceptance

- [ ] Each tier imports only from `@oxform/core`, `@oxform/core/behaviors` and `@oxform/core/presets`,
      resolved to `dist`. Each tier is its own build.
- [ ] `pnpm run check:tree-shaking` passes for every tier.
- [ ] The check fails for a forbidden marker, for a marker absent from the full preset tier, for a tier that
      imports outside the three entries, and for a missing tier.
- [ ] `rootSlots` does not bring `reset`, and `fieldSlots` does not bring a check or `submit`.
- [ ] `pnpm run report:size` prints each tier and exits 0. The sizes are recorded in `reports/`.
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Dropped on 2026-11-16. The owner keeps only behavior tests and type tests, and deleted the tree-shaking
fixtures, the size report and the measurement scripts. TK-057, TK-062, TK-063 and TK-064 depend on this ticket.

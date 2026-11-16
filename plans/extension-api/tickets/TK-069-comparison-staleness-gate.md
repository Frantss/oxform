---
id: TK-069
title: Comparison staleness gate
phase: 9
work_package: P9-06
status: todo
depends_on: [TK-057]
branch: codex/P9-06-comparison-staleness-gate
pr: null
started: null
completed: null
---

# TK-069: Comparison staleness gate

## Outcome

`pnpm run prepublish` fails when the comparison data is stale, so a release cannot ship old numbers.

## Scope

- In: add `compare:check` to the root `prepublish`, in the order of `02-structure.md#Tooling and scripts`.
- Out: `compare:check` itself (TK-057). The warning block on the page (TK-068). `docs:check:agents` in
  `prepublish` (TK-059). `docs:package` (stage B, not in 0.7.0).

## Read first

- `07-comparison.md#6.2`: the staleness rule.
- `07-comparison.md#6.3`: the P9-06 row.
- `02-structure.md#Tooling and scripts`: the `prepublish` chain. `compare:check` is not in `check:all` or CI.
- `02-structure.md#Comparison workspace`: the `compare:check` row.

## Decisions to apply

- None in the register. Keep `compare:check` out of `check:all` and CI (`07#6.2`, approach A).

## Acceptance

- [ ] With `measuredAt` or a `readAt` more than 90 days old, `pnpm run prepublish` fails.
- [ ] With current data, `pnpm run prepublish` passes.
- [ ] `pnpm run check:all` does not run `compare:check`.
- [ ] `pnpm run check:format` passes.

## Evidence

Record the two `prepublish` runs and any deviation from the plan here.

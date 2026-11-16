---
id: TK-057
title: Comparison measurement
phase: 7
work_package: P7-10
status: todo
depends_on: [TK-056, TK-033]
branch: codex/P7-10-comparison-measurement
pr: null
started: null
completed: null
---

# TK-057: Comparison measurement

## Outcome

`compare:size` builds and measures every comparison version and writes `results/size.json`, with the same
bytes on each run. `compare:check` fails when the data is stale.

## Scope

- In: the `compare:size` and `compare:check` scripts of `example-oxform-comparison`, the root scripts of the
  same names, and the committed `examples/comparison/results/size.json`.
- Out: the form versions (TK-056). `compare:check` in `prepublish` (TK-069). The comparison page (TK-068).

## Read first

- `07-comparison.md#4.3`: the three figures, the three encodings and the build rules.
- `07-comparison.md#4.5`: the fields of `size.json` and when to measure again.
- `07-comparison.md#6.2`: the staleness rule.
- `02-structure.md#Comparison workspace`: the scripts, and neither is a gate.
- `02-structure.md#Tooling and scripts`: the root script rows.
- `03-testing.md#Choice: how to measure`: the bundler settings of `report:size`, which `compare:size` reuses.

## Decisions to apply

- D50: two forms, React only, no render counts.
- No size gate. Neither script is part of `check:all` or a CI step (`07#8` item 2).

## Acceptance

- [ ] `pnpm run compare:size` writes `results/size.json` with every field of `07#4.5`. Two runs give the same
      bytes.
- [ ] Each entry is one chunk. Oxform resolves to the built `dist`. The bundler and its version are recorded.
- [ ] `pnpm run compare:check` passes on fresh data. An old `measuredAt` or `readAt` makes it fail.
- [ ] `compare:check` is the only part that reads the network.
- [ ] `results/size.json` is committed.
- [ ] `pnpm run check:all` passes, and does not run either script.

## Evidence

Record the command results, the two compared runs and any deviation from the plan here.

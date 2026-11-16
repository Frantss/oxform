---
id: TK-035
title: Benchmark
phase: 4
work_package: P4-06
status: dropped
depends_on: [TK-030]
branch: codex/P4-06-benchmark
pr: null
started: null
completed: 2026-11-16
---

# TK-035: Benchmark

## Outcome

`vp run @oxform/core#bench` measures the cost of derived status per change at 20, 200 and 1000 fields. The
numbers are in `reports/`. The benchmark is run by hand and does not gate CI.

## Scope

- In: one benchmark file, type-checked with the package. The `bench` script of `@oxform/core`. One file in
  `reports/` with the numbers and the spike numbers beside them.
- Out: the correctness of derived status (stable references, no update for an unrelated field), which is a
  unit group of TK-022. A time threshold in CI (rejected in `03#Performance`).

## Read first

- `03-testing.md#Performance`.
- `02-structure.md#Tooling and scripts`: the `bench` script.
- `explorations/behavior-api/spike-results.md:122-123`: the first measurement.

## Decisions to apply

- R06: confirm that the installed Vite+ exposes Vitest's bench mode before you write the file. Fallback: a
  plain Node script. Record which path was taken under Evidence.
- `02#Source tree` names no place for the benchmark file. Put it in `tests/`, out of the `tests/*.spec.ts`
  glob, and record the path under Evidence.

## Acceptance

- [ ] The benchmark file is type-checked by `vp run @oxform/core#check:types`.
- [ ] `vp run @oxform/core#bench` prints a time per change at 20, 200 and 1000 fields.
- [ ] The numbers are recorded in `reports/`.
- [ ] `bench` is not a CI step and not part of `check:all`.
- [ ] `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Dropped on 2026-11-16. The owner keeps only behavior tests and type tests, and deleted the tree-shaking
fixtures, the size report and the measurement scripts. TK-057, TK-062, TK-063 and TK-064 depend on this ticket.

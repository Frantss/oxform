---
id: TK-047
title: Parity closure
phase: 6
work_package: P6-05
status: todo
depends_on: [TK-046]
branch: codex/P6-05-parity-closure
pr: null
started: null
completed: null
---

# TK-047: Parity closure

## Outcome

The three adapters export the same value and type names, and `createParts` returns the same member names for
the same form. One P10 snapshot file per fixture serves the three adapters. Every parity row passes in React,
Solid 1 and Solid 2, and each difference from React is a row of `01#6.3`. Phase 6 is complete.

## Scope

- In: the run of `check:parity` on the built declarations of the three adapters. The check of item 2 of
  `01#6.4` (same `createParts` members). The removal of any adapter-local copy of the P10 snapshot. The React,
  Solid 1 and Solid 2 runs of each parity row that TK-044 or TK-045 added.
- Out: the `check:parity` script and the scenarios P1 to P14 (TK-036). The P10 snapshot file (TK-041). The
  adapter surfaces (TK-037 to TK-045). The package assembly (TK-046).

## Read first

- `01-public-api.md#6.4`: the five parity items.
- `01-public-api.md#6.3`: the allowed differences.
- `06-roadmap.md#Gaps in scripts and checks`: gap 7.
- `02-structure.md#Tooling and scripts`: `check:parity`.
- `03-testing.md#Choice: share the list without sharing framework code`: the shared P10 snapshot.
- `03-testing.md#Deviations and decisions`: item 10.

## Decisions to apply

- Gap 7: `check:parity` covers item 1 of `01#6.4`. Items 2 and 4 are parity scenarios.
- R17: a parity row that Solid needs goes into `adapter-parity` first. Then each adapter passes it, React too.

## Acceptance

- [ ] `pnpm run check:parity` passes on the three adapters, and fails when one adapter drops an export.
- [ ] A parity scenario fails when one adapter's `createParts` lacks a member that the others return.
- [ ] One P10 snapshot file per fixture exists, in `packages/adapter-parity`, and all three adapters pass it.
- [ ] Each row added in phase 6 passes in `vp run @oxform/react#test` and `vp run @oxform/solid#test`.
- [ ] Each difference from React in the three adapters is a row of `01#6.3`.
- [ ] Phase 6 exit: the three adapters export the same names. `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Record the command results, the rows added in phase 6, and any deviation from the plan here.

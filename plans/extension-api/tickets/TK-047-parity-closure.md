---
id: TK-047
title: Parity closure
phase: 6
work_package: P6-05
status: done
depends_on: [TK-046]
branch: codex/P6-05-parity-closure
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] `pnpm run check:parity` passes on the three adapters, and fails when one adapter drops an export.
- [x] A parity scenario fails when one adapter's `createParts` lacks a member that the others return.
- [x] One P10 snapshot file per fixture exists, in `packages/adapter-parity`, and all three adapters pass it.
- [x] Each row added in phase 6 passes in `vp run @oxform/react#test` and `vp run @oxform/solid#test`.
- [x] Each difference from React in the three adapters is a row of `01#6.3`.
- [x] Phase 6 exit: the three adapters export the same names. `pnpm run check:all` and `pnpm run test` pass.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. `check:all` now ends with `pnpm run
  check:parity`: "Adapter parity check passed: @oxform/react, @oxform/solid, @oxform/solid/v2 export the same
  names." With `usePart` removed from a copy of the Solid 2 declarations, the script exits 1 and names
  `@oxform/solid/v2` and `usePart`.
- Item 2 of `01#6.4`: the new scenario P15 (`03#Adapter tests: the parity suite`) compares the members of
  `createParts` for each fixture with `Root`, one part per slot except `root`, and the five hooks. Each driver
  gives `parts(fixture)`. With `useScope` dropped from the Solid 1 `createParts`, P15 fails.
- One P10 snapshot per state, in `packages/adapter-parity/src/snapshots/`. No adapter has a copy. React, Solid 1
  and Solid 2 pass them in Node.
- Rows added in phase 6, all in `adapter-parity` first (R17), and passed by the three adapters: the
  equivalent-HTML rules of `normalizeHtml` (attribute order, bare attributes, the space before the end of a tag,
  `_hk`, the form id as a word), P13 with the timers of a framework, and P15.
- The React parity spec listed the scenarios that it ran so far. It now runs every browser scenario, as the
  Solid specs do: 13 cases, the 12 of before and P15.
- `01#6.3` rows added in phase 6: multiple select value (TK-043), focus across a list move (TK-044), boolean
  `aria-*` value (TK-045). The heading no longer says "not built".
- Phase 6 exit: the three adapters export the same 10 names. `pnpm run check:all` and `pnpm run test` pass.

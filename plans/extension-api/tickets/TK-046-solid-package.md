---
id: TK-046
title: The @oxform/solid package
phase: 6
work_package: P6-04
status: todo
depends_on: [TK-044, TK-045]
branch: codex/P6-04-solid-package
pr: null
started: null
completed: null
---

# TK-046: The @oxform/solid package

## Outcome

`@oxform/solid` publishes Solid 1 at `.` and Solid 2 at `./v2`. An isolated consumer installs and type-checks
both entries. The package checks pass, and the package runs the tests of both runtimes.

## Scope

- In: `packages/solid/export/index.ts` and `export/v2.ts`, `scripts/assemble.ts` and
  `scripts/check-consumers.ts`. The manifest: `@oxform/core` as a peer, and no `remeda`, `require` condition or
  `typesVersions`. The `build`, `test`, `test:ssr`, `test:coverage`, `check:types`, `check:types:dist`,
  `check:type-coverage`, `check:consumers` and `check:package` scripts of `@oxform/solid`. The "Adapter uses
  only public exports" and "Adapter bundles no core" checks for both entries.
- Out: the adapter source and its tests (TK-044, TK-045). The same-names check, the shared P10 snapshot and
  the `01#6.3` closure (TK-047). The `@oxform/solid` readme (phase 8).

## Read first

- `02-structure.md#Solid`: the `packages/solid` tree and the manifest changes.
- `02-structure.md#Tooling and scripts`: the `@oxform/solid` scripts and the `check:package` chain.
- `03-testing.md#Packaging layer`: "Adapter uses only public exports", "Adapter bundles no core" and
  "Consumer install".
- `02-structure.md#Release`: the peer range of each adapter.
- Read only: the current `packages/solid/scripts/assemble.ts` and `check-consumers.ts`. Write the code new.

## Decisions to apply

- D35: the Solid peer range stays a union of Solid 1 and Solid 2.

## Acceptance

- [ ] `dist/` holds the Solid 1 build and `dist/v2/` the Solid 2 build.
- [ ] `vp run @oxform/solid#check:consumers` passes for both entries, ESM only.
- [ ] `vp run @oxform/solid#check:package` passes.
- [ ] A deep import of core in `packages/solid-v*/src` fails the "only public exports" check. `dist` holds no
      copy of core.
- [ ] Phase 6 exit: `vp run @oxform/solid#test` and `#test:ssr` pass P1 to P14 for both runtimes.
- [ ] `pnpm run build` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

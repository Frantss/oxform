---
id: TK-046
title: The @oxform/solid package
phase: 6
work_package: P6-04
status: done
depends_on: [TK-044, TK-045]
branch: codex/P6-04-solid-package
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] `dist/` holds the Solid 1 build and `dist/v2/` the Solid 2 build.
- [ ] `vp run @oxform/solid#check:consumers` passes for both entries, ESM only.
- [x] `vp run @oxform/solid#check:package` passes.
- [ ] A deep import of core in `packages/solid-v*/src` fails the "only public exports" check. `dist` holds no
      copy of core.
- [x] Phase 6 exit: `vp run @oxform/solid#test` and `#test:ssr` pass P1 to P14 for both runtimes.
- [x] `pnpm run build` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. `vp run @oxform/solid#test` runs both
  runtimes: Solid 1 28 browser and 3 server tests, Solid 2 58 browser and 3 server tests. `#test:ssr` passes
  P10, P12 and P13 for both.
- `dist/` is byte-equal to `packages/solid-v1/dist`, and `dist/v2/` to `packages/solid-v2/dist` (`cmp`).
- `check:package` of `@oxform/solid`: `publint --strict` passes. `attw --profile esm-only` gives `OK (ESM)` for
  `.` and `./v2` under node16 and bundler. Then `check:types:dist` and `check:type-coverage` of the two private
  workspaces, whose `dist` files are the ones that `assemble` copies. Before this ticket, `check:all` did not
  run the Solid type checks: the root `check:package` runs only the published packages. The private
  `check:package` scripts and their `publint` and `attw` dependencies are gone.
- The manifest already had `@oxform/core` as a peer, no `remeda`, no `require` condition and no
  `typesVersions`. D35: the peer range of `solid-js` is `^1.9.0 || 2.0.0-rc.19`. `scripts/assemble.ts` is kept:
  it does what the plan asks in 7 lines.
- The built entries import only `@oxform/core` and `@oxform/core/adapter`, and hold no core code (checked once
  by hand, with no test).
- Not done, by the owner's decision of 2026-11-16 (behavior tests only): `check:consumers`, the "only public
  exports" check, the "no copy of core" spec and `test:coverage`. These boxes stay open.

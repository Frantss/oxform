---
id: TK-008
title: Adapter and example skeletons, and the version plan
phase: 1
work_package: [P1-07, P1-08]
status: todo
depends_on: [TK-003]
branch: codex/P1-07-skeletons-and-versions
pr: null
started: null
completed: null
---

# TK-008: Adapter and example skeletons, and the version plan

## Outcome

Every adapter and example workspace of the target tree builds from a placeholder, with core as a peer
dependency. The consumer checks pass. `pnpm exec changeset status --verbose` plans 0.7.0 for the three
published packages.

## Scope

- In: the manifests and configurations of `packages/react`, `packages/solid-v1`, `packages/solid-v2`,
  `packages/solid`, `packages/adapter-parity` and `examples/{kit,react,solid,solid-v2,comparison}`, each with
  one placeholder module. `@oxform/core` as a peer dependency of each adapter, the kit and `adapter-parity`.
  `packages/solid/scripts/assemble.ts`. `check:consumers` for core, React and Solid. The root `test` chain with
  the kit and the comparison workspace.
- In: `.changeset/config.json` with the `fixed` group and `privatePackages`. One `minor` changeset that names
  `@oxform/core`, `@oxform/react` and `@oxform/solid`.
- Out: the adapter code and parity scenarios (phase 5). `check:parity` (TK-036). The comparison libraries and
  shared test (TK-054, TK-056). The version bump itself (TK-072).

## Read first

- `02-structure.md#Adapters`, `#@oxform/react` and `#Solid`: the adapter trees and manifests.
- `02-structure.md#Examples` and `#Comparison workspace`: the example trees.
- `02-structure.md#Tooling and scripts`: the package scripts, `check:consumers` and the root `test` chain.
- `02-structure.md#Release`: the Changesets keys, the flow and the peer range.
- `03-testing.md#Packaging layer`: the row "Consumer install".
- Today's `packages/solid/scripts/assemble.ts` and `check-consumers.ts`, read only, at the tag of TK-001
  (TK-002 deletes them). Write the code new.

## Decisions to apply

- D06: three Solid workspaces: `solid-v1`, `solid-v2` and the published `solid`.
- D04: a `fixed` group and one `minor` changeset. If Changesets plans another version, set the three versions
  by hand at release, and record it.
- R04: read the status output before anything else depends on it.
- Gap 5: this ticket adds `check:consumers`, in core, React and Solid.
- Remove `remeda`, every `require` condition and `typesVersions` from `@oxform/solid`.

## Acceptance

- [ ] `pnpm run build` passes for every workspace.
- [ ] `pnpm run check:package` passes.
- [ ] `vp run @oxform/solid#check:consumers` passes for `.` and `./v2`.
- [ ] `pnpm exec changeset status --verbose` shows 0.7.0 for `@oxform/core`, `@oxform/react` and `@oxform/solid`,
      and no version for a private workspace.
- [ ] `pnpm run check:all` and `pnpm run test` pass.

## Evidence

Record the command results, the `changeset status` output, the D04 path taken (Changesets or manual versions)
and any deviation from the plan here.

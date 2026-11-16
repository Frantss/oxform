---
id: TK-008
title: Adapter and example skeletons, and the version plan
phase: 1
work_package: [P1-07, P1-08]
status: done
depends_on: [TK-003]
branch: codex/P1-07-skeletons-and-versions
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] `pnpm run build` passes for every workspace.
- [x] `pnpm run check:package` passes.
- [x] `vp run @oxform/solid#check:consumers` passes for `.` and `./v2`.
- [x] `pnpm exec changeset status --verbose` shows 0.7.0 for `@oxform/core`, `@oxform/react` and `@oxform/solid`,
      and no version for a private workspace.
- [x] `pnpm run check:all` and `pnpm run test` pass.

## Evidence

- Adapters, ESM only, each with `createParts(form)` as the placeholder in `src/create-parts.ts` and a sibling
  spec. The placeholder reads `slotsOf` from `@oxform/core/adapter` at runtime, so each build proves that core
  stays external (`deps.neverBundle: ['@oxform/core', /^@oxform\/core\//]`).
  - `@oxform/react`: peers `@oxform/core` (`workspace:^`) and `react`. `react-dom` is a dev dependency only
    (D35). The unused `@standard-schema/spec` and `zod` are removed.
  - `@oxform/solid-v1` and `@oxform/solid-v2` (private): peer `@oxform/core` only. A Solid peer in a private
    workspace made `pnpm peers check` fail for `@oxform/solid`, whose dev install is Solid 2, so the published
    package alone states the Solid range. `remeda`, the CJS output, the `@oxform/solid*` path aliases and the
    `vite.ssr.config.ts` files (no server test exists yet) are removed. Both set `environment: 'node'`, because
    the Solid plugins set `jsdom` when none is given.
  - `@oxform/solid`: `export/index.ts` and `export/v2.ts` re-export the private workspaces for the type check.
    `scripts/assemble.ts` (new) copies `solid-v1/dist` to `dist/` and `solid-v2/dist` to `dist/v2/`. No
    `require` condition, no `typesVersions`, no `remeda`. Peers: `@oxform/core`, `solid-js`
    (`^1.9.0 || 2.0.0-rc.19`), `@solidjs/web` (optional).
- `@oxform/adapter-parity` (new, private, no build, `exports: { "./*": "./src/*.ts" }`, peer `@oxform/core`), with
  `src/fixtures.ts`.
- Examples: `examples/kit` (new, `exports: { "./*": "./src/*.ts" }`, peer `@oxform/core`, `src/sign-in.ts`) and
  `examples/comparison` (new, `src/libraries.ts`) run in Node. `examples/{react,solid,solid-v2}` render
  `src/app.tsx` from `main.tsx` and `playground.tsx`, and depend on `@oxform/core` beside their adapter.
  `nuqs`, `@faker-js/faker` and `zod` are removed. Each workspace has one spec for its placeholder.
- `check:consumers` in core, React and Solid. The shared helper `scripts/check-consumer.ts` packs the
  workspace packages, installs the tarballs offline in an empty ESM project with `@oxform/core` overridden to
  its tarball, type-checks a consumer file with `nodenext`, and runs it with Node. Each consumer has a
  negative type case. Output: `Consumer core`, `Consumer react`, `Consumer solid-1` (`@oxform/solid`) and
  `Consumer solid-2` (`@oxform/solid/v2`): `install, type check and run passed.` Each `check:package` runs it
  last.
- Root `test`: core, `adapter-parity`, React, Solid (both runtimes), the kit, the three example apps, then the
  comparison workspace. `adapter-parity` is added beside the kit and the comparison workspace, because it has
  a spec. `@oxform/solid#test:ssr` is out of the chain until a server test exists.
- Version plan: `.changeset/config.json` has `fixed: [["@oxform/core", "@oxform/react", "@oxform/solid"]]` and
  `privatePackages: { "version": false, "tag": false }`. `.changeset/extension-api.md` is one `minor`
  changeset for the three packages. `pnpm exec changeset status --verbose`:
  `@oxform/core -> 0.7.0`, `@oxform/react -> 0.7.0`, `@oxform/solid -> 0.7.0`, all `minor`, and no private
  workspace. D04: Changesets, no manual versions. R04 is retired.
- `pnpm run build` (12 tasks), `pnpm run check:all` and `pnpm run test` (10 workspaces) pass.

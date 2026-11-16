---
id: TK-003
title: Core manifest and pack
phase: 1
work_package: P1-02
status: done
depends_on: [TK-002]
branch: codex/P1-02-core-manifest
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-003: Core manifest and pack

## Outcome

`@oxform/core` builds four ESM entry points (`.`, `./behaviors`, `./presets`, `./adapter`) from placeholder
modules. `publint --strict` and `attw --profile esm-only` pass.

## Scope

- In: `packages/core/package.json` with the target `exports`, `imports` (`#core*` and `#*`) and `files`. The
  four barrels in `packages/core/export/`. One placeholder module in each area: `src/main/`, `src/behaviors/`,
  `src/presets/`, `src/internal/`. The one `pack` configuration in `packages/core/vite.config.ts`, with one
  entry per barrel. `check:package` in core with `publint` and `attw`.
- Out: the module-sharing specs and `test:package` (TK-004). The tier fixtures and bundle scripts (TK-005).
  The lint overrides (TK-006). The test projects, coverage and type-test scripts (TK-007). `check:consumers`
  (TK-008).

## Read first

- `02-structure.md#Areas and dependency direction`: the four areas and the four barrels.
- `02-structure.md#Source tree`: the folders the placeholders go in.
- `02-structure.md#Package manifest`: the manifest, the aliases and the package validation flags.
- `02-structure.md#Build` and `#Entry points and shared chunks`: the pack options.
- `02-structure.md#Tooling and scripts`: the target `check:package` chain of core.
- `00-direction.md#Packages and entry points`: the four core entry points.

## Decisions to apply

- D02: `@oxform/core/adapter` is a fourth core entry point.
- D03: `@oxform/core/behaviors` is an entry point for the built-in extensions.
- ESM only: `format: ['esm']`. Delete `main`, `module` and the top-level `types`. No `typesVersions`.
- Use one pack configuration for all four entries, never one per entry.
- Add each step of the target `check:package` chain only when its script exists. A check with no content is
  absent, not skipped (`06#Approach to the rebuild`).

## Acceptance

- [x] `pnpm run build` writes `index`, `behaviors`, `presets` and `adapter` (`.js` and `.d.ts`) to
      `packages/core/dist`.
- [x] `vp run @oxform/core#check:package` runs `publint --strict` and `attw --pack --no-emoji --profile esm-only`,
      and both pass.
- [x] `pnpm run check` passes.

## Evidence

- Manifest: ESM only, the `exports` map of `02#Package manifest` with four entries and `./package.json`, the
  `#core`, `#core/behaviors`, `#core/presets`, `#core/adapter` and `#*` aliases. `main`, `module` and the
  top-level `types` are deleted. `version` stays `0.6.0`: TK-072 sets `0.7.0` through Changesets.
- One `pack` configuration with the entries `index`, `behaviors`, `presets` and `adapter`, `format: ['esm']`.
- Placeholders, with names of the `01` inventory only: `src/main/form.ts` (`defineForm`, `defineExtension`,
  `slotsOf`, the types `Form` and `Extension`, and a `WeakMap` from a form to its extensions),
  `src/behaviors/values.ts` (`values`), `src/presets/standard.ts` (`standard`, imports the `#core` barrels
  only) and `src/internal/paths.ts` (`joinPath`). The later phases replace each one.
- `pnpm run build` writes `index`, `behaviors`, `presets` and `adapter` (`.js`, `.js.map`, `.d.ts`), plus the
  shared chunks `form-*.js` and `behaviors-*.js` and their declarations.
- `vp run @oxform/core#check:package`: `publint --strict` reports "All good!", and `attw --pack --no-emoji
  --profile esm-only` reports OK for `node16 (from ESM)` and `bundler` on each entry. Exit 0.
- `pnpm run check` passes.

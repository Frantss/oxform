---
id: TK-006
title: Dependency-direction lint
phase: 1
work_package: P1-05
status: done
depends_on: [TK-008]
branch: codex/P1-05-dependency-lint
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-006: Dependency-direction lint

## Outcome

A runtime import against the dependency direction fails `pnpm run check:rules` in each core area. Type-only
imports pass where the direction allows them.

## Scope

- In: the `lint.overrides` entries of the root `vite.config.ts` from the override table of
  `02#Enforcement of the dependency direction`, with `no-restricted-imports` patterns and `import/no-cycle`.
  The row for `packages/core/src/**/*.spec.ts`, which bans the presets entry point outside `src/presets/`.
- In: the rows for `packages/{react,solid-v*}/src/**` and `packages/adapter-parity/**`. TK-008 makes their
  folders.
- Out: the source spec fallback, unless D10 needs it. The "adapter uses only public exports" check (TK-042).

## Read first

- `02-structure.md#Areas and dependency direction`: what each area may import.
- `02-structure.md#Enforcement of the dependency direction`: the approaches and the override table.
- `03-testing.md#Choice: keep integration tests out of unit coverage`: why unit specs cannot import presets.

## Decisions to apply

- D10: use lint overrides. If `allowTypeImports` inside `patterns` does not work in Oxlint 1.89.0, write a
  Node spec in `packages/core/tests/package/` that applies the same table, and record it.
- R03: this ticket retires the risk on `allowTypeImports`.
- Rejected: a custom Oxlint JS plugin.

## Acceptance

- [x] A deliberate wrong runtime import in each area (`internal`, `main`, `behaviors`, `presets`, `tests`, a
      unit spec) fails `pnpm run check:rules`. Remove the wrong imports after the check.
- [x] A type-only import that the table allows passes in `main` and `behaviors`.
- [x] An import cycle fails `pnpm run check:rules`.
- [x] `pnpm run check` passes with no wrong import.

## Evidence

- `vite.config.ts` has one `lint.overrides` entry per row of the table in
  `02#Enforcement of the dependency direction`, made by the helper `restrictImports(files, group, options)`
  (`no-restricted-imports` with one `patterns` group), and `import/no-cycle` for `packages/**`.
- Deviation: no separate entry for the row `packages/core/src/**/*.spec.ts`. A later override replaces the
  options of an earlier one for the same rule, so a spec would get the spec row only and lose its area row. The
  area rows of `internal`, `main` and `behaviors` already restrict `#core*` and `#presets/*`, which holds the
  spec row, and `src/presets/**` is the row's exception. So each file matches one entry.
- Relative paths in `presets` are the globs `./**` and `../**`: `../*` does not match `../behaviors/values`.
- Wrong imports, each removed after the check, and the `pnpm run check:rules` output (`help: This import goes
  against the dependency direction of the package areas.`):
  - `src/internal/probe-wrong.ts` imports `#behaviors/values`: `'#behaviors/values' import is restricted`.
  - `src/internal/probe-type.ts`, `import type` from `#main/form`: `'#main/form' import is restricted`.
  - `src/main/probe-wrong.ts` imports `#behaviors/values`: restricted.
  - `src/behaviors/probe-wrong.ts` imports `#presets/standard`: restricted.
  - `src/presets/probe-wrong.ts` imports `#main/form`, and `probe-relative.ts` imports `../behaviors/values`:
    both restricted.
  - `tests/probe-wrong.ts` imports `#main/form`: restricted.
  - The unit spec `src/behaviors/probe.spec.ts` imports `#core/presets`: restricted.
  - `packages/react/src/probe-wrong.ts` imports `@oxform/core/presets`, and
    `packages/adapter-parity/src/probe-wrong.ts` imports `react`: both restricted.
  - `src/main/probe-cycle-a.ts` and `probe-cycle-b.ts` import each other: `import(no-cycle): Dependency cycle
    detected` on both.
- Allowed type imports: `import type { values } from '#behaviors/values'` in `src/main/` and
  `import type { Form } from '#main/form'` in `src/behaviors/` pass.
- D10: lint overrides. `allowTypeImports` inside `patterns` works in Oxlint 1.89.0, so no source spec is
  needed. R03 is retired.
- `pnpm run check` passes with no wrong import.

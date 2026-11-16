---
id: TK-006
title: Dependency-direction lint
phase: 1
work_package: P1-05
status: todo
depends_on: [TK-008]
branch: codex/P1-05-dependency-lint
pr: null
started: null
completed: null
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

- [ ] A deliberate wrong runtime import in each area (`internal`, `main`, `behaviors`, `presets`, `tests`, a
      unit spec) fails `pnpm run check:rules`. Remove the wrong imports after the check.
- [ ] A type-only import that the table allows passes in `main` and `behaviors`.
- [ ] An import cycle fails `pnpm run check:rules`.
- [ ] `pnpm run check` passes with no wrong import.

## Evidence

Record each wrong import with its lint output, the D10 path taken (lint or source spec) and any deviation from
the plan here.

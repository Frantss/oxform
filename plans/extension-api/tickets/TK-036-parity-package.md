---
id: TK-036
title: Parity package
phase: 5
work_package: P5-01
status: todo
depends_on: [TK-030]
branch: codex/P5-01-parity-package
pr: null
started: null
completed: null
---

# TK-036: Parity package

## Outcome

The private `adapter-parity` package holds the fixture forms and one scenario function for each of P1 to
P14. Each scenario takes a driver and asserts on the DOM, the HTML and the core instance only. The package has
no framework dependency, and `check:parity` compares the exported names of the built adapters.

## Scope

- In: `packages/adapter-parity/src/`: the fixture forms, the driver contract (`mount`, `renderToString`,
  `hydrate`, `unmount`), one function per scenario P1 to P14, and the id normalization for the shared P10
  snapshot. `packages/adapter-parity/scripts/check-parity.ts` and the `check:parity` script. The
  `packages/adapter-parity/**` lint override that bans framework imports.
- Out: a driver, fixture views and a passing run in an adapter (TK-037 to TK-041 for React, TK-043 to TK-045
  for Solid). The P10 snapshot file itself (TK-041 writes it from React). The run of `check:parity` against
  all three adapters (TK-047).

## Read first

- `03-testing.md#Adapter tests: the parity suite`: the scenarios P1 to P14 and what each one asserts.
- `03-testing.md#Choice: share the list without sharing framework code`: the driver contract, the lint rule
  and the shared P10 snapshot.
- `02-structure.md#Solid`: the tree and the manifest of `packages/adapter-parity`.
- `02-structure.md#Enforcement of the dependency direction`: the `packages/adapter-parity/**` override.
- `02-structure.md#Tooling and scripts`: `check:parity` and the `adapter-parity` scripts.
- `01-public-api.md#6.4`: what parity means.
- `04-documentation.md#5.1`: the quick start form that P10 renders (the lean sign-in chain, D39).
- Spike, read only: `explorations/extension-api/spike/src/react/parts.spec.tsx` and `parts-core.spec.tsx`,
  the source of most rows. Write the code new, with no React in it.

## Decisions to apply

- Gap 7: `check:parity` covers item 1 of `01#6.4`. Items 2 and 4 are parity scenarios.
- The root `vite.config.ts` is a shared file of the core track. Ask the core track for the lint override in a
  separate pull request (`06-roadmap.md#Phases`).

## Acceptance

- [ ] `packages/adapter-parity/src` exports one function per scenario P1 to P14 and the driver type.
- [ ] Each scenario uses only the driver, the DOM, the HTML and the core instance.
- [ ] An import of `react`, `solid-js`, `@solidjs/*` or an adapter in `packages/adapter-parity/**` fails
      `pnpm run check:rules`.
- [ ] `check:parity` fails when two adapter declaration files export different names.
- [ ] `vp run @oxform/adapter-parity#check:types` and `pnpm run check:rules` pass.

## Evidence

Record the command results and any deviation from the plan here.

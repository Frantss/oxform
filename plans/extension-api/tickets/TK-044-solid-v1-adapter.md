---
id: TK-044
title: Solid 1 adapter
phase: 6
work_package: P6-02
status: todo
depends_on: [TK-043, TK-042]
branch: codex/P6-02-solid-v1-adapter
pr: null
started: null
completed: null
---

# TK-044: Solid 1 adapter

## Outcome

`packages/solid-v1` has the full adapter surface with the export names of `@oxform/react`. It differs from
React only in the rows of `01#6.3`. The parity scenarios P1 to P14 pass.

## Scope

- In: `packages/solid-v1/export/index.ts` and `src/` with `create-parts.ts`, `hooks.ts` and `use-part.ts`,
  built from the probe of TK-043. Their sibling specs. `tests/parity.spec.tsx` with the full driver,
  `tests/server/` in Node, and `tests/types/` with the adapter rows of the type matrix and the `ElementTag`
  type test. `test:ssr` and `test:coverage` of the workspace.
- Out: Solid 2 (TK-045). The assembly, the manifest of `@oxform/solid` and the consumer check (TK-046). The
  check that the three adapters export the same names and share one P10 snapshot (TK-047).

## Read first

- `01-public-api.md#6.3`: every row, and the paragraph on what differs between Solid 1 and Solid 2.
- `01-public-api.md#6.1` and `#6.2`: the shared contract and the export names.
- `01-public-api.md#7.3`: the `ElementTag` type test in each adapter.
- `01-public-api.md#9`: G18. Each adapter maps the HTML attribute names.
- `02-structure.md#Solid`: the `packages/solid-v1` tree.
- `03-testing.md#Adapter tests: the parity suite`: P1 to P14. P14's double mount is mount, dispose, mount.
- `03-testing.md#Matrix`: the adapter rows.
- `03-testing.md#Coverage`: the Solid thresholds.
- No Solid spike exists. Read only, for patterns: the current `packages/solid-v1/src` and
  `packages/solid-v1/src/server-tests/ssr.spec.ts`. Read the React adapter of TK-037 to TK-041. Write the code
  new.

## Decisions to apply

- D33: Solid hooks keep the `use*` names.
- D29: coverage is 100 for statements, functions and lines, and 95 for branches, per file.
- R17: if Solid needs a new parity row, add it to `adapter-parity` first, then pass it here. Record the row
  under Evidence. TK-047 makes the other adapters pass it.

## Acceptance

- [ ] P1 to P14 pass: the Chromium rows in `tests/parity.spec.tsx`, P10, P12 and P13 in Node through
      `vp run @oxform/solid-v1#test:ssr`.
- [ ] Every difference from React is a row of `01#6.3`.
- [ ] Each export has a positive and a negative type case in `tests/types/`. Every `ElementTag` is a key of
      Solid's intrinsic elements.
- [ ] `vp run @oxform/solid-v1#test:coverage` passes at the thresholds of `03#Coverage`.
- [ ] `vp run @oxform/solid-v1#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results, any new parity row and any deviation from the plan here.

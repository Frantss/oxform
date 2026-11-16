---
id: TK-044
title: Solid 1 adapter
phase: 6
work_package: P6-02
status: done
depends_on: [TK-043, TK-042]
branch: codex/P6-02-solid-v1-adapter
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] P1 to P14 pass: the Chromium rows in `tests/parity.spec.tsx`, P10, P12 and P13 in Node through
      `vp run @oxform/solid-v1#test:ssr`.
- [x] Every difference from React is a row of `01#6.3`.
- [x] Each export has a positive and a negative type case in `tests/types/`. Every `ElementTag` is a key of
      Solid's intrinsic elements.
- [ ] `vp run @oxform/solid-v1#test:coverage` passes at the thresholds of `03#Coverage`.
- [x] `vp run @oxform/solid-v1#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. `@oxform/solid-v1`: 28 browser tests (P1 to P14
  in Chromium, and the sibling specs of `create-parts`, `hooks` and `use-part`), and 3 server tests (P10, P12 and
  P13 in Node, `test:ssr`). React still passes 23 browser and 3 server tests against the same scenarios.
- `check:package` of `@oxform/solid-v1`: `publint --strict`, `attw`, `check:types:dist` and `check:type-coverage`
  pass. Each of the 10 exports has a positive case and a `@ts-expect-error` case. With the `@ts-expect-error`
  lines removed, each of the 11 negative cases fails for its own reason. `ElementTag` extends the keys of
  Solid's `JSX.IntrinsicElements`.
- P11 in Chromium: Solid's client build renders no string. The Vitest browser command `renderView`
  (`vite.config.ts`) loads `tests/render.ts` through `project.vite.ssrLoadModule` and renders it in Node.
  `solid({ ssr: true })` makes the client code hydratable. The driver sets the `_$HY` registry that Solid's
  hydration script makes.
- New parity behavior, under R17, in `adapter-parity` first (`test: compare the server html of the adapters as
  equivalent html`):
  - `normalizeHtml` sorts the attributes of a tag, writes a bare attribute as `=""` and removes the space
    before the end of a tag. Solid's server HTML differs from React's in these points only. The stored
    snapshots were updated from React, and Solid matches them without an update.
  - P13 runs the pending timers after the render, and asserts that no timer is left. Solid's
    `renderToString` starts `setTimeout(dispose)` for its root (`solid-js/web/dist/server.js:227`), so a count
    of `setTimeout` calls cannot be 0. `03#P13` and `01#6.4` item 4 say this.
- New `01#6.3` row: focus across a list move. Solid moves both nodes of a swap, and Chrome blurs a moved
  element, so P7 failed. `storeState` applies each store write, gives the focus back to the element that had it,
  and drops the slot events that the write fires.
- Core fix found by P7 (`fix: move the item ids before a store subscriber hears an array write`): `arrays`
  set the item ids after the write, so a subscriber of the write read the old ids. The new case in
  `arrays.spec.ts` failed before the fix.
- Deviations: the parity spec is `tests/parity.spec.ts`, not `.tsx`. The branch name is the one of this ticket.
- Not done: `test:coverage`. The owner dropped coverage gates, so the box stays open.
- G18 for Solid is identity: Solid takes the HTML attribute names.

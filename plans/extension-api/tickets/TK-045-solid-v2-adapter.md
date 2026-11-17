---
id: TK-045
title: Solid 2 adapter
phase: 6
work_package: P6-03
status: done
depends_on: [TK-043, TK-042]
branch: codex/P6-03-solid-v2-adapter
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-045: Solid 2 adapter

## Outcome

`packages/solid-v2` has the full adapter surface with the export names of `@oxform/react` and the same public
types as Solid 1. It differs from React only in the rows of `01#6.3`. The parity scenarios P1 to P14 pass, in a
desktop and a mobile viewport, with hydration.

## Scope

- In: `packages/solid-v2/export/index.ts` and `src/` with `create-parts.ts`, `hooks.ts` and `use-part.ts`,
  ported from the probe of TK-043 to the Solid 2 APIs. Their sibling specs. `tests/parity.spec.tsx` with the
  full driver and the mobile viewport, `tests/server/` with server rendering and hydration in Node, and
  `tests/types/` with the adapter rows of the type matrix and the `ElementTag` type test. `test:ssr` and
  `test:coverage` of the workspace.
- Out: Solid 1 (TK-044). The assembly, the manifest of `@oxform/solid` and the consumer check (TK-046). The
  check that the three adapters export the same names and share one P10 snapshot (TK-047).

## Read first

- `01-public-api.md#6.3`: every row, and the paragraph on what differs between Solid 1 and Solid 2 (imports
  from `@solidjs/web`, the effect and memo APIs).
- `01-public-api.md#6.1` and `#6.2`: the shared contract and the export names.
- `01-public-api.md#7.3`: the `ElementTag` type test in each adapter.
- `01-public-api.md#9`: G18. Each adapter maps the HTML attribute names.
- `02-structure.md#Solid`: the `packages/solid-v2` tree.
- `03-testing.md#Adapter tests: the parity suite`: P1 to P14. P14's double mount is mount, dispose, mount.
- `03-testing.md#Matrix`: the adapter rows.
- `03-testing.md#Coverage`: the Solid thresholds.
- No Solid spike exists. Read only, for patterns: the current `packages/solid-v2/src`,
  `packages/solid-v2/src/tests/hydration.spec.tsx` and `packages/solid-v2/src/server-tests/ssr.spec.ts`. Read
  the React adapter of TK-037 to TK-041. Write the code new.

## Decisions to apply

- D33: Solid hooks keep the `use*` names.
- D29: coverage is 100 for statements, functions and lines, and 95 for branches, per file.
- R17: if Solid needs a new parity row, add it to `adapter-parity` first, then pass it here. Record the row
  under Evidence. TK-047 makes the other adapters pass it.

## Acceptance

- [x] P1 to P14 pass: the Chromium rows in `tests/parity.spec.tsx` in a desktop and a mobile viewport, P10,
      P12 and P13 in Node through `vp run @oxform/solid-v2#test:ssr`.
- [x] P11 hydrates the server HTML with no console warning or error.
- [x] Every difference from React is a row of `01#6.3`. The public types equal those of Solid 1.
- [x] Each export has a positive and a negative type case in `tests/types/`. Every `ElementTag` is a key of
      Solid's intrinsic elements.
- [ ] `vp run @oxform/solid-v2#test:coverage` passes at the thresholds of `03#Coverage`.
- [x] `vp run @oxform/solid-v2#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build && pnpm run check:all && pnpm run test`: exit 0. `@oxform/solid-v2`: 58 browser tests (P1 to
  P14 and the sibling specs of `create-parts`, `hooks` and `use-part`, in the `desktop` and `mobile` viewports),
  and 3 server tests (P10, P12 and P13 in Node, `test:ssr`). Solid 1 and React still pass.
- P11 hydrates the server HTML with no console warning or error, in both viewports.
- `check:package` of `@oxform/solid-v2`: `publint --strict`, `attw`, `check:types:dist` and
  `check:type-coverage` pass. With the `@ts-expect-error` lines removed, each of the 11 negative cases fails for
  its own reason. The built `dist/index.d.ts` equals the one of Solid 1, apart from the import source of `JSX`
  and `ComponentProps` (`01#6.3`, last paragraph).
- New parity behavior, under R17, in `adapter-parity` first (`test: remove the solid 2 hydration attribute and
  match the form id as a word`): `normalizeHtml` removes `_hk`, whose value has no quotes. The form id is
  replaced only where it starts a word of an attribute value, because the Solid 2 server id is `2`. Solid 1 and
  React match the same snapshots.
- New `01#6.3` row: boolean `aria-*` value. Solid 2 writes a boolean as presence, so `aria-invalid` was `""`,
  which ARIA reads as false. The part writes the boolean as a string. A sibling case fails without it.
- Solid 2 behavior that the port handles, with no difference from React in what a consumer sees:
  - Updates are batched. `storeState` applies each store write with `flush`, so the DOM follows a write at once.
  - A ref runs with no owner, before the element is attached. The part creates its render effect and its
    cleanup in the owner of the render, and the ref only attaches.
  - `merge` keeps a key whose value is `undefined`. A part gives no `value` that the slot left undefined, so the
    `value` of the author stays (P2). Solid 1 has the same code now.
  - A computation that only the client makes is `transparent`, so it takes no hydration key.
  - A read of props outside a tracking scope warns. `Root` reads `form` and `options` once, and the ref reads
    the part, in `untrack`.
- Vitest compiles client code non-hydratable in test mode (`@solidjs/vite-plugin`, `getSolidOptions`), so
  `vite.config.ts` sets `solid: { hydratable: true }`. The server render merges its props from a function, as the
  browser driver does, so the two make the same owners and the hydration keys match.
- Deviations: an uncaught render error halts Solid 2 for every later test. The cases that expect a throw render
  in an `<Errored>` boundary and compare the caught error. The parity spec is `tests/parity.spec.ts`.
- Not done: `test:coverage`. The owner dropped coverage gates, so the box stays open.
- G18 for Solid 2: HTML attribute names, and a boolean `aria-*` value as a string.

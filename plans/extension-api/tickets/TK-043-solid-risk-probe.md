---
id: TK-043
title: Solid 1 risk probe
phase: 6
work_package: P6-01
status: done
depends_on: [TK-036, TK-037]
branch: codex/P6-01-solid-risk-probe
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-043: Solid 1 risk probe

## Outcome

A minimal `createParts` in Solid 1 renders parts that pass the parity scenarios P1 and P8. The probe answers
the two known risks: a controlled value is set as a DOM property, and the toggle `click` listener works or is
not needed in Solid.

## Scope

- In: a minimal `packages/solid-v1/src/create-parts.ts` with `Root` and the part components, enough for P1 and
  P8. The parity driver and fixture views for P1 and P8 in `packages/solid-v1/tests/parity.spec.tsx`. The
  `options` prop of `Root`, as `01#6.1` states it.
- Out: the full Solid 1 surface and the other scenarios (TK-044). Solid 2 (TK-045). The `@oxform/solid`
  package (TK-046).

## Read first

- `01-public-api.md#6.3`: the last paragraph names the two risks. The table lists what differs from React.
- `01-public-api.md#6.1`: the part contract and the `Options` row (written by TK-037).
- `02-structure.md#Solid`: the `packages/solid-v1` tree.
- `03-testing.md#Adapter tests: the parity suite`: P1 and P8.
- No Solid spike exists. Read only, for patterns: the current `packages/solid-v1/src` (`internal/`,
  `create-form.ts`) and the `field` slot in `explorations/extension-api/spike/src/slots.ts`. Write the code new.

## Decisions to apply

- D34: options are a type only. `Root` takes them in `options`, as `01#6.1` states.
- R10: the part model was made for React and has no Solid spike. If P1 or P8 cannot pass with that model,
  stop. Propose a change to `01#6.1` or `01#6.3` before TK-044 and TK-045 start. Record which path was taken
  under Evidence.

## Acceptance

- [x] P1 and P8 pass in `packages/solid-v1/tests/parity.spec.tsx` in Chromium.
- [x] A test shows that a controlled value reaches the element as a DOM property.
- [x] A test shows whether the toggle `click` listener is needed in Solid.
- [x] `vp run @oxform/solid-v1#check:types` passes.

## Evidence

- `packages/solid-v1/src/part-view.ts`, `context.ts` and `create-parts.ts`: `Root`, the part components and
  `useForm`. The parts render with `Dynamic` from `solid-js/web`. The slot's `on` handlers become native
  listeners and `bind` runs in the element ref. The store state is a signal, with no subscription on the server.
  `Root` takes `options`, makes the id with `createUniqueId`, follows `options` in a `createComputed`, and calls
  `unmount` in `onCleanup`.
- `packages/solid-v1/tests/{driver.ts,views.tsx,parity.spec.ts}`: the Solid 1 driver and the `signIn` and
  `inputs` views. `renderToString` and `hydrate` reject until TK-044.
- `vp run @oxform/solid-v1#test`: 6 passed. P1 and P8 pass in Chromium (`tests/parity.spec.ts`).
- Risk 1, controlled value: Solid sets `value` and `checked` as DOM properties. `src/create-parts.spec.tsx`
  ("sets a controlled value as a DOM property, also after the user typed") types, then sets the value: the
  element shows it, and the `value` attribute stays absent. One gap was found: Solid also sets a list `value`
  on a `<select multiple>` as a property, which turns `['a', 'b']` into `"a,b"` and selects nothing. The part
  selects the options itself for a list value. "selects the options of a multiple select from a list value"
  fails without that code and passes with it. `01#6.3` has a new row for it.
- Risk 2, toggle `click` listener: not needed in Solid. "reads a controlled checkbox on input, with no click
  listener" uses a slot that reads a checkbox on `input` only: two clicks give `true` and then `false`, in the
  value and in `checked`. The `field` slot of core keeps its `click` listener, because React needs it and it
  also works in Solid (P8).
- R10: the part model holds for Solid 1. No change to `01#6.1` was needed.
- `vp run @oxform/solid-v1#check:types` passes. `pnpm run build`, `pnpm run check:all` and `pnpm run test` pass.
- Deviation: `render` (function only) is in the probe, because the `inputs` view renders the two selects with
  it. The other parts of the Solid surface are TK-044.
- Deviation: the parity spec is `tests/parity.spec.ts`, not `.tsx`, because it holds no JSX.

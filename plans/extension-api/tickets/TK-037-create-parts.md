---
id: TK-037
title: React createParts
phase: 5
work_package: P5-02
status: todo
depends_on: [TK-036, TK-017]
branch: codex/P5-02-create-parts
pr: null
started: null
completed: null
---

# TK-037: React createParts

## Outcome

`createParts(form, elements?)` returns `Root` and one part component per slot. Parts render the slot's
element, attributes, events and `bind`, and the ids link label, control and error. The parity scenarios P1,
P2, P4, P8 and P9 pass in Chromium.

## Scope

- In: `packages/react/src/create-parts.tsx` with `createParts`, `Root` (also for a form with no `root` slot),
  the part components, the element map, ids, events, `bind`, the merged ref and the focus guard. The instance
  context per form object. The mapping of HTML attribute names to React prop names. The effect of each option
  kind. `packages/react/export/index.ts` with `createParts`. The parity driver and fixture views in
  `packages/react/tests/parity.spec.tsx`, and the sibling spec `src/create-parts.spec.tsx`.
- Out: `useForm`, `useSelector`, `useField` and `useArray` (TK-038). The `scope` prop and `useScope` (TK-039).
  `usePart` and the shared context lookup from `usePart` (TK-040). Server rendering, hydration, the `form`
  prop of `Root` (an existing instance), unmount and double mount (TK-041). Type tests, package checks and coverage thresholds (TK-042).

## Read first

- `01-public-api.md#6.1`: the rows `createParts` to `Root`, `Options`, `Ids` and `Instance lookup`.
- `01-public-api.md#6.2`: the React exports and the `render` forms. The module has `'use client'`.
- `01-public-api.md#9`: G11, G17 and G18.
- `01-public-api.md#7.2`: what the adapter imports from `@oxform/core/adapter`.
- `02-structure.md#@oxform/react`: the package tree and the manifest.
- `03-testing.md#Adapter tests: the parity suite`: P1, P2, P4, P8 and P9.
- Spike, read only: `explorations/extension-api/spike/src/react/create-parts.tsx`, `parts.spec.tsx` and
  `parts-core.spec.tsx`. Write the code new.

## Decisions to apply

- D30: a part is scoped only by the `scope` prop. Do not carry over `within` or `BoundParts`.
- D34: state in `01#6.1` what each option kind does in an adapter. Remove a kind that has no effect in any
  adapter (G11). The removal in core is a separate pull request of the core track.
- D49: `Root` of a form with no `root` slot renders no element and only provides the instance.
- G17: verify in a browser test that a programmatic `focus()` or `blur()` runs status and validation twice,
  then guard it.
- G18: `Attributes` uses HTML attribute names. The adapter maps them to React prop names.

## Acceptance

- [ ] P1, P2, P4, P8 and P9 pass in `packages/react/tests/parity.spec.tsx` in Chromium.
- [ ] `src/create-parts.spec.tsx` has a G17 test that fails without the guard and passes with it.
- [ ] `01-public-api.md#6.1` states the effect of each option kind.
- [ ] An unknown name in `elements` throws.
- [ ] The adapter imports only `@oxform/core` and `@oxform/core/adapter`.
- [ ] `vp run @oxform/react#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results, the G17 result, the option kinds kept and removed, and any deviation from the plan
here.

---
id: TK-037
title: React createParts
phase: 5
work_package: P5-02
status: done
depends_on: [TK-036, TK-017]
branch: codex/P5-02-create-parts
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] P1, P2, P4, P8 and P9 pass in `packages/react/tests/parity.spec.tsx` in Chromium.
- [x] `src/create-parts.spec.tsx` has a G17 test that fails without the guard and passes with it.
- [x] `01-public-api.md#6.1` states the effect of each option kind.
- [x] An unknown name in `elements` throws.
- [x] The adapter imports only `@oxform/core` and `@oxform/core/adapter`.
- [x] `vp run @oxform/react#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `packages/react/src`: `create-parts.ts` (`createParts`, `Root` with and without a `root` slot, the part
  components, the element map), `part-view.ts` (one part: slot attributes mapped to React names (G18), native
  listeners, `bind`, merged refs, the controlled `onChange`), `context.ts` (one context per form object) and
  `types.ts`. The source is `.ts` with `createElement`, because the `#*` import map resolves `.ts` only.
- `tests/driver.tsx` and `tests/views.tsx`: the React driver and the views of P1, P2, P4, P8 and P9.
  `tests/parity.spec.tsx` runs P1, P1 bare, P2, P4, P8 and P9 in Chromium: pass.
- G17: `src/create-parts.spec.tsx` shows that a programmatic `focus()` or `blur()` of a registered field ran
  its validator twice (`expected [ 2, 'Name' ] to deeply equal [ 1, 'Name' ]`). The guard is in core `events`,
  because the double run comes from `events.focus` and `events.blur` and every adapter has it. It is its own
  commit, with a core case that fails without it.
- D34: the `Option kinds` row of `01#6.1` states that no kind changes what an adapter does. Removing the kinds
  from core is left to the owner (cross-cutting).
- An unknown name in `elements` throws `oxform: the form has no part "nope".`
- The adapter imports only `@oxform/core`, `@oxform/core/adapter`, `react` and `@tanstack/react-store`.
- Deviation: `createParts` also returns `useForm`, because the views need the instance. TK-038 adds the other
  hooks.
- The parity scenarios find a mounted container by a test id: `page.elementLocator` finds it by its text, which
  changes. A `<select>` is labelled by `aria-label`, because its options are part of a `<label>` text.
- A spec of an adapter may import the built-in behaviors and presets (a lint override). It is not shipped.

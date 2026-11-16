---
id: TK-040
title: usePart
phase: 5
work_package: P5-05
status: done
depends_on: [TK-037]
branch: codex/P5-05-use-part
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-040: usePart

## Outcome

`usePart(form, slot, slotProps, props, tag)` renders one slot in another element, with the part's own props.
A part also renders as another element through `render`. The parity scenario P5 passes in Chromium.

## Scope

- In: `packages/react/src/use-part.ts` with `usePart`, and its export in `packages/react/export/index.ts`. The
  clear error when `usePart` gets a form object that no `Root` provides. The sibling spec `src/use-part.spec.tsx`.
  The driver views that P5 needs.
- Out: `createParts`, `render` and the instance context (TK-037). The `PartProps<'select'>` type test (TK-042).

## Read first

- `01-public-api.md#6.1`: the rows `usePart` and `Instance lookup`.
- `01-public-api.md#7.5`: item 3.
- `01-public-api.md#9`: G14.
- `03-testing.md#Adapter tests: the parity suite`: P5.
- Spike, read only: `explorations/extension-api/spike/src/react/create-parts.tsx` (`usePart`) and
  `parts-core.spec.tsx`. Write the code new.

## Decisions to apply

- D32: `props` of `usePart` is the part's own props for that tag (`PartProps` without the slot props).
- G14: `createParts(form.configure(x))` and `usePart(form, ...)` do not share a context. Throw a clear error in
  `usePart`.

## Acceptance

- [x] P5 passes in `packages/react/tests/parity.spec.tsx` in Chromium.
- [x] A browser test: a wrapper forwards `PartProps<'select'>`, with `render` and a function child.
- [x] `usePart` with a form object that no `Root` provides throws a clear error.
- [x] `vp run @oxform/react#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all` (no lint warning), `pnpm run test`: pass.
- `packages/react/src/use-part.ts`: `usePart(form, slot, slotProps, props, tag)`, exported from the package.
  `props` is the part props of the tag without the slot props (D32).
- The slots of a form are cached per form object (`slotsOfForm`): `slotsOf` builds new slot objects on each call,
  so a part rendered by `usePart` would attach and `bind` again on each render.
- P5 passes in Chromium with the `otherElements` view: the Field `name` through `render` as a `<textarea>`, and
  `usePart` of the `field` slot as a `<select>`.
- `src/use-part.spec.tsx`: a wrapper forwards `PartProps<'select'>` with `render` and a function child, and the
  select writes the value; `usePart` with `form.configure({})`, which no `Root` provides, throws the message
  that names `configure` (G14); an unknown slot throws.
- The view contract labels a `<textarea>` with `aria-label`, like a `<select>`.

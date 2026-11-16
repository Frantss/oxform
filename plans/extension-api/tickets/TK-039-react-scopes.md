---
id: TK-039
title: React scopes in parts
phase: 5
work_package: P5-04
status: done
depends_on: [TK-038]
branch: codex/P5-04-react-scopes
pr: null
started: 2026-11-16
completed: 2026-11-16
---

# TK-039: React scopes in parts

## Outcome

A part takes a `scope` prop, and its `'key'` props are then paths of the scope. `useScope` returns a stable
scope, and the adapter hooks take `{ scope }`. The parity scenario P6 passes in Chromium.

## Scope

- In: the `scope` prop of the part components in `packages/react/src/create-parts.tsx`. `useScope` in
  `src/hooks.ts`. The `{ scope }` option of `useField`, `useArray` and `useScope`. The sibling spec rows. The
  driver views that P6 needs.
- Out: the parts and the other hooks (TK-037, TK-038). `usePart` (TK-040). The scope cache per prefix in core
  (G9, phase 2). Type tests of the `scope` prop (TK-042).

## Read first

- `01-public-api.md#6.1`: the rows `scope` prop, `useField`, `useArray` and `useScope`.
- `03-testing.md#Adapter tests: the parity suite`: P6.
- `03-testing.md#Scopes (defineScope, form.scope)`: the core behavior that the adapter forwards.
- Spike, read only: `explorations/extension-api/spike/src/react/create-parts.tsx` and `parts.spec.tsx`
  (scope rows). Write the code new.

## Decisions to apply

- D30: the `scope` prop is the only way to scope a part. `within` is removed. The hooks keep `{ scope }`.

## Acceptance

- [x] P6 passes in `packages/react/tests/parity.spec.tsx` in Chromium: the `scope` prop, nested scopes, a
      placed scope, and the hooks with `{ scope }`.
- [x] `useScope` returns the same object for the same inputs across renders.
- [x] No `within` export or member exists.
- [x] `vp run @oxform/react#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all` (no lint warning), `pnpm run test`: pass.
- A part takes `scope`. Its `'key'` props are then paths of the scope. The `PartComponent` type has a scoped
  overload, with inferred check names and field members. `Scope<Scoped, any>` would turn the check sugar into an
  index signature, and an instance passed as a scope would then fail to type-check.
- `src/hooks.ts`: `useScope`, and `{ scope }` on `useField`, `useArray` and `useScope`.
- P6 passes in Chromium with the `scopes` view: the `scope` prop, a nested scope (`geo`), the placed scope
  `address` through `form.scope`, `useField` with a scope, and `useArray` with the instance as the scope.
- `src/hooks.spec.tsx`: `useScope` returns the same scope across two renders.
- D30: no `within` exists in `packages/react`. No test pins the export list (behavior tests only).
- Also fixed: a `react(refs)` lint warning on the merged ref of `part-view.ts`, from TK-037. The check script
  passed with it, and the TK-037 report missed it.

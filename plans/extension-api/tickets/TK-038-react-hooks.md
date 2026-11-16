---
id: TK-038
title: React hooks
phase: 5
work_package: P5-03
status: todo
depends_on: [TK-037]
branch: codex/P5-03-react-hooks
pr: null
started: null
completed: null
---

# TK-038: React hooks

## Outcome

`createParts` returns `useForm`, `useSelector`, `useField` and `useArray`. The hooks return plain values and
re-render the component only when what it reads changes. The parity scenarios P3 and P7 pass in Chromium.

## Scope

- In: `packages/react/src/hooks.ts` with `useForm`, `useSelector`, `useField` and `useArray`. The `FormHooks`
  type. The sibling spec `src/hooks.spec.tsx`. The driver views that P3 and P7 need.
- Out: `useScope` and the `{ scope }` option of the hooks (TK-039). `usePart` (TK-040). The server snapshot of
  `useSelector` under test (TK-041). Type tests (TK-042). The documented replacement for `useFormEffect`
  (phase 8).

## Read first

- `01-public-api.md#6.1`: the rows `useForm`, `useSelector`, `useField` and `useArray`.
- `01-public-api.md#6.2`: hooks return plain values; `useSelector` passes the state at creation as the
  server snapshot.
- `01-public-api.md#7.4`: the replacement for `useFormEffect`.
- `01-public-api.md#9`: G13.
- `03-testing.md#Adapter tests: the parity suite`: P3 and P7.
- Spike, read only: `explorations/extension-api/spike/src/react/create-parts.tsx` (the hooks) and
  `parts.spec.tsx`. Write the code new.

## Decisions to apply

- D31: no adapter export replaces `useFormEffect`.
- G13: `useField` and `useArray` read the state keys `values` and `status`. State the two keys as part of the
  adapter contract.

## Acceptance

- [ ] P3 and P7 pass in `packages/react/tests/parity.spec.tsx` in Chromium.
- [ ] `useForm` outside a `Root` of the same form throws.
- [ ] No `useFormEffect` export exists.
- [ ] `vp run @oxform/react#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

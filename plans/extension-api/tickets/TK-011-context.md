---
id: TK-011
title: Context
phase: 2
work_package: P2-02
status: todo
depends_on: [TK-010]
branch: codex/P2-02-context
pr: null
started: null
completed: null
---

# TK-011: Context

## Outcome

Each form instance has one context over one store. Each extension sees only its own state slice. Cleanups
run at each unmount and at `destroy()`. The behaviors reach `validation` through one link, which is a stand-in
with no check when the chain has no `validation`.

## Scope

- In: `src/main/context.ts` with `createContext` and its controls, state slices, derived state (`derive`),
  option listeners, `onDestroy` cleanups, `contextInternals`, and the validation link with its stand-in. The
  sibling spec `src/main/context.spec.ts`.
- Out: `form.create`, which calls the context (TK-012). Field members and `decorateField` (TK-013). The public
  `FormContext` and `StateSlice` types and their type tests (TK-013). The registration of the real
  validation api in the link (TK-020).

## Read first

- `01-public-api.md#2.3`: the `FormContext` row.
- `01-public-api.md#3.1`, "How a chain without `validation` works": the contract of the stand-in.
- `01-public-api.md#5`: the `createContext`, `contextInternals` and validation link rows.
- `01-public-api.md#9`: row G1, the cleanup contract.
- `02-structure.md#Source tree`: what `main/context.ts` holds, and the rules for internal channels.
- `03-testing.md#Context`: the scenario groups to test.
- Spike, read only: `explorations/extension-api/spike/src/context.ts` and `context.spec.ts`. The spike has no
  validation link. Write the code new.

## Decisions to apply

- D16: `onDestroy` keeps its name. A cleanup runs at each unmount and at `destroy()`, stays registered, and
  can run many times. Only the creator of an instance calls `destroy()`.
- D53: without `validation`, the link returns a stand-in with no check: every path is valid, nothing is
  validating, and a run resolves valid with no issues.

## Acceptance

- [ ] Each scenario group of `03#Context` has a passing test in `src/main/context.spec.ts`.
- [ ] A test shows that a cleanup runs at an unmount, stays registered, and runs again at `destroy()`.
- [ ] A test shows each answer of the stand-in: valid, not validating, and a run that resolves valid with no
      issues. A test shows that a registered api replaces the stand-in.
- [ ] No barrel exports `createContext`, `contextInternals` or the validation link.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results and any deviation from the plan here.

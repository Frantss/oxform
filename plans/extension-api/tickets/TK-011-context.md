---
id: TK-011
title: Context
phase: 2
work_package: P2-02
status: done
depends_on: [TK-010]
branch: codex/P2-02-context
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each scenario group of `03#Context` has a passing test in `src/main/context.spec.ts`.
- [x] A test shows that a cleanup runs at an unmount, stays registered, and runs again at `destroy()`.
- [x] A test shows each answer of the stand-in: valid, not validating, and a run that resolves valid with no
      issues. A test shows that a registered api replaces the stand-in.
- [x] No barrel exports `createContext`, `contextInternals` or the validation link.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `src/main/context.ts`: `createContext(options)` returns the controls `store`, `setOptions`, `bindInstance`,
  `extensionContext`, `unmount` and `destroy`. `extensionContext(extension, state)` gives the context of one
  extension: `store`, `options()`, `onOptions`, `onDestroy`, `instance()` and its own `state` slices.
  `contextInternals(context)` gives `derive`, `validation()` and `registerValidation(api)`.
- `addFields` and `decorateField` (spike) are left out: TK-013 adds field members. The context types
  (`ExtensionContext`, `StateSlice`, `ValidationLink`) are module types for TK-013 and TK-020. No barrel exports
  the module, and no built `.d.ts` names `createContext`, `contextInternals` or `registerValidation`.
- Validation link: `ValidationLink` holds the members that the six behaviors read in the spike (`run`, `onRun`,
  `issues`, `checks`, `validating`). The stand-in is one frozen object, because it holds no state.
- `instance()` throws `The instance is available after every extension api has run.` before `bindInstance`.
  The spike returned `undefined`. This follows the `FormContext` row of `01#2.3`.
- Scenario groups of `03#Context` in `src/main/context.spec.ts` (27 cases):
  - State slices: they start in the store, a value and an updater are written, each extension sees only its own
    keys, one store is shared, and a key that is declared twice throws and names both extensions.
  - Options and cleanups: a listener gets the new and the previous options, unsubscribes, and is dropped at
    `destroy()`. G1 and D16: a cleanup ran at two unmounts and at `destroy()` (3 calls), then was dropped.
  - Derived slices: the computed value is in the store, it is computed again after a change, the state keeps its
    reference on a second read and after two subscribe and unsubscribe cycles, and a subscriber gets the new
    value.
  - `contextInternals` refuses an object that `createContext` did not make.
  - Stand-in (D53): `issues()` and `issues(path)` are `{}` and `checks` is `[]` (every path is valid),
    `validating` is `false`, `run` resolves `[true, {}]`, and `onRun` never calls its listener. A registered
    api replaces the stand-in for every extension of the instance, and another instance keeps the stand-in.
- `test:coverage`: `7 files fully covered.`, `Statements : 100% ( 151/151 )`. `pnpm run build`,
  `pnpm run check:all` (with `check:types`) and `pnpm run test` pass.

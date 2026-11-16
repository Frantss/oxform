---
id: TK-012
title: Form builder
phase: 2
work_package: P2-03
status: todo
depends_on: [TK-011]
branch: codex/P2-03-form-builder
pr: null
started: null
completed: null
---

# TK-012: Form builder

## Outcome

A form can be defined, extended, configured and created. `create` refuses a chain with a missing need: it
throws, names the extension and the need, and returns no instance.

## Scope

- In: `src/main/form.ts` with `defineForm`, `.extend`, `.configure`, `.create` and `option`. These types in
  `src/main/types.ts`: `Form`, `AnyForm`, `Instance`, `BaseOptions`, `Self`, `OptionDescriptor`,
  `OptionDescriptors`, `OptionsFrom`, `OptionKind`, `ValuesOf`, `ApiOf`, `StateOf`, `OptionsOf` and
  `InstanceOf`. The duplicate rules, the id default and the needs check at `create`. The sibling spec and the
  type tests of these exports.
- Out: `defineExtension`, `on`, field members, `FieldsOf` and the extension-hook order row of `03#form.extend`
  (TK-013). `defineSlots`, `slots` and `PartsOf` (TK-014). Scopes (TK-016). `optionKindsOf`, the other
  adapter-facing functions and the row "How an adapter treats each kind" of `03#option` (TK-017).

## Read first

- `01-public-api.md#2.1`, `#2.2` and `#2.3`: the signatures and the contracts of `defineForm`, `form.extend`,
  `form.configure`, `form.create`, `option.*` and `Self`.
- `01-public-api.md#3.1`: the needs check at `create`.
- `02-structure.md#Source tree`: what `main/form.ts` and `main/types.ts` hold.
- `03-testing.md#defineForm and form.create`, `#form.extend`, `#form.configure` and `#option`: the scenario
  groups to test.
- Spike, read only: `explorations/extension-api/spike/src/form.ts` and `form.spec.ts`. Write the code new.

## Decisions to apply

- D14: export `OptionDescriptors` and `OptionsFrom`. Do not export `ResolveSelf` or `FormTypes`.
- D15: an instance that no adapter created gets the id `form-1`, `form-2`, ... from a module counter.
- D18: declare the preset overload of `.extend` first only if a type test shows a better error message.
  Otherwise keep the spike order. Record the result under Evidence.
- D51: every need is required. A missing need is a type error at `.extend` and a runtime error at `create`.
- D52: the runtime check runs at `create`, before the `api` of any extension runs. Duplicate api keys are
  checked at `create` too.

## Acceptance

- [ ] Each scenario group of `03#defineForm and form.create`, `#form.extend`, `#form.configure` and `#option`
      has a passing test in `src/main/form.spec.ts`, except the two rows that the Out list gives to TK-013 and
      TK-017. The rows that need an extension use a test-local definition object.
- [ ] A missing need throws at `create` and names the extension and the need.
- [ ] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [ ] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [ ] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

Record the command results, the D18 result and any deviation from the plan here.

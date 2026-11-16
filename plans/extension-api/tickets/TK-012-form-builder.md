---
id: TK-012
title: Form builder
phase: 2
work_package: P2-03
status: done
depends_on: [TK-011]
branch: codex/P2-03-form-builder
pr: null
started: 2026-11-16
completed: 2026-11-16
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

- [x] Each scenario group of `03#defineForm and form.create`, `#form.extend`, `#form.configure` and `#option`
      has a passing test in `src/main/form.spec.ts`, except the two rows that the Out list gives to TK-013 and
      TK-017. The rows that need an extension use a test-local definition object.
- [x] A missing need throws at `create` and names the extension and the need.
- [x] Each export of this ticket has a positive and a negative type case in `tests/types/`.
- [x] `vp run @oxform/core#test:coverage` passes at 100 per file.
- [x] `vp run @oxform/core#check:types` and `pnpm run check:all` pass.

## Evidence

- `pnpm run build`, `pnpm run check:all`, `pnpm run test`: pass.
- `pnpm run test:coverage`: 100% statements, branches, functions and lines per file (214 statements).
- `src/main/form.spec.ts`: 36 cases for the groups of `03#defineForm and form.create`, `#form.extend`,
  `#form.configure` and `#option`. The test-local extensions (`store`, `limited`, `needing`, ...) are written with
  `defineExtension`, which is the identity at runtime.
- D18 result: the spike order stays (extension overload first). With the preset overload first, a rejected
  extension reports `Type 'Extendable<{ a: string; }, {}, {}>' is not assignable to type 'Extendable<..., { values:
  ... }, {}>'`, which reads better than the preset message. But TypeScript then types the parameter of an inline
  extension from the first overload (`Form<...>`), so `form.extend(form => defineExtension(form, {...}))` fails
  with TS2769. Inline extensions are a documented pattern, so the better message is not worth it.
- Deviations:
  - `defineExtension` is typed here with `name`, `needs` (plain name lists), `options`, `state` and `api`, because
    `Form.extend` needs `Extension`. TK-013 adds the exact needs lists, `fields` and `on`.
  - `optionKindsOf` is in `main/form.ts` and tested here. TK-017 exports it from the adapter entry point.
  - `slotsOf` still lists the extension names, as the placeholder did. TK-014 replaces it.
  - `Instance` ignores `Values` and `Fields` until TK-013 adds the field members.
  - A failed `create` destroys the partial context, so the cleanups of earlier extensions run.

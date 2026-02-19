# RFC 0001: Field Plugin System via `FormOptions.with`

- Status: Draft
- Author: Codex
- Created: 2026-02-19
- Target packages: `oxform-core`, `oxform-react`

## Summary

Introduce a field plugin system in `oxform-core` that allows users to attach computed, typed metadata to `FieldApi` instances through a new `with` property in `FormOptions`.

Plugins contribute values to `field.extra`.

The system supports:

- Global plugins applied to all fields via `with['*']`
- Field-specific plugins applied to a single field path (e.g. `with.name`, `with['nested.value']`)
- Single-plugin or plugin-array syntax for every `with` entry

`field.extra` is recomputed on read and merged in deterministic order: global plugins first, then field-specific plugins. On key collision, later values win, so field-specific plugins can override global defaults.

## Motivation

Users need a way to derive field-level presentation and behavior data (e.g. `length`, `isStrong`, `uiHint`) directly from the live `FieldApi`, while keeping core field methods stable and type-safe.

Current APIs allow composition at call sites, but they do not provide a first-class, reusable, form-level mechanism to declare and infer extra field metadata.

## Goals

- Provide a declarative form-level extension point for field metadata.
- Preserve strong type inference for `field.extra` based on plugin outputs.
- Support defaults for all fields plus local overrides for specific fields.
- Keep behavior backward compatible for users not using `with`.
- Keep v1 scope limited to metadata extension only.

## Non-goals

- Allow plugins to override or patch `FieldApi` methods (`change`, `focus`, etc.).
- Introduce async plugin execution.
- Add runtime plugin lifecycle hooks.

## Proposed API

### User-facing example

```ts
import { createField, createForm } from 'oxform-core';
import z from 'zod';

const form = createForm({
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  defaultValues: {
    name: '',
    email: '',
  },
  with: {
    '*': field => ({
      dirty: field.options.form.status.dirty,
    }),
    name: [
      field => ({ length: field.state.value.length }),
      field => ({ startsWithA: field.state.value.startsWith('A') }),
    ],
    email: field => ({
      domain: field.state.value.includes('@') ? field.state.value.split('@')[1] : undefined,
    }),
  },
});

const nameField = createField({ form, name: 'name' });

nameField.extra.dirty; // boolean (global)
nameField.extra.length; // number (field-specific)
nameField.extra.startsWithA; // boolean (field-specific)
```

### Type shape

```ts
type FieldExtra = Record<string, unknown>;

type FieldPlugin<Value, Extra extends FieldExtra = FieldExtra> = (field: FieldApi<Value, any>) => Extra;

type FieldPluginsInput<Value> = FieldPlugin<Value> | FieldPlugin<Value>[];

type FormWithOptions<Values> = Partial<
  {
    '*': FieldPluginsInput<any>;
  } & {
    [Name in DeepKeys<Values>]: FieldPluginsInput<DeepValue<Values, Name>>;
  }
>;

type FormOptions<Values> = {
  schema: StandardSchema<Values>;
  defaultValues: NoInfer<Values>;
  validate?: { ... };
  related?: Record<DeepKeys<Values>, DeepKeys<Values>[]>;
  with?: FormWithOptions<Values>;
};
```

## Runtime semantics

### Plugin resolution

For a field named `N`:

1. Read plugins from `form.options.with?.['*']` (global).
2. Read plugins from `form.options.with?.[N]` (field-specific).
3. Normalize each entry to arrays:
   - Function -> `[fn]`
   - Array -> unchanged
   - Missing -> `[]`
4. Execute in order: global plugins, then field plugins.
5. Merge plugin return objects from left to right with object spread.

### Collision handling

- Later write wins.
- Because field plugins run after global plugins, field plugins override global values.

### Evaluation model

- `field.extra` is recomputed on each access.
- This ensures outputs derived from mutable field/form state are always current.

### Behavior with missing config

- If no plugins exist globally or for the field, `field.extra` returns `{}`.

## Type inference design

Inference requirements:

- `createForm({ with })` preserves literal plugin outputs.
- `createField({ form, name })` returns a `FieldApi<..., Extra>` where `Extra` merges:
  - outputs from `with['*']`
  - outputs from `with[name]`
- Every `with` property accepts single or array form with identical inferred behavior.

Implementation notes (type-level):

- Add helper types for:
  - `NormalizeToArray<T>`
  - `PluginOutput<TPlugin>`
  - `MergePluginOutputs<TPlugins>`
  - `FieldExtraFor<Form, Name>` (global + field merge)
- Thread generic parameters through `FormApi` and `FieldApi` to preserve `with` inference end-to-end.

## Detailed implementation plan

### 1) Core API types

Update `/Users/frantssbongiovanni/development/oxform/packages/core/src/types/api.ts`:

- Add:
  - `FieldExtra`
  - `FieldPlugin`
  - `FieldPluginsInput`
  - `FormWithOptions`
- Extend `FormOptions` with optional `with`.

### 2) Form and field generics

Update `/Users/frantssbongiovanni/development/oxform/packages/core/src/form/form-api.ts` and `/Users/frantssbongiovanni/development/oxform/packages/core/src/types/form.ts`:

- Preserve `with` typing on `FormApi` instances.
- Keep existing `FormValues`, `FormFields`, `FormFieldValue` behavior.

### 3) Field API runtime + typing

Update `/Users/frantssbongiovanni/development/oxform/packages/core/src/form/field-api.ts`:

- Add generic `Extra` parameter and `extra` getter.
- Add a small internal helper to normalize single-or-array plugin input.
- Resolve and merge plugin outputs according to runtime semantics above.

### 4) Field creation inference

Update `/Users/frantssbongiovanni/development/oxform/packages/core/src/form/create-field.ts`:

- Infer `extra` type from both global and field-specific plugins.
- Return `FieldApi<FormFieldValue<Form, Name>, InferredExtra<Form, Name>>`.

### 5) Form creation propagation

Update `/Users/frantssbongiovanni/development/oxform/packages/core/src/form/create-form.ts`:

- Preserve generics so `createForm` carries `with` literal types.

### 6) Exports

Update `/Users/frantssbongiovanni/development/oxform/packages/core/export/index.ts`:

- Export new plugin-related types.

### 7) React package compatibility

Confirm/update typing in:

- `/Users/frantssbongiovanni/development/oxform/packages/react/src/use-field-api.ts`
- `/Users/frantssbongiovanni/development/oxform/packages/react/src/use-field.ts`

No runtime changes expected; only type propagation.

## Testing strategy

### Core runtime tests

Update `/Users/frantssbongiovanni/development/oxform/packages/core/src/tests/field-api.spec.ts`:

- Global single plugin applies to all fields.
- Field single plugin applies only to target field.
- Mixed forms (single + array) normalize correctly.
- Collision precedence: field override beats global.
- Recompute-on-read reflects changes after `field.change(...)`.

### Core type tests

Update `/Users/frantssbongiovanni/development/oxform/packages/core/src/tests/create-form.spec.ts`:

- `expectTypeOf` for global-only keys on `extra`.
- `expectTypeOf` for field-only keys on matching field.
- `expectTypeOf` for mixed global+field merged keys.
- `expectTypeOf` for single plugin and array plugin forms.

### React type smoke

Update `/Users/frantssbongiovanni/development/oxform/packages/react/src/tests/use-field.spec.tsx`:

- `useField(...).extra` contains expected inferred keys.

## Backward compatibility

- `with` is optional.
- Existing forms without `with` are unchanged.
- Existing field APIs continue to work; `extra` is additive.

## Risks and tradeoffs

- Recompute-on-read may execute plugin functions frequently.
  - Accepted for v1 due to simplicity and correctness.
  - Future optimization can memoize if needed.
- Type-level merging can become complex with broad plugin return types.
  - If users return `Record<string, unknown>`, `extra` will naturally widen.

## Alternatives considered

- `withAll` key for globals: rejected in favor of single `with` surface with `'*'` sentinel.
- Global-precedence collision: rejected; field-specific should override defaults.
- Extra-only vs method patching: v1 is extra-only to keep runtime predictable.

## Acceptance criteria

- `FormOptions.with` supports global (`'*'`) and field path keys.
- Each `with` property accepts a single plugin or an array.
- `field.extra` merges global then field outputs with field override behavior.
- Types infer `extra` keys and value types for all supported forms.
- Existing tests pass; new runtime and type tests are added and passing.

## Open follow-ups (post-RFC)

- Optional memoized extra computation strategy.
- Optional plugin context object to avoid exposing full field instance.
- Dev-mode warnings for plugin key collisions (non-breaking).

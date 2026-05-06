# oxform-core

Framework-agnostic form engine that powers [`oxform-react`](../react). It
handles values, statuses, validation (Standard Schema), nested paths, and
array operations. Most users want the [React bindings](../react) instead;
reach for this package when integrating with another UI layer.

## Installation

```bash
npm install oxform-core
yarn add oxform-core
pnpm add oxform-core
bun add oxform-core
```

## Quick example

```ts
import { createForm, formOptions } from 'oxform-core';
import z from 'zod';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

const options = formOptions({
  schema,
  defaultValues: { name: '', email: '' },
  validate: { change: schema },
});

const form = createForm(options);
const unmount = form['~mount'](); // start subscriptions

form.field.change('name', 'Ada');
form.field.blur('email');

await form.submit(
  values => console.log('ok', values),
  issues => console.error('invalid', issues),
)();

unmount();
```

The [form core behaviors spec](../../docs/form-core-behaviors.md) is the
canonical reference for what each method does in every edge case.

---

## Factory functions

| Function           | Signature                                                                                                                   | Purpose                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `createForm`       | `<Values>(options: FormOptions<Values>) => FormApi<Values>`                                                                 | Build a `FormApi` instance.                                                              |
| `createField`      | `<Form, Name>(options: FieldOptions<Form, Name>) => FieldApi<FormFieldValue<Form, Name>>`                                   | Build a `FieldApi` bound to one path.                                                    |
| `createArrayField` | `<Form, Name>(options: ArrayFieldOptions<Form, Name>) => ArrayFieldApi<FormFieldValue<Form, Name> & ArrayLike>`             | Build an `ArrayFieldApi` bound to one array path.                                        |
| `createEffect`     | `<Api, Selected>(api: Api, selector: ApiSelector<Api, Selected>, fn: (state: Selected) => void \| Promise<void>) => Effect` | Run `fn` whenever the selected slice of `api.store` changes. Skips the first run.        |
| `formOptions`      | `<Values>(options: FormOptions<Values>) => FormOptions<Values>`                                                             | Identity helper — anchors `Values` inference when defining options outside `createForm`. |

---

## `FormApi<Values>`

The top-level form instance returned by `createForm`.

### Getters

| Getter     | Type                                                     | Description                                                  |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `id`       | `string`                                                 | Form identifier (from `options.id` or auto-generated).       |
| `options`  | `FormOptions<Values>`                                    | Current options object.                                      |
| `store`    | `Derived<FormStore<Values>>`                             | TanStack derived store.                                      |
| `status`   | `FormStatus`                                             | Current form status snapshot.                                |
| `values`   | `Values`                                                 | Current values snapshot.                                     |
| `validate` | `(fields?, options?) => Promise<[boolean, FormIssue[]]>` | Bound `FormCore.validate`. See [validate](#validate).        |
| `reset`    | `(options?: FormResetOptions<Values>) => void`           | Bound `FormCore.reset`. See [reset](#reset).                 |
| `field`    | `FormCoreField<Values>`                                  | Per-field operations — see [`form.field`](#formfield).       |
| `array`    | `FormCoreArray<Values>`                                  | Per-array-field operations — see [`form.array`](#formarray). |

### Methods

#### `submit(onSuccess, onError?)`

```ts
submit(
  onSuccess: FormSubmitSuccessHandler<Values>,
  onError?: FormSubmitErrorHandler<Values>,
): () => Promise<void>
```

Returns an async submit handler. When invoked it sets `status.submitting`
and `status.dirty` to `true`, runs `validate(undefined, { type: 'submit' })`,
calls `onSuccess(values, form)` if valid or `onError(issues, form)` if not,
increments `status.submits`, and finally clears `submitting` and writes
`status.successful = valid`.

#### `validate`

```ts
validate(
  fields?: DeepKeys<Values> | DeepKeys<Values>[],
  options?: ValidateOptions,
): Promise<[boolean, FormIssue[]]>
```

Validates with the schema selected by `options.type` (one of
`change` | `blur` | `focus` | `submit`) or the base `schema` when omitted.
With no `fields` it validates the whole form; otherwise it validates the
listed paths and their descendants and leaves other field errors untouched.
Sets `status.validating = true` for async validation. Returns
`[valid, issues]`.

#### `reset`

```ts
reset(options?: FormResetOptions<Values>): void
```

Resets values to `options.values ?? defaultValues`, rebuilds field state from
those values, and resets statuses. Use `options.keep` to preserve
`errors`, `refs`, or `fields` across the reset. See
[`FormResetOptions`](#formresetoptionsvalues).

### Internal / lifecycle

These methods are part of the public type surface but are intended for
integration code (e.g. React adapters), not application code.

| Method                                          | Purpose                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `'~mount'(): () => void`                        | Mounts the underlying derived store. Returns the unmount function.             |
| `'~update'(options: FormOptions<Values>): void` | Replaces the in-flight options object (e.g. updated schema or default values). |

---

## `form.field`

Methods on `FormApi.field` (`FormCoreField<Values>`). All `name` arguments are
type-safe deep paths into `Values` (e.g. `'profile.email'`,
`'items.0.title'`).

| Method                              | Signature                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `change(name, updater, options?)`   | `(name, value \| ((current) => value), options?: FieldChangeOptions) => void`                                       |
| `focus(name, options?)`             | `(name, options?: FieldFocusOptions) => void`                                                                       |
| `blur(name, options?)`              | `(name, options?: FieldBlurOptions) => void`                                                                        |
| `get(name)`                         | `(name) => DeepValue<Values, Name>`                                                                                 |
| `status(name)`                      | `(name) => FieldStatus`                                                                                             |
| `register(name)`                    | `(name) => (element: HTMLElement \| null) => void`                                                                  |
| `unregister(name)`                  | `(name) => void`                                                                                                    |
| `errors(name, options?)`            | `(name, options?: FormErrorsOptions) => FormIssue[]` — pass `{ nested: true }` to include descendants.              |
| `setErrors(name, errors, options?)` | `(name, errors, options?: FormSetErrorsOptions) => void` — `mode` is `'replace'` (default) / `'append'` / `'keep'`. |
| `reset(name, options?)`             | `(name, options?: FormResetFieldOptions<Value>) => void`                                                            |

Behavior summary (full spec in [form-core-behaviors.md](../../docs/form-core-behaviors.md)):

- `change` propagates `dirty` and `touched` to the target and its
  ascendants. `should.dirty` / `should.touch` opt out. Validates only when
  a `change` validator is configured (or `should.validate` is set).
- `focus` / `blur` set `touched` / `blurred` on target + ascendants and
  validate only when a matching event validator is configured.
- `errors({ nested: true })` aggregates errors across descendant paths.
- `reset` defaults the value to `options.value ?? defaultValue`, clears the
  field's `dirty/touched/blurred/errors`, and does not affect siblings.

---

## `form.array`

Methods on `FormApi.array` (`FormCoreArray<Values>`). `name` must point to an
array field. All mutations mark the array field `dirty/touched` by default
(opt out with `options.should`) and adjust per-item field entries so that
existing items keep stable IDs across moves.

| Method                                 | Signature                                                                     | Notes                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `append(name, value, options?)`        | `(name, value, options?: FieldChangeOptions) => void`                         | Push to end. Works on `undefined`.                                              |
| `prepend(name, value, options?)`       | `(name, value, options?: FieldChangeOptions) => void`                         | Insert at index `0`.                                                            |
| `insert(name, index, value, options?)` | `(name, index, value, options?: FieldChangeOptions) => void`                  | Negative index → `0`. Out-of-range pads with `undefined`.                       |
| `swap(name, from, to, options?)`       | `(name, from, to, options?: FieldChangeOptions) => void`                      | Negative indices → `0`. Same index is a no-op.                                  |
| `move(name, from, to, options?)`       | `(name, from, to, options?: FieldChangeOptions) => void`                      | Negative indices → `0`. Item identity follows the move.                         |
| `update(name, index, value, options?)` | `(name, index, value, options?: FieldChangeOptions) => void`                  | Index clamped to `[0, length-1]`.                                               |
| `remove(name, index, options?)`        | `(name, index, options?: FieldChangeOptions) => void`                         | Out-of-range → last valid index. Validation suppressed during the splice.       |
| `replace(name, value, options?)`       | `(name, value \| ((current) => value), options?: FieldChangeOptions) => void` | Replace the whole array. Rebuilds entries; trims trailing entries when shorter. |

The `value` argument accepts an `Updater` — either the next value or a
function `(current) => next`.

---

## `FieldApi<Value>`

Per-field handle returned by `createField`. All methods proxy into
`form.field` for the bound `name`. Useful when you need a long-lived field
reference (e.g. to subscribe to its `store`).

### Getters

| Getter    | Type                                              |
| --------- | ------------------------------------------------- |
| `id`      | `string`                                          |
| `options` | `FieldOptions<Form, Name>`                        |
| `store`   | `Derived<FieldStore<Value>>`                      |
| `state`   | `FieldStore<Value>` (current snapshot of `store`) |
| `value`   | `Value` (alias for `get()`)                       |

### Methods

| Method                        | Signature                                                               |
| ----------------------------- | ----------------------------------------------------------------------- |
| `change(updater, options?)`   | `(value \| ((current) => value), options?: FieldChangeOptions) => void` |
| `focus(options?)`             | `(options?: FieldFocusOptions) => void`                                 |
| `blur(options?)`              | `(options?: FieldBlurOptions) => void`                                  |
| `get()`                       | `() => Value`                                                           |
| `register(element)`           | `(element: HTMLElement \| null) => void`                                |
| `unregister()`                | `() => void`                                                            |
| `errors(options?)`            | `(options?: FormErrorsOptions) => FormIssue[]`                          |
| `setErrors(errors, options?)` | `(errors: FormIssue[], options?: FormSetErrorsOptions) => void`         |
| `reset(options?)`             | `(options?: FormResetFieldOptions<Value>) => void`                      |

### Internal / lifecycle

| Method                                               | Purpose                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `'~mount'(): () => void`                             | Mounts the derived field store. Returns the unmount function. |
| `'~update'(options: FieldOptions<Form, Name>): void` | Replaces `{ form, name }`.                                    |

---

## `ArrayFieldApi<Value extends ArrayLike>`

Per-array-field handle returned by `createArrayField`. Proxies into
`form.array` for the bound `name`.

### Getters

| Getter    | Type                                                                 |
| --------- | -------------------------------------------------------------------- |
| `options` | `ArrayFieldOptions<Form, Name>`                                      |
| `store`   | `Derived<FieldStore<Value>>`                                         |
| `state`   | `FieldStore<Value>`                                                  |
| `ids`     | `string[]` — stable IDs for each current item, useful as React keys. |

### Methods

| Method                           | Signature                                              |
| -------------------------------- | ------------------------------------------------------ |
| `append(value, options?)`        | `(value, options?: FieldChangeOptions) => void`        |
| `prepend(value, options?)`       | `(value, options?: FieldChangeOptions) => void`        |
| `insert(index, value, options?)` | `(index, value, options?: FieldChangeOptions) => void` |
| `swap(from, to, options?)`       | `(from, to, options?: FieldChangeOptions) => void`     |
| `move(from, to, options?)`       | `(from, to, options?: FieldChangeOptions) => void`     |
| `update(index, value, options?)` | `(index, value, options?: FieldChangeOptions) => void` |
| `remove(index, options?)`        | `(index, options?: FieldChangeOptions) => void`        |
| `replace(value, options?)`       | `(value, options?: FieldChangeOptions) => void`        |
| `get()`                          | `() => Value`                                          |

### Internal / lifecycle

| Method                     | Purpose                    |
| -------------------------- | -------------------------- |
| `'~mount'(): () => void`   | Mounts the derived store.  |
| `'~update'(options): void` | Replaces `{ form, name }`. |

---

## Options types

### `FormOptions<Values>`

| Field                 | Type                                                                             | Description                                                  |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `id?`                 | `string`                                                                         | Form identifier. Auto-generated when omitted.                |
| `schema`              | `StandardSchema<Values>`                                                         | Base schema used by `validate` when no `type` is provided.   |
| `defaultValues`       | `NoInfer<Values>`                                                                | Initial values. Type must match `Values`.                    |
| `defaultStatus?`      | `Partial<{ submits, submitting, validating, successful, dirty }>`                | Overrides for the initial form status.                       |
| `defaultFieldStatus?` | `Partial<Record<DeepKeys<Values> \| '*', Partial<{ blurred, touched, dirty }>>>` | Per-path initial field status. `'*'` applies to every field. |
| `validate?.change`    | `FormValidator<Values>`                                                          | Schema (or `(store) => schema`) used on `change` events.     |
| `validate?.submit`    | `FormValidator<Values>`                                                          | Schema used during `submit()`.                               |
| `validate?.blur`      | `FormValidator<Values>`                                                          | Schema used on `blur` events.                                |
| `validate?.focus`     | `FormValidator<Values>`                                                          | Schema used on `focus` events.                               |

`FormValidator<Values>` is `StandardSchema<PartialDeep<Values>>` or a function
that receives the current form store and returns one.

### `FieldOptions<Form, Name>`

```ts
{
  form: Form;
  name: Name;
}
```

`Form extends AnyFormApi`, `Name extends FormFields<Form>` (a deep key of
the form's values).

### `ArrayFieldOptions<Form, Name>`

```ts
{
  form: Form;
  name: Name;
}
```

Same shape as `FieldOptions`, but `Name` is constrained to
`FormArrayFields<Form>` (deep keys whose value is array-like).

---

## Store types

### `FormStore<Values>`

```ts
{
  values: Values;
  fields: InternalFields<FormIssue>;
  status: FormStatus;
}
```

Snapshot read from `form.store.state`. `fields` is the internal per-path
state map (used by adapters); prefer `form.field` / `FieldApi` for per-field
reads.

### `FieldStore<Value>`

```ts
{ value: Value; defaultValue: Value } & FieldState
```

Snapshot read from `field.store.state`.

### `ArrayFieldStore<Value extends ArrayLike>`

```ts
{
  value: Value;
  defaultValue: Value;
}
```

---

## Status & state types

### `FormStatus`

| Flag         | Type      | Meaning                                        |
| ------------ | --------- | ---------------------------------------------- |
| `submits`    | `number`  | Count of submission attempts.                  |
| `submitting` | `boolean` | Submission in progress.                        |
| `validating` | `boolean` | Async validation in progress.                  |
| `successful` | `boolean` | Last submission succeeded.                     |
| `dirty`      | `boolean` | Form (or any field) has changed from defaults. |
| `submitted`  | `boolean` | `submits > 0`.                                 |
| `valid`      | `boolean` | No field has errors.                           |
| `blurred`    | `boolean` | Some field has been blurred.                   |
| `touched`    | `boolean` | Some field has been touched.                   |
| `pristine`   | `boolean` | Inverse of `dirty`.                            |

### `FieldStatus`

| Flag       | Type      | Meaning                            |
| ---------- | --------- | ---------------------------------- |
| `blurred`  | `boolean` | Field has been blurred.            |
| `touched`  | `boolean` | Field has been focused or changed. |
| `dirty`    | `boolean` | Value differs from default.        |
| `default`  | `boolean` | Value deep-equals default.         |
| `valid`    | `boolean` | No errors on this field.           |
| `pristine` | `boolean` | Inverse of `dirty`.                |

### `FieldState`

```ts
{ id: string; status: FieldStatus; errors: FormIssue[]; ref: HTMLElement | null }
```

---

## Validation types

| Type              | Definition                                  | Notes                                           |
| ----------------- | ------------------------------------------- | ----------------------------------------------- |
| `ValidationType`  | `'change' \| 'submit' \| 'blur' \| 'focus'` | Picks which entry of `options.validate` to use. |
| `ValidateOptions` | `{ type?: ValidationType }`                 | Passed to `form.validate(...)`.                 |
| `FormIssue`       | `StandardSchema.Issue`                      | Re-exported from `@standard-schema/spec`.       |
| `StandardSchema`  | `StandardSchema.V1`                         | Re-exported alias.                              |

---

## Event option types

### `FieldChangeOptions`

```ts
{ should?: { validate?: boolean; dirty?: boolean; touch?: boolean } }
```

- `validate` — defaults to `true` when a `change` validator is configured.
- `dirty` — defaults to `true`. Set `false` to keep `dirty` flag unchanged.
- `touch` — defaults to `true`. Set `false` to keep `touched` flag unchanged.

### `FieldFocusOptions`

```ts
{ should?: { validate?: boolean } }
```

`validate` defaults to `true` when a `focus` validator is configured.

### `FieldBlurOptions`

```ts
{ should?: { validate?: boolean } }
```

`validate` defaults to `true` when a `blur` validator is configured.

---

## Reset option types

### `FormResetOptions<Values>`

```ts
{
  values?: Values;
  status?: Partial<PersistedFormStatus>;
  keep?: FormResetKeepOptions;
}
```

### `FormResetKeepOptions`

| Field     | Description                              |
| --------- | ---------------------------------------- |
| `errors?` | Keep current per-field errors.           |
| `refs?`   | Keep registered HTML element references. |
| `fields?` | Keep current field statuses.             |

### `FormResetFieldOptions<Value>`

```ts
{ value?: Value; status?: FieldResetStatus; keep?: FieldResetKeepOptions }
```

### `FieldResetStatus`

```ts
{ blurred?: boolean; touched?: boolean; dirty?: boolean }
```

### `FieldResetKeepOptions`

```ts
{ errors?: boolean; refs?: boolean; status?: boolean }
```

---

## Error handling types

| Type                               | Definition                                                              |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `FormErrorsOptions`                | `{ nested?: boolean }`                                                  |
| `FormSetErrorsOptions`             | `{ mode?: FieldSetErrorsMode }`                                         |
| `FieldSetErrorsMode`               | `'replace' \| 'append' \| 'keep'`                                       |
| `FormSubmitSuccessHandler<Values>` | `(values: Values, form: FormApi<Values>) => void \| Promise<void>`      |
| `FormSubmitErrorHandler<Values>`   | `(issues: FormIssue[], form: FormApi<Values>) => void \| Promise<void>` |

---

## Plugin types (advanced)

These types underpin a planned plugin system. They are exported but not yet
wired into `createForm`.

| Type                                           | Purpose                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `FieldPlugin<Value, Extra extends FieldExtra>` | A function that receives field data and returns properties to merge into the field API.     |
| `FieldExtra`                                   | `Record<string, unknown>` — shape returned by a plugin.                                     |
| `FieldPluginsInput<Value>`                     | Single plugin or array of plugins.                                                          |
| `FormWithOptions<Values>`                      | `{ '*'?: FieldPluginsInput; [Name]?: FieldPluginsInput<DeepValue> }` — per-path plugin map. |

---

## Type helpers

| Type                         | Purpose                                         |
| ---------------------------- | ----------------------------------------------- |
| `AnyFormApi`                 | `FormApi<any>` — untyped form slot in generics. |
| `AnyFormLikeApi`             | Object with a `store` property (form or field). |
| `FormLikeStore<State>`       | `Store<State> \| Derived<State>`.               |
| `ApiSelector<Api, Selected>` | `(state: Api['store']['state']) => Selected`.   |
| `FormValues<Form>`           | Extracts `Values` from `FormApi<Values>`.       |
| `FormFields<Form>`           | All deep keys of the form's values.             |
| `FormArrayFields<Form>`      | Subset of `FormFields` that resolve to arrays.  |
| `FormFieldValue<Form, Name>` | The value type at a given deep key.             |

## Misc

| Type        | Definition                                                                |
| ----------- | ------------------------------------------------------------------------- |
| `ArrayLike` | `any[] \| undefined \| null`                                              |
| `EventLike` | `{ target?: { value: any } }` — minimal DOM event shape used by adapters. |

## Deep type utilities

Re-exported from `#types/deep`. These are low-level building blocks for
typing custom adapters.

| Type                   | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `DeepKeys<T>`          | All valid string paths into a nested object/array.         |
| `DeepValue<T, Path>`   | The value type at a given deep path.                       |
| `DeepKeysOfType<T, V>` | Subset of `DeepKeys<T>` whose values match `V`.            |
| `ArrayDeepKeys<T>`     | Subset of `DeepKeys<T>` that resolve to array-like values. |
| `DeepRecord<T>`        | Record from each deep path to its value type.              |

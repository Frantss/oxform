# oxform-solid

Solid bindings for [Oxform](../../readme.md). Requires Solid `^1.9.0`.
Validation, issues, submission, reset, and array operations use
[`oxform-core`](../core/readme.md).

```bash
pnpm add oxform-solid solid-js
```

## Quick start

```tsx
import { createField, createForm } from 'oxform-solid';
import z from 'zod';

const schema = z.object({ email: z.string().email() });

export function Signup() {
  const form = createForm({
    schema,
    defaultValues: { email: '' },
    checks: { error: { validate: { change: schema } } },
  });
  const email = createField({ form, name: 'email' });

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        void form.submit(values => console.log(values))();
      }}
    >
      <label for='email'>Email</label>
      <input id='email' type='email' {...email.props} />
      <span>{email.state.issues.error.map(entry => entry.issue.message).join(', ')}</span>
      <button disabled={form.status.submitting}>Submit</button>
    </form>
  );
}
```

## Primitives

Call primitives inside a Solid component or `createRoot`. The owner releases
subscriptions and registered refs on disposal; values and issues remain in
the core form. Creation without an owner throws. Server rendering reads initial
state without creating subscriptions or running form effects.

| Primitive                                   | Result                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `createForm(options)`                       | Core form API with reactive `status` getters.                                       |
| `createField(options)`                      | Core field API with reactive `id`, `value`, `state`, and input `props`.             |
| `createFieldApi(options)`                   | Imperative field API with owned lifecycle and ref cleanup.                          |
| `createArrayField(options)`                 | Core array API with reactive `state` and `ids`.                                     |
| `createFormStatus({ form })`                | Reactive status getters, also for a core-created form.                              |
| `createSubscribe(api, selector)`            | An accessor for a selected store slice; compares with `Object.is`.                  |
| `createFormEffect(api, selector, callback)` | Runs on selected changes using core's deep comparison; skips the initial selection. |

Creation options accept an object, including getters, or an accessor returning
an options object. `createSubscribe` and `createFormEffect` also accept an
accessor returning an API. Form, field, array, state, status, input props, and
method identities remain stable across updates. Values infer from the schema;
field paths, array item values, and configured issue levels retain their types.

Read reactive properties in JSX or another tracking scope. Destructuring a
value such as `const { value } = field.state` captures a snapshot. The state and
status containers themselves stay stable and can be passed to child components.
`form.values`, `field.get()`, and method-returned issues are imperative snapshots.
Use a selector to observe form values:

```tsx
const email = createSubscribe(form, state => state.values.email);
return <output>{email()}</output>;
```

Reactive form options update configuration without resetting current values.
Changed defaults become the next reset baseline. A form's ID stays fixed and
its schema value type and inferred issue-level type stay fixed for its lifetime.
Field and array options can change form or name; subscriptions and retained
handlers follow the new binding. Owned refs move to the new path. Cleanup
clears a ref only if it still belongs to that binding.

`createFieldApi` supplies no reactive field state or input props; subscribe
explicitly when needed. `createFormEffect` delegates to core, does not await
async callbacks, and releases its subscription with the owner. Rebinding an
effect establishes a new baseline without invoking the callback.

## Input props

`field.props` contains `value`, `ref`, `onInput`, `onBlur`, and `onFocus`.
`onInput` reads `event.currentTarget.value` as text. Use it for text inputs,
textareas, and single-value selects. It invokes the core `change` event during
typing. Solid's `onChange` follows native change-event timing.

Use explicit handlers for numbers, checkboxes, files, and other coerced values.
Spread props directly in JSX; copying them with object spread outside JSX
captures the current value.

```tsx
const accepted = createField({ form, name: 'accepted' });
return (
  <input
    type='checkbox'
    checked={accepted.value}
    ref={accepted.register}
    onChange={event => accepted.change(event.currentTarget.checked)}
    onBlur={() => accepted.blur()}
    onFocus={() => accepted.focus()}
  />
);
```

## Components and arrays

`Field` and `ArrayField` take `form`, `name`, and a render function receiving
the same stable API their corresponding primitives return. Dynamic JSX props
are tracked without recreating the public API.

```tsx
import { ArrayField, Field } from 'oxform-solid';
import { For } from 'solid-js';

<ArrayField form={form} name='contacts'>
  {array => (
    <>
      <For each={array.ids}>
        {(_id, index) => (
          <Field form={form} name={`contacts.${index()}.email`}>
            {field => <input {...field.props} />}
          </Field>
        )}
      </For>
      <button type='button' onClick={() => array.append({ email: '' })}>
        Add contact
      </button>
    </>
  )}
</ArrayField>;
```

`array.ids` preserves item identity according to core's array operations.
Solid's `<For>` keys by item identity and supplies a reactive index accessor.
Derive paths from that accessor so retained rows write to their current index.
Primitives can use the same pattern with
`createField(() => ({ form, name: \`contacts.${index()}.email\` as const }))`.

`Subscribe` passes an **accessor** to its render function:

```tsx
<Subscribe api={form} selector={state => state.status.submitting}>
  {submitting => <button disabled={submitting()}>Submit</button>}
</Subscribe>
```

The package re-exports `formOptions` and the core public types exposed by
`oxform-react`. Solid return and prop types include `CreateFormReturn`,
`CreateFieldReturn`, `CreateArrayFieldReturn`, `FieldInputProps`, `FieldProps`,
`ArrayFieldProps`, `SubscribeProps`, and `MaybeAccessor`.

## Development example

The [Solid example](../../examples/solid/readme.md) covers validation, warnings,
arrays, checkboxes, subscriptions, effects, submission, and reset.

```bash
pnpm --dir examples/solid run dev
```

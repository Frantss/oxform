# Public API Behavior Reference and Reproduction Spec

This document describes caller-visible contracts of `oxform-core` and
`oxform-react`. The documentation site contains the usage reference, grouped
by form, field, array field, subscription, status, and effect.

## Form API

### Creation and Options

`createForm(options)` and `new FormApi(options)` create form state.
`useForm(options)` exposes the same operations in React and subscribes to form
status. `formOptions(options)` returns the input configuration with inferred
types and creates no state.

| Option               | Public behavior                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `schema`             | Required Standard Schema validator; determines the values type.                                   |
| `defaultValues`      | Required initial values and reset baseline, checked against schema-derived values.                |
| `id`                 | Optional identifier; generated if absent. Does not change after creation.                         |
| `defaultStatus`      | Optional initial and reset defaults for dirty and submit lifecycle status.                        |
| `defaultFieldStatus` | Optional dirty, touched, and blurred defaults by path; path overrides take precedence over `'*'`. |
| `checks`             | Issue-level configurations with blocking flags and event validators.                              |

Creation does not validate. Updated defaults affect subsequent resets and
default-value comparisons without replacing current values. Schema output
transformations do not replace values during validation.

```ts
import { createForm, formOptions } from 'oxform-core';
import { z } from 'zod';

const schema = z.object({ email: z.string(), tags: z.array(z.string()) });
const options = formOptions({ schema, defaultValues: { email: '', tags: ['alpha'] } });
const form = createForm(options);
```

### Properties

| Property  | Public behavior                                                  |
| --------- | ---------------------------------------------------------------- |
| `id`      | Form identifier.                                                 |
| `options` | Current configuration.                                           |
| `values`  | Current typed values snapshot.                                   |
| `status`  | Aggregate interaction, validation, and submission status.        |
| `store`   | Read-only observable state with values, field state, and status. |
| `field`   | Path-based field operations.                                     |
| `array`   | Path-based array mutations.                                      |

Reads alone do not subscribe React components to values. `useForm` subscribes
to status; `useSubscribe` selects values or other state.

### `validate(fields?, options?)`

Returns `Promise<[boolean, FormIssuesByLevel<Level>]>`. Its boolean describes
blocking issues emitted in this run, while `form.status.valid` includes all
current issues.

Targets may be omitted, a path, or a path array. A target includes its
descendants but excludes ancestors and siblings. Validators always receive
full values. An empty array targets nothing. Pathless issues apply only to
whole-form validation.

| Event selection     | Validators                                                                              |
| ------------------- | --------------------------------------------------------------------------------------- |
| No type             | Root schema and all configured events at all levels.                                    |
| Submit              | Explicit error submit validator, or root schema as fallback, plus custom submit checks. |
| Change, blur, focus | Matching configured validators only; no root schema fallback.                           |

An error validator replaces all existing error issues in scope, including
manual errors and errors from other events. Without an error validator, errors
are preserved. Custom-level issues are refreshed for the selected event, or
all four events in an untyped run; entries without a type are preserved.

Async pending validators set `validating`. An overlapping value change,
a newer run for the same target set and event, or form reset prevents stale
results from replacing issues. Discarded runs return true with empty buckets.
Unrelated value changes do not invalidate targeted runs. Validators may reject
the validation promise rather than produce issues.

```ts
const [valid, issues] = await form.validate('email', { type: 'blur' });
await form.validate(['email', 'tags']);
await form.validate();
```

See [Checks and Issues](./checks-and-issues.md) for the full validation contract.

### `submit(onSuccess, onError?)`

Returns `() => Promise<void>`. Calling it sets dirty and submitting, runs
whole-form submit validation, and awaits the selected callback. Success
requires both run validity and current aggregate validity.
`onSuccess(values, form)` receives current values; `onError(issues, form)`
receives all current issues.

After a normally resolved callback, submits increments, submitting clears, and
successful records the validation result. Validator or callback rejection
rejects the handler and may leave completion status unchanged. Browser default
submission and concurrent calls are not suppressed.

```ts
await form.submit(
  values => {
    console.info(values.email);
  },
  issues => {
    console.error(issues.error);
  },
)();
```

### `reset(options?)`

Restores configured defaults unless a full `values` object is supplied. It
resets field state, issues, refs, and submit status without validating.
Custom reset values do not change defaults. `status` overrides reset form
status. `keep.issues` retains all or selected levels, `keep.refs` retains refs,
and `keep.fields` preserves full field state and takes precedence over those
flags. Issue/ref preservation applies to retained paths.

```ts
form.reset();
form.reset({ keep: { refs: true, issues: ['error'] } });
form.reset({ values: { email: 'ada@example.com', tags: [] }, status: { submits: 0 } });
```

### Adapter Lifecycle

`'~mount'()` returns cleanup. `'~update'(options)` replaces current
configuration without resetting values. React calls these exposed lifecycle
members for its consumers.

## Field API

`createField({ form, name })`, `new FieldApi(options)`, `useFieldApi(options)`,
and `useField(options)` bind one schema-derived path. Prefer factories or
hooks for inference. `useField` subscribes to field state and adds `props`;
`useFieldApi` supplies imperative access without that subscription or props.

Properties are `options`, `id`, `value`, `store`, and `state`.
`state` contains `id`, `value`, `defaultValue`, `ref`, `status`, and
level-keyed `issues`. Store and state are properties, not callable methods.

| Bound method                  | Path-based equivalent                          | Public behavior                                                               |
| ----------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `get()`                       | `form.field.get(name)`                         | Reads the typed current value.                                                |
| `change(updater, options?)`   | `form.field.change(name, updater, options?)`   | Accepts value or updater; marks field and ancestors dirty/touched by default. |
| `focus(options?)`             | `form.field.focus(name, options?)`             | Focuses registered element and marks field/ancestors touched.                 |
| `blur(options?)`              | `form.field.blur(name, options?)`              | Blurs registered element and marks field/ancestors blurred.                   |
| `register(element)`           | `form.field.register(name)(element)`           | Stores element ref; null is a no-op.                                          |
| `unregister()`                | `form.field.unregister(name)`                  | Clears ref without changing the value.                                        |
| `issues(options?)`            | `form.field.issues(name, options?)`            | Reads path issues, or path and descendants with `nested: true`.               |
| `setIssues(issues, options?)` | `form.field.setIssues(name, issues, options?)` | Writes partial level buckets with replace, append, or keep mode.              |
| `reset(options?)`             | `form.field.reset(name, options?)`             | Resets value and descendant field state; keeps sibling values.                |

For status, bound APIs expose `state.status` while `form.field.status(name)`
returns a snapshot.

Change options `should.dirty: false` and `should.touch: false` preserve those
flags. Changing a parent does not mark descendant status. Field operations
request matching events only when configured, unless `should.validate`
overrides the default, and return void before async validation completes.

Issue replace mode replaces all buckets at the target, including omitted
levels. Append adds entries. Keep preserves all existing buckets if any issue
exists. Payload paths do not redirect manual writes.

Field reset uses the default or a non-nullish `value`, clears refs and issues,
and restores configured default status for the subtree. Its signature accepts
`status` and `keep`, but the current behavior ignores these options.
Bound fields expose `'~mount'` and `'~update'` with the same lifecycle contract.

```ts
import { createField } from 'oxform-core';

const email = createField({ form, name: 'email' });
email.change('ada@example.com');
email.change(current => current.trim(), { should: { validate: false } });
email.focus();
email.blur();
email.register(document.querySelector('input'));
email.unregister();
email.issues();
email.setIssues({ error: [{ level: 'error', issue: { message: 'Already registered' } }] });
email.reset();
```

### React Input Props and Component

`props.value` is the field value. `props.ref` registers an element.
`props.onChange` forwards `event.target?.value`; it does not read checked or
convert strings. `props.onFocus` and `props.onBlur` call their field operations.
Use explicit handlers for checkbox, number, and custom controls.

`Field` takes form, name, and static children or a render callback receiving
the full hook return value. It adds no DOM wrapper.

```tsx
import { Field, useForm } from 'oxform-react';

function EmailForm() {
  const form = useForm(options);
  return (
    <Field form={form} name='email'>
      {email => <input {...email.props} />}
    </Field>
  );
}
```

## Array Field API

`createArrayField({ form, name })`, `new ArrayFieldApi(options)`,
`useArrayField(options)`, and `ArrayField` bind an array path.
Properties are `options`, `store`, `state`, and item `ids`.
There is no props, value, or id shortcut. `get()` returns the array.
`'~mount'` and `'~update'` expose lifecycle integration.

Every mutation returns void. The same methods on `form.array` take the name
first. Normal options are `FieldChangeOptions`, with dirty/touch status and
change validation applying to the array and ancestors.

| Method                                    | Behavior                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `append(value, options?)`                 | Adds an item to the end; absent array starts empty.                                                 |
| `prepend(value, options?)`                | Adds an item at zero and shifts other items.                                                        |
| `insert(index, value, options?)`          | Inserts at a nonnegative index; negatives become zero; indices past length pad with undefined.      |
| `swap(from, to, options?)`                | Exchanges items and associated state; negatives become zero; same index is a no-op.                 |
| `move(from, to, options?)`                | Moves item/state and preserves intervening order; same index still applies change behavior.         |
| `update(index, valueOrUpdater, options?)` | Clamps index to valid range and replaces item; resets its field state.                              |
| `remove(index, options?)`                 | Clamps index and removes item; later item IDs follow shifted items; always skips validation.        |
| `replace(valueOrUpdater, options?)`       | Replaces array and resets array/descendant field state; shorter replacement removes trailing state. |

Use existing indices for swap and move; positive out-of-range indices are not
clamped. Update on an empty array selects zero. Insertion updater signatures
describe an item argument, but append/prepend/insert currently pass the whole
array at runtime. Update passes the current item; replace passes the full array.

```ts
import { createArrayField } from 'oxform-core';

const tags = createArrayField({ form, name: 'tags' });
tags.append('beta');
tags.prepend('first');
tags.insert(1, 'middle');
tags.swap(0, 1);
tags.move(0, 2);
tags.update(0, current => current.toUpperCase());
tags.remove(0);
tags.replace(current => current.filter(value => value !== ''));
tags.get();
tags.ids;
```

`ArrayField` accepts static children or a render callback receiving the array
hook return value and adds no DOM wrapper. Use item IDs for React keys and
`Field` for item inputs.

## Status

Form status includes dirty, pristine, touched, blurred, valid, validating,
submitting, submits, submitted, and successful. Field status includes dirty,
pristine, touched, blurred, valid, and default.

Field default means deep equality with the current default value; dirty
records interaction and is not cleared when a value returns to its default.
Field valid considers only issues at its path. Form valid includes all paths.
Form pristine reflects field interaction; submit can set form dirty while
pristine remains true.

`useFormStatus({ form })` returns a reactive full form status snapshot. Core
status reads alone are snapshots.

## Subscription and Effect

`useSubscribe(api, selector)` returns the selected value and subscribes React
to its changes. `Subscribe` takes api, selector, and static children or a
render callback. It adds no wrapper. Api may be a form, field, or array.

`createEffect(api, selector, callback)` invokes the callback on deeply unequal
selected changes, not the initial selection. It returns a subscription with
`unsubscribe()`. Callbacks may return promises and overlap.
`useFormEffect` returns void and cleans up on unmount or API changes. Keep its
selector and callback stable: changing only these arguments does not reliably
replace the current subscription.

```ts
import { createEffect } from 'oxform-core';

const subscription = createEffect(
  form,
  state => state.values.email,
  value => {
    console.info(value);
  },
);
subscription.unsubscribe();
```

## Reproduction Spec

### Problem Statement

Consumers need a public contract precise enough to recreate the current core
and React APIs without depending on their implementation. Signatures alone
cannot describe validation scope, status changes, issue preservation, or
React subscription behavior.

### Solution

Provide a compatible public surface with schema-derived values, paths, arrays,
and issue levels, preserving the observable behavior above. The reference
documents current limitations as well as normal usage.

### User Stories

1. As a consumer, I want schema-derived form values so invalid defaults and writes fail type checking.
2. As a consumer, I want typed nested field paths so controls select the correct value type.
3. As a consumer, I want typed array paths and items so list edits respect the schema.
4. As a consumer, I want issue levels inferred from checks so feedback retains its level-specific type.
5. As a consumer, I want initial values without automatic validation so validation timing remains explicit.
6. As a consumer, I want reusable form options so core and React share configuration.
7. As a consumer, I want field status independent of default-value equality so interaction remains observable.
8. As a consumer, I want event-specific checks so feedback appears at the intended time.
9. As a consumer, I want subtree validation so unrelated issues remain unchanged.
10. As a consumer, I want run validity distinct from aggregate validity so targeted results remain interpretable.
11. As a consumer, I want blocking and non-blocking levels so warnings do not prevent submission.
12. As a consumer, I want precise issue replacement rules so manual feedback behaves predictably.
13. As a consumer, I want stale async results discarded so outdated issues do not overwrite current state.
14. As a consumer, I want pending status across concurrent checks so progress remains visible.
15. As a consumer, I want submit callbacks to receive current values or issues so I can act on the result.
16. As a consumer, I want reset preservation flags so feedback and refs can survive a form reset.
17. As a consumer, I want item IDs to follow list items so React preserves the intended controls.
18. As a consumer, I want controlled input bindings and explicit custom handlers so different input types work.
19. As a consumer, I want selected subscriptions so components observe the state they display.
20. As an adapter author, I want lifecycle methods so bindings can update configuration and clean up.

### Implementation Decisions

These decisions concern public contracts only.

- Export the current core factories, classes, options helper, effect function, and public types.
- Export the current React hooks, render-prop components, return/prop types, and current core re-exports.
- Preserve constructors, properties, getters, methods, exposed lifecycle members, argument shapes, and return types.
- Infer values from Standard Schema input types and check defaults against those values.
- Preserve path-to-value inference, optional array item values, and checks-key issue-level inference.
- Preserve the current behavioral limitations identified in the reference instead of silently changing the API.
- For a declaration-only package, expose declared values and types without runtime bodies or JavaScript entrypoints.

### Acceptance Criteria

1. Form creation exposes every documented member, uses the supplied defaults, and does not invoke validators.
2. Field writes accept only the selected value type and update only the requested value path.
3. Dirty/touched/blurred propagation and explicit suppression match the field contracts.
4. All validation event combinations select exactly the documented error and custom validators.
5. Targeted validation receives full values, filters emitted issues, and leaves unrelated buckets unchanged.
6. Run validity and form validity differ when preserved blocking issues exist.
7. Error validation replaces manual and other-event errors; custom replacement follows event and type rules.
8. Empty validator results clear replaceable issues, while no-validator events preserve errors.
9. Manual replace, append, and keep modes match the whole-bucket semantics.
10. Error is always blocking; custom levels block only when configured.
11. Async overlap, reset, and same-scope supersession produce the documented discard result.
12. Concurrent pending checks and rejected validators produce the documented status and promise behavior.
13. Submit awaits one selected callback and updates completion status only on normal resolution.
14. Form reset preservation and current field reset limitations match the reference.
15. Every array operation preserves or resets item identities and state according to its contract.
16. React props use value events; static and function children are accepted without added wrappers.
17. React state subscriptions and effect callbacks match their selected value types and observed behavior.
18. A signatures package has no runtime implementation or emitted JavaScript.

### Testing Decisions

- Use the root package imports as the public test boundary.
- Use Vitest `expectTypeOf` assertions for every property and callable member, with schema-derived values and literal paths.
- Include negative type cases for incorrect values and paths, and positive cases for nested paths, optional arrays, and custom warning/risk levels.
- Cover constructors, lifecycle members, callback parameters, store state fields, issue entries, and React props/render callbacks.
- For a runtime reproduction, test values, issues, status, rendered controls, callbacks, and subscription cleanup; do not assert private state or helper calls.
- Cover event selection, replacement, manual issues, blocking, target scopes, stale async results, concurrency, reset, and rejection as distinct observable cases.
- Use current core validation/field/array tests and React hook tests as prior art. Declaration-only work requires type checks, not runtime behavior tests.

### Out of Scope

Private classes and helpers, data structures, validation scheduling algorithms,
store construction, generated identifiers' format, undocumented subpath
imports, plugin execution, behavior improvements, and package replacement.

### Further Notes

A broad issue-level type can widen to string; no inferred check keys yields
error alone. The inferred issue-level marker is a type-level contract and must
not be treated as a runtime value.

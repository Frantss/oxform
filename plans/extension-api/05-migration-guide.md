# Migration guide: draft

Status: complete, revision 4. This file agrees with [00-direction.md](./00-direction.md), revision 4. The
"after" side is `explorations/extension-api/`. Part A is for the plan's readers. Part B is the guide itself.

## Part A: about this guide

- **Published:** on the docs site and as raw Markdown. See [04-documentation.md](./04-documentation.md).
- **Scope:** an application on 0.x (`@oxform/core` 0.6.0, `@oxform/react` 0.6.0, `@oxform/solid` 0.2.0) that
  moves to `0.7.0`, on the `standard` preset.
- **Left out:** no codemod and no compatibility layer ship. A coding agent applies the guide. The guide does not
  teach how to write extensions, slots or scopes.
- **The example** is a simplified form in the team invites domain of the example catalogue
  ([04-documentation.md](./04-documentation.md), section 4.1), chosen, not copied from a spike sketch. It is
  representative because it has what real 0.x forms have, and each piece meets one dangerous change: submit validation through
  the root `schema`, a field error list, a server error after submit, a number input, and a status-driven button.
- **Verification tasks of P8-09.** The packages do not exist. P8-09 checks each fact below against the built
  packages before the guide is published, and removes each `†`. Rows marked `†` in Part B depend on them.
  1. Solid: not built. The guide assumes the `createParts` surface of `01-public-api.md`, section 6.3.
  2. The entry points `@oxform/core/behaviors` and `@oxform/core/presets`. The spike has a flat core and
     `@oxform/core/standard`.
  3. `createParts(form)` with no element map renders each part in the element its slot declares.
  4. The `useFormEffect` pattern and the empty path `''` for root issues (`01-public-api.md`, sections 7.4 and 7.7).
  5. A discarded validation run resolves `[true, issues]` with an empty list per check (`01-public-api.md`, G3,
     decided in D23). The spike resolves `[true, {}]`.
  6. `useField` re-renders on the value and status of its path only, not on check entries.
  7. The `field` part converts the value by the input `type`. An empty number input writes `undefined`.
  8. An instance from `form.create()` with no `id` takes one from a module counter, `form-1` (`01-public-api.md`,
     section 7.7, decided in D15). The spike gives `''`. A field id is `<form id>-<path>`.
  9. `field.setError(...)` entries go at the next change of the field. `form.error.set(...)` entries stay.
  10. `Root` prevents the default of the `submit` and `reset` DOM events and runs submit. The `Reset` part calls
      `reset.all()` on click (`01-public-api.md`, section 3.2).
  11. A non-exclusive check keeps the entries of an event that has no validator (`01-public-api.md`, section 8).

  The renames are approved (direction, owner decision 10). The guide uses the names of the plan: `useArray`
  where the spike has `useArrayField`.

## Part B: migrate from Oxform 0.x to 0.7.0 (the extension API)

For a coding agent. Follow the sections in order. Change no code before section 2 is complete. `†` = not yet verified on the built packages (P8-09 removes each mark).

### 1. Preconditions and packages

1. Start from a clean working tree where the type check and the tests pass.
2. The packages are ESM only. Convert each `require('@oxform/...')` consumer to ESM before you continue.
3. Replace the packages. Add `@oxform/core` to `dependencies`: it is now a peer dependency of each adapter.

   ```bash
   pnpm add @oxform/core@0.7.0 @oxform/react@0.7.0   # Solid: @oxform/solid@0.7.0 †
   ```

4. Import by category. An adapter no longer re-exports `formOptions` or core types.

| Import from              | What                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@oxform/core`           | `defineForm`, `createEffect`, `defineExtension`, `on`, `AnyForm`, `InstanceOf`, `ValuesOf`, `OptionsOf`, `StateOf`, `Path`, `PathValue` |
| `@oxform/core/behaviors` | `check` and the other built-in extensions, and types: `FieldHandle`, `ArrayHandle`, `FormStatus`, `CheckEntry`                          |
| `@oxform/core/presets`   | `standard`                                                                                                                              |
| `@oxform/react`          | `createParts`, `usePart`                                                                                                                |
| `@oxform/solid`, `/v2`   | `createParts`, `usePart` †                                                                                                              |

### 2. Detect 0.x usage

Run both searches from the application root and save the results as the inventory. Group the matches by form.

```bash
# A. Must return nothing after the migration.
grep -rnE "oxform-(core|react)|require\(.@oxform|formOptions\(|createForm\(|new (FormApi|FieldApi|ArrayFieldApi)\(|createField(Api)?\(|createArrayField\(|createFormStatus\(|createSubscribe\(|createFormEffect\(|useForm\(\{|useFieldApi\(|useArrayField\(|useFormStatus\(|useFormEffect\(|useSubscribe\(|<ArrayField|<Subscribe|form=\{|checks:|\.validate\(|\.submit\([^)]|\.field\.[a-zA-Z]+\(|\.array\.[a-zA-Z]+\(|[sS]etIssues\(|\.issues\b|\.issue\.|\.props\b|'~(mount|update)'|keep: \{ issues|state\.fields\b" src

# B. Inventory only. These names also exist in the new API with other signatures.
grep -rnE "from '@oxform/|useField\(|<Field|createEffect\(|\.reset\(|\.status\.|\.values\b|preventDefault\(\)" src
```

### 3. Mapping: old to new

Core (`@oxform/core` 0.x). `form` is the form, `instance` is one live form from `form.create()`.

| 0.x                                                                       | New                                                                                                                                           |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `formOptions(options)`                                                    | `defineForm({ schema, defaultValues }).extend(standard).configure(otherOptions)` at module level                                              |
| `createForm(options)`                                                     | The same chain, then `form.create(options?)`. With no adapter and no `id`, the id comes from a counter. †                                     |
| `FormApi`, `new FormApi(options)`, `AnyFormApi`                           | Removed. Types: `InstanceOf<typeof form>`, and `AnyForm` for any form.                                                                        |
| `createField(...)`, `FieldApi`, `createArrayField(...)`, `ArrayFieldApi`  | `instance.field(name)` (`FieldHandle`), `instance.array(name)` (`ArrayHandle`)                                                                |
| `createEffect(api, selector, fn)`                                         | `createEffect(instance, selector, fn)`. Only the instance has a `store`: select from its state.                                               |
| `FieldPlugin`, `FieldExtra`, `FieldPluginsInput`, `FormWithOptions`       | Removed (never wired in 0.x). Use `fields: on<T>(guard)(build)` in `defineExtension`.                                                         |
| options `schema`, `defaultValues`, `id`                                   | Arguments of `defineForm`. `schema` no longer validates (section 4).                                                                          |
| option `checks.error.validate`                                            | option `error` (`{ change, blur, focus, submit }`) in `.configure`                                                                            |
| option `checks.<level>` with `blocking`                                   | `.extend(check('<level>', { blocking }))` after `standard`, and the option `<level>`                                                          |
| options `defaultStatus`, `defaultFieldStatus`                             | Same, in `.configure`. `defaultStatus` accepts only `dirty`, `submits`, `successful`.                                                         |
| `form.values`, `form.field.get(name)`, `form.state`                       | `instance.values.get()`, `instance.values.get(name)`, `instance.store.state`                                                                  |
| `form.status`, `form.field.status(name)`                                  | `instance.status.form`, `instance.status.at(name)`                                                                                            |
| `form.validate(fields?, options?)`                                        | `instance.validation.run(fields?, options?)`                                                                                                  |
| `form.submit(onSuccess, onError)()`                                       | `instance.submit.run()`. Move the callbacks to the `onSubmit` and `onInvalid` options.                                                        |
| `form.reset(options?)`, `keep.issues`                                     | `instance.reset.all(options?)`, `keep.checks`                                                                                                 |
| `form.field.reset(name, { value })`                                       | `instance.reset.at(name, { value })`. The `status` and `keep` options are removed.                                                            |
| `form.field.change / focus / blur / register / unregister(name, ...)`     | `instance.field(name).change(...)` and so on, or `instance.events.change(name, ...)`                                                          |
| `form.field.issues(name, options?)`                                       | `instance.error.at(name, options?)` per check, or `instance.validation.issues(name)` for all                                                  |
| `form.field.setIssues(name, { error: [...] }, { mode })`                  | `instance.error.set(name, entries, { mode })`                                                                                                 |
| `form.array.append(name, ...)` and the other 7 operations                 | `instance.array(name).append(...)`, or `instance.arrays.append(name, ...)`                                                                    |
| `field.value`, `field.id`                                                 | `field.get()` or `field.state.value`, `field.state.id`                                                                                        |
| `field.issues()`, `field.state.issues.error`                              | `field.error()`. For a custom level: `instance.<level>.at(name)`.                                                                             |
| `field.setIssues({ error: [...] })`                                       | `field.setError(entries)` for a server error, else `instance.error.set(name, entries)` †                                                      |
| `field.store`, `field.options`, `array.store`, `array.state`              | Removed. Read `instance.store` with a selector, and the array with `array.get()`.                                                             |
| entry `{ type, level, issue: { message, path } }`                         | `CheckEntry`: `{ type, message, path }`. The check name is the key that holds the entry.                                                      |
| state `status.<flag>`, `fields[path].status`, `fields[path].issues.error` | `status.form.<flag>`, `status.fields[path]`, `error[path]`                                                                                    |
| `form.issues()`, `form.setIssues()`, `state.issues` (root)                | Read all entries: `instance.validation.issues()`. Root only: the empty path, `instance.error.at('')` and `instance.error.set('', entries)`. † |
| `form.options`                                                            | No replacement. See "Deviations and decisions".                                                                                               |

Types: `FormOptions` → `OptionsOf<typeof form>`, `FormStore` → `StateOf<typeof form>`, `FormValues` →
`ValuesOf<typeof form>`, `FormFields` → `Path`, `FormArrayFields` → `ArrayPath`, `FormFieldValue` and `DeepValue` →
`PathValue`, `DeepKeys` → `Path`, `ValidationType` → `ValidationEvent`, `FormIssueEntry` → `CheckEntry`,
`FormIssuesByLevel` → `IssuesByCheck`, `FormChecksMap` → `CheckValidators` per option, `FormResetOptions` →
`ResetOptions`, `FieldBlurOptions` → `FieldFocusOptions`. `FormStatus`, `FieldStatus`, `FieldState`,
`FieldChangeOptions` and `FieldFocusOptions` keep their names.

React (`@oxform/react` 0.x). The new parts and hooks come from `createParts(form)`, not from the package.

| 0.x                                | New                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `useForm(options)`                 | The module-level form, then `<Root>` with changing options as props. Inside it: `useForm()`.         |
| `useField({ form, name })`         | `useField(name)`. `field.props` is removed: `<Field name>` binds value, ref and events.              |
| `useFieldApi({ form, name })`      | `useForm().field(name)`                                                                              |
| `useArrayField({ form, name })`    | `useArray(name)`. Read items with `get()` and keys with `ids`.                                       |
| `useFormStatus({ form })`          | `useSelector(state => state.status.form)`                                                            |
| `useSubscribe(api, selector)`      | `useSelector(selector)` on the form state                                                            |
| `useFormEffect(api, selector, fn)` | Removed. Call `createEffect(useForm(), selector, fn)` in a `useEffect` and unsubscribe. †            |
| `<Field form name>{field => …}`    | `<Field name />` renders the `<input>`. Another element: `render={<select>…</select>}` or `usePart`. |
| `<ArrayField form name>`           | `useArray(name)` in a component                                                                      |
| `<Subscribe api selector>`         | `useSelector(selector)` in a component. For submit state: `<Submit>{state => …}</Submit>`.           |
| error markup from `state.issues`   | `<FieldError name />` shows the first message. All: `{({ messages }) => …}` as children.             |

Solid 0.x (`@oxform/solid`, `/v2`): `createForm`, `createField`, `createFieldApi`, `createArrayField`, `createFormStatus`,
`createSubscribe`, `createFormEffect`, `Field`, `ArrayField`, `Subscribe` → the same rows with `createParts` from the Solid entry. †

### 4. Behavior changes that compile but act differently

| Change                                                                                                                                                 | Detect                                                      | Do                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| The `schema` only types the values. Submit and `validation.run()` do not use it.                                                                       | A form with no `checks.error.validate.submit`               | Add `error: { submit: schema }`.                                                                  |
| The `checks` map is gone. An unknown `checks` option can pass when options are not a literal.                                                          | `checks:`                                                   | Move `checks.error.validate` to `error`. Add one `check(...)` and one option per other level.     |
| Submit callbacks are options. `<Root onSubmit>` is the option `(values, instance) => …`, not the DOM handler.                                          | `onSubmit={event`, `.submit(`                               | Pass `onSubmit` and `onInvalid` to `Root`, `create(options)` or `.configure`.                     |
| `Root` prevents the default of `submit` and `reset`. The `Reset` part restores the defaults. A hand-written `type='reset'` button does nothing. †      | `preventDefault()`, `type='reset'`, `action=`               | Delete the DOM handler. Use `<Reset>`. Do not depend on native submission.                        |
| `validation.run` resolves `[valid, issues]` by check name with flat entries. A discarded run resolves `[true, issues]` with an empty list per check. † | `.validate(`, `.issue.message`                              | Read `entry.message`.                                                                             |
| `'~mount'` and `'~update'` are removed. `Root` props are the options, and a change never resets values.                                                | `'~mount'`, `'~update'`                                     | Pass changing options as `Root` props.                                                            |
| The adapter supplies the form id. `form.create()` alone gives a counter id (`form-1`). Field ids are `<form id>-<path>`. †                             | `.id` used in `htmlFor`, tests or storage keys              | Pass `id` where it must be the same on the server and the client. Do not depend on the id format. |
| `useForm()` does not subscribe. `instance.status.form` is a snapshot.                                                                                  | `form.status.` in JSX                                       | Read with `useSelector(state => state.status.form)`, or use `<Submit>`.                           |
| `useField` does not re-render on check entries. †                                                                                                      | `field.issues()`, `state.issues` in JSX                     | Render `<FieldError name>` or `useSelector(state => state.error[path])`.                          |
| `<Field>` writes by input `type`: number, boolean, `File`, list. An empty number writes `undefined`. †                                                 | An `onChange` that coerces, `valueAsNumber`                 | Delete the coercing handler. Set `type` on `<Field>`.                                             |
| `field.setError` entries go at the next change of the field. `instance.error.set` entries stay until a run or `clear`. †                               | `setIssues(`                                                | Use `setError` for server errors and `error.set` for the 0.x lifetime.                            |
| `mode: 'replace'` replaces one check. In 0.x it replaced every level at the path.                                                                      | `setIssues(` with more than one level                       | Call `set` or `clear` on each check.                                                              |
| A non-exclusive check (a custom level) keeps the entries of an event that has no validator. In 0.x they were cleared. †                                | A custom level with validators for some events only         | Call `instance.<level>.clear(path)` where the 0.x code depended on the clearing.                  |
| A check added after `standard` has no handle sugar (`field.warning()`), and `<FieldError>` shows only `error`.                                         | `issues.warning`, other levels in JSX                       | Read `instance.<level>.at(path)` or `useSelector(state => state.<level>[path])`.                  |
| `status.form.successful` is `boolean \| null`.                                                                                                         | `successful` comparisons                                    | Handle `null` (no settled submit yet).                                                            |
| Hooks and parts work only inside `Root`. An instance is made per `Root`, not per module.                                                               | The form used outside `<form>`, a module-level `createForm` | Move the code inside `Root`. Create server instances per request.                                 |

### 5. Procedure

Migrate one form at a time. Keep the type check green between forms.

1. Complete sections 1 and 2. Pick the form with the fewest matches.
2. Write the form at module level: `defineForm({ schema, defaultValues }).extend(standard)`.
3. Add `.extend(check('<level>', { blocking }))` for each custom level. Then add one `.configure({ ... })` with the
   other options. Rename `checks.error.validate` to `error`, and add `submit: schema` if it has no `submit` validator.
4. Call `createParts(form)` at module level and take the parts and hooks the form uses.
5. Replace `<form onSubmit>` with `<Root onSubmit onInvalid>`. Delete `preventDefault()` and `form.submit(...)`.
   Replace each `<Field form name>{field => <input {...field.props} />}</Field>` with `<Field name />` and put the
   input's props on it. Replace error markup with `<FieldError name />`, the submit button with `<Submit>` and a
   reset button with `<Reset>`.
6. Apply section 3 to the remaining matches of the form, then section 4, row by row.
7. Run section 6 for this form. Commit. Take the next form.

Before (0.x). `invite` is application code.

```tsx
import { Field, useForm } from '@oxform/react';
import z from 'zod';

const schema = z.object({ email: z.string().email(), seats: z.number().min(1) });

export function TeamInvites() {
  const form = useForm({
    schema, // 0.x validates with it on submit
    defaultValues: { email: '', seats: 1 },
    checks: { error: { validate: { change: schema } } },
  });
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        return form.submit(async values => {
          const result = await invite(values);
          if (result.taken)
            form.field.setIssues('email', { error: [{ level: 'error', issue: { message: 'Already a member' } }] });
        })();
      }}
    >
      <Field form={form} name='email'>
        {field => (
          <>
            <input type='email' {...field.props} />
            {field.state.issues.error.map(entry => (
              <p key={entry.issue.message}>{entry.issue.message}</p>
            ))}
          </>
        )}
      </Field>
      <Field form={form} name='seats'>
        {field => (
          <input type='number' {...field.props} onChange={event => field.change(event.currentTarget.valueAsNumber)} />
        )}
      </Field>
      <button disabled={form.status.submitting}>Invite</button>
    </form>
  );
}
```

After:

```tsx
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { createParts } from '@oxform/react';
import z from 'zod';

const schema = z.object({ email: z.string().email(), seats: z.number().min(1) });

const teamInvites = defineForm({ schema, defaultValues: { email: '', seats: 1 } })
  .extend(standard)
  .configure({ error: { change: schema, submit: schema } });
const { Root, Field, FieldError, Submit } = createParts(teamInvites);

export function TeamInvites() {
  return (
    <Root
      onSubmit={async (values, form) => {
        const result = await invite(values);
        if (result.taken) form.field('email').setError([{ message: 'Already a member' }]);
      }}
    >
      <Field name='email' type='email' />
      <FieldError name='email'>
        {({ messages }) => messages.map(message => <span key={message}>{message}</span>)}
      </FieldError>
      <Field name='seats' type='number' />
      <Submit>Invite</Submit>
    </Root>
  );
}
```

### 6. Verify

1. The type check passes with no new `any`, `as` or `@ts-expect-error`.
2. The tests pass. Update tests that call 0.x APIs with the same mapping.
3. Search A from section 2 returns nothing. Each remaining match of search B uses a new signature.
4. In the browser, submit each form with invalid values: the errors show, `onInvalid` runs and `onSubmit` does
   not. Then submit valid values: `onSubmit` runs one time and the page does not reload. The console shows no
   error and, for a server-rendered page, no hydration warning.

Do not:

- write a compatibility shim or wrapper that restores a 0.x name;
- keep 0.x and `0.7.0` installed together, or keep two copies of `@oxform/core`;
- hand-edit generated types or declaration files to make the type check pass;
- migrate a row marked `†` in Solid code before P8-09 has verified it. For a 0.x feature with no replacement,
  apply "Deviations and decisions" below.

## Deviations and decisions

0.x functionality with no stated replacement in the extension API spike. Each item is decided. Item 1 is design
item 4 of the direction. Items 2 to 4 and 7 are design item 7, decided in `01-public-api.md`, sections 7.4 and
7.7. Items 5, 6 and 8 are decision D44 of `06-roadmap.md`.

1. **`useFormEffect` and Solid `createFormEffect`.** Decided (D31): no adapter export. The guide uses the
   pattern of `01-public-api.md`, section 7.4: `createEffect(useForm(), selector, fn)` in the framework's
   effect. P8-09 verifies it on the built packages.
2. **Root-only (pathless) issues.** `form.issues()`, `form.setIssues()` and `state.issues`. Decided (D22): the
   empty path `''` is the root in `at` and `set`. No part shows root issues: read `state.error['']` with
   `useSelector`.
3. **Options of a live instance without an adapter.** `form.options` and `'~update'` have no equivalent.
   Decided (D17): no instance member. Create the instance with its final options, or pass callbacks that read
   current data. `adapterControlsOf` in `@oxform/core/adapter` is for adapter authors.
4. **The id of an instance made without an adapter.** Decided (D15): a module counter. The spike gives `''`.
5. **The form outside `Root`.** `useForm(options)` gave the instance to the whole component, for example to a
   button outside `<form>`. The new hooks, and `usePart`, throw outside `Root`. Decided: the guide says "move
   the code inside `Root`". Where that is not possible, create the instance with `form.create(options)` and
   pass it as `<Root form={instance}>`. Then the options do not follow the props, and the id comes from
   `create`.
6. **Custom levels on the preset.** `.extend(check('warning'))` replaces `checks.warning`, but after `standard` it
   has no `field.warning()` sugar (the check must come before `handles`, which is inside the preset), and no part
   shows a level other than `error`. Decided: the guide maps it to `instance.warning.at(path)` and
   `useSelector(state => state.warning[path])`. A form that needs the sugar writes the nine extensions of
   `standard` with the check before `handles` (`01-public-api.md`, section 4).
7. **An "any instance" type.** Decided (D45): `AnyForm` types any form, and no alias types any instance. The
   guide gives the three patterns of `01-public-api.md`, section 7.7, in place of `{ form: AnyFormApi }`.
8. **Type helpers:** `AnyFormLikeApi`, `ApiSelector`, `InferFormIssueLevels`, `FormIssueLevels`, `EventLike`,
   `ArrayLike`, `DeepRecord`, `FormSubmitSuccessHandler`, `FormSubmitErrorHandler` and the `StandardSchema` alias.
   Decided: the guide lists them in one row as removed, with no replacement. Code that used them uses the
   read-back types (`ValuesOf`, `OptionsOf`, `StateOf`, `InstanceOf`) or the Standard Schema package.
9. **Solid.** The adapters are not built. Every Solid row is marked `†`, and P8-09 verifies it after P6-04.

No longer gaps under the new spike: custom levels (`check(name, options)`), an "any form" type (`AnyForm`),
`field.props` (`<Field>`, `render` and the built `usePart`), per-field stores (`instance.store` with a selector),
and the 0.x type helpers that `ValuesOf`, `OptionsOf`, `StateOf`, `InstanceOf`, `Path` and `PathValue` replace.

Differences from, and notes on, `00-direction.md`:

- The guide has two sections the direction does not list (detection, behavior changes). They were requested for
  this file and do not contradict the direction.
- The spike entry points are a flat `@oxform/core` and `@oxform/core/standard`. The guide uses the direction's
  `@oxform/core/behaviors` and `@oxform/core/presets`.
- `ValidationRunOptions` and `CheckSetMode` are `ValidateOptions` and `SetEntriesMode` in `spike/src/api.ts`.
  `01-public-api.md`, section 3.3, places them in `@oxform/core/behaviors`.
- The example simplifies the team invites domain of the catalogue: one invitee `email` at the root in place of
  `members[]`, and `seats`.
- `usePart` takes `ComponentPropsWithoutRef<Tag>`, so it cannot forward `render` or function children
  (`examples/readme.md`, finding 3). The guide prefers the `render` prop.

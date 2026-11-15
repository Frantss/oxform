# Extension API

Status: spike. The core (`defineForm`, `defineExtension`, `.extend`, `option`, `on`, context, `values`) is implemented
and type-tested in `spike/` and `type-tests/`. Kernel behaviors other than `values` are still being ported. See
[Implementation notes](#implementation-notes) for what is done, the porting recipe and where the real API differs from the
first sketch.

This document replaces the extension design in `proposal.md` ("Extensions") and `api.ts`
(`defineExtension`, `extendForm`, `FormKind`, `fieldExtras`).

## Goals

- One primitive for an extension. One object holds everything the extension adds.
- Types are inferred. No hand-written `FormKind`.
- Dependencies are explicit: an extension states what it needs, and the compiler checks it.
- The model follows UI SDK: a `define*` primitive with `name`, `options`, `state`, `api` and `slots`.
- The form is an ordered list of extensions. Order is visible and checked. The words "pipe" and "stage" are not used.

## Problems in the current design

| Problem                                                                             | Where                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------- |
| An extension declares types in `FormKind`, runtime kinds in `options`, and behavior | `defineExtension` in `spike/src/form.ts`    |
| in `api`. All three must agree by hand.                                             |                                             |
| `defineForm`, `extendForm`, `defineExtension` and `configureForm` overlap           | `spike/src/form.ts`                         |
| An api key returned by two extensions overwrites silently. A field extra throws.    | `extendForm`, `addMembers`                  |
| Field extras use a special wrap of `field` and `scope`. Slots cannot be wrapped.    | `extendHandles`, proposal "Extensions"      |
| Hook order follows nesting order and is not visible                                 | old design: `masks(autosave(standardForm))` |

## Concepts

| Concept                                 | Role                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `defineForm({ schema, defaultValues })` | Creates an empty form. Fixes `Values` from `schema`. Also takes `name`, `id`, `scopes`.          |
| `defineExtension(form, definition)`     | Defines one extension as one object. Infers its types.                                           |
| `form.extend(extension)`                | Applies an extension. Checks needs. Accumulates options, state, api, slots and fields.           |
| `form.configure(options)`               | Sets default options for every instance, typed by the extensions applied so far.                 |
| `form.create(options?)`                 | Creates an instance in any runtime. Later options win over earlier ones.                         |
| `defineScope(definition)`               | A sub-object with a schema, defaults and validators, and no path yet. See [Scopes](#scopes).     |
| `form.scope(path)` and `Scope<V>`       | The one view of an object path, placed by `scopes` or not. `Scope<V>` is the type of every view. |
| `Extendable<V, Needs, State>`           | Input type of an extension: the form so far, with `Values`, the api and state it needs.          |
| `Needs<V, Names>`                       | The kernel's api shapes by name, for example `Needs<V, 'values' \| 'validation'>`.               |
| `option.*`                              | Typed option descriptors. Each gives the runtime kind and the type.                              |
| `on<T>(guard)(build)`                   | Field members that exist only on fields whose value type extends `T`.                            |

The preset `standard` is a function from form to form (`form.extend(standard)`), built from the kernel's extensions with no
special access. See [Presets](#presets).

## `defineExtension`

```ts
defineExtension(form, {
  name, // string. Prefixes slot names in devtools and warnings.
  options, // record of option descriptors
  state, // options => initial state. The type is inferred from the value.
  api, // (ctx, deps) => additions to the form api
  slots, // slot => parts
  fields, // members for every field handle, built with on<T>(guard)(build)
});
```

| Field     | Rule                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `form`    | The first argument gives `Values` and the needs. It is the only place an extension names its dependencies.                            |
| `options` | Descriptors only: `option.action<T>()`, `option.number()`, `option.value<T>()`. `T` may use `V`.                                      |
| `state`   | Runs once per instance. Declares every state key the extension owns. The store starts from it.                                        |
| `api`     | Runs once per instance, on the server too. It must be inert: no DOM, no timers, no requests at creation. Start work in a handler.     |
| `ctx`     | `options()`, `onOptions`, `onDestroy`, `instance()`, `store`, and `state.<key>` with `get` and `set`. Typed by `options` and `state`. |
| `deps`    | The api of the form so far, typed as `Needs`. An extension does not read anything it did not state.                                   |
| `slots`   | Typed by the form api and state so far, plus this extension's own.                                                                    |
| `fields`  | Replaces `fieldExtras`. Applies to `form.field(path)` and to scoped handles, with the path relative to the scope.                     |

`ctx.slice` is removed. State is declared in `state` and written through `ctx.state.<key>.set`. `state` receives the
merged options, so `values` reads `defaultValues`. An option may take the instance as a parameter through the `Self` type:
`option.action<(draft: V, form: Self) => unknown>()`, and `create` resolves it. `Extendable<V, Provides, NeedState>` has a
third type for the state slices an extension needs, which `.extend` checks.

## Example: autosave

```ts
export const autosave = <V>(form: Extendable<V, Needs<V, 'values' | 'validation'>>) =>
  defineExtension(form, {
    name: 'autosave',

    options: {
      saveDraft: option.action<(draft: V) => unknown>(),
      autosaveDelay: option.number(),
    },

    state: () => ({ autosave: { saving: false, savedAt: null as Date | null } }),

    api: (ctx, { values, validation }) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      ctx.onDestroy(() => clearTimeout(timer));

      const flush = async () => {
        ctx.state.autosave.set({ saving: true, savedAt: null });
        await ctx.options().saveDraft?.(values.get());
        ctx.state.autosave.set({ saving: false, savedAt: new Date() });
      };

      values.onChange(() => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const [valid] = await validation.run();
          if (valid) await flush();
        }, ctx.options().autosaveDelay ?? 500);
      });

      return { autosave: { flush } };
    },

    slots: slot => ({ autosaveStatus: slot({ element: 'p', attrs: () => ({ role: 'status' }) }) }),
  });
```

## Example: field members

```ts
export const masks = <V>(form: Extendable<V, Needs<V, 'values' | 'field'>>) =>
  defineExtension(form, {
    name: 'masks',
    options: { masks: option.value<{ [P in Path<V>]?: string }>() },

    api: (ctx, { values }) => {
      values.intercept(change => {
        const mask = ctx.options().masks?.[change.path as Path<V>];
        if (mask !== undefined && typeof change.value === 'string')
          return { ...change, value: applyMask(mask, change.value) };
      });
      return {};
    },

    // Curried: the guard decides at runtime, because types are erased. `build` gets `(field, path)`.
    fields: on<string>((value): value is string => typeof value === 'string')(field => ({
      unmasked: () => digitsOf(field.get()),
    })),
  });
```

## Using extensions

```ts
export const profileForm = defineForm({
  name: 'profile',
  schema: z.object({ phone: z.string(), tags: z.array(z.string()) }),
  defaultValues: { phone: '', tags: [] },
})
  .extend(standard)
  .extend(autosave)
  .extend(masks);

// Defaults for every instance. They are typed like the options of `create`, by the extensions applied so far.
const configured = profileForm.configure({
  saveDraft: draft => save(draft), // draft: { phone: string; tags: string[] }
  masks: { phone: '(###) ###-####' },
});

const form = configured.create(); // `create(options)` overrides the configured options

form.autosave.flush();
form.store.state.autosave.savedAt;
form.field('phone').unmasked(); // string fields only
```

A lean form is the same chain with extensions left out. A form with no `validation` extension cannot apply `autosave`.

## Rules

1. `.extend` runs in call order. Hooks registered through `values.intercept`, `submit.intercept` and similar run in that order.
2. A missing need is a type error at `.extend`.
3. A duplicate option name throws at `.extend`. A duplicate api key or state key throws at `create`. The message names both
   extensions. Replacing a base member is not supported. Use a different name.
4. A form is immutable. `.extend` returns a new form, so a form is safe at module scope.
5. A slot with the key of an earlier slot replaces it. Wrapping a base slot means writing the replacement in the extension.
6. `api` stays inert at creation. A server render starts no timer and no request.
7. `.configure(options)` takes the options of the form so far, including those of its extensions. An option of an
   extension applied later is a type error until `configure` is called again after it. Successive calls merge, and a later
   call wins. The order of precedence is `create` over `configure` over `defineForm`. `configure` returns a new form.
8. A scope is the only term for a sub-object, and `form.scope(path)` is the only accessor. A scope adds no member to the
   instance. See [Scopes](#scopes).

## Scopes

A scope is a sub-object. `defineScope({ schema, defaultValues, checks })` describes one without a path: a schema that types
it, default values, and validators per check name. `defineForm({ ..., scopes: { billing: address, shipping: address } })`
gives it a path. `Values` becomes the form's own values plus `{ billing: Address; shipping: Address }`. `form.scope(path)` views
any object path, a placed scope, a plain nested object or an array item (`form.scope('members.0')`), and returns a
`Scope<V>`: the same recursive interface as the root handles (`field`, `array`, `scope`). A function written for
`Scope<Address, 'error'>` works at every path and in every form. See `examples/08-scopes.tsx`.

A placed scope's defaults go at its path. Its validators run at its path: they see the values there, and their issue paths
are prefixed with the path.

| #   | Conflict                                                         | Rule                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A scope key is a key of the form's own values                    | A type error (the key is `never`) and `create` throws, naming the scope.                                                                                                                 |
| 2   | Default values at a scope's path from several places             | Deep merge, lowest priority first: the scope definition, `defineForm`, `configure`, `create`. Plain objects merge key by key. Arrays and other values replace.                           |
| 3   | The form's validator and the scope's validator both cover a path | Both run, and their issues are merged. Nothing is deduplicated, so one field can report two issues.                                                                                      |
| 4   | A scope has validators for a check the form does not have        | `create` throws, naming the scope and the check. A form with no `validation` has no checks.                                                                                              |
| 5   | A scope key contains a dot                                       | A type error and `create` throws. A scope is one key. View a nested path with `form.scope('a.b')`.                                                                                       |
| 6   | The form's `schema`                                              | It only types `Values`. Nothing reads it at run time, and neither does a scope's `schema`. Validation comes from the checks: `error: { blur: schema }` on the form, `checks` on a scope. |

A partial default for a scope still needs a cast: the type of `defaultValues` is the full `Values`.

## Errors

```ts
defineForm({ schema, defaultValues }).extend(autosave); // type error: needs `values` and `validation`
profileForm.extend(masks); //                              throws at extend: option "masks" already declared
defineForm({ schema, defaultValues })
  .extend(values)
  .configure({ saveDraft: draft => save(draft) }); // type error: no `autosave` yet
form.field('tags').unmasked(); //                          type error: tags is not a string
defineForm({ schema, defaultValues, scopes: { email: address } }); // type error and create() throws: `email` is a key of the form's own values
defineForm({ schema, defaultValues, scopes: { 'a.b': address } }); // type error and create() throws: a scope key has no dot
form.scope('email'); //                                    type error: a string has no scope
```

## Internal API changes

| Change                                                                          | Replaces                                                    |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `defineExtension(form, definition)` with inferred types                         | `defineExtension`, `extendForm`, `FormKind`, `ExtendedKind` |
| `form.extend(extension)`, with a needs check and a duplicate check              | closure nesting and the silent api merge                    |
| `defineForm({ schema, defaultValues })` fixes `Values` first                    | `configureForm` as a separate step                          |
| `form.configure(options)`: typed default options, set after the extensions      | the options argument of `configureForm`                     |
| `state` factory and `ctx.state.<key>`                                           | `ctx.slice`                                                 |
| `option.*` descriptors                                                          | runtime kind strings such as `'action'`                     |
| `fields` in the definition. `createHandles` applies every extension's `fields`. | `fieldExtras`, `extendHandles`, `addMembers`                |
| `standard` is a preset: a function from form to form                            | `standardApi` and `defineForm<StandardKind>`                |

Scopes (formerly fragments), `createParts` and the kernel behaviors (`createValues`, `createValidation`, `createCheck`, and the rest) keep
their roles as plain functions of `(ctx, deps)`, wrapped by a thin extension each. `createHandles` calls
`contextInternals(ctx).decorateField(handle, path)` on every handle it builds.

## Verification

Checked with tsc 7.0.2 against the real types (`type-tests/extension-api.ts`, `type-tests/extension-parts.tsx`):

1. `form.extend(autosave)` infers `V` and checks `Needs` against the api so far. Done.
2. `ctx` inside `api` is typed by `options` and `state` of the same object. Done.
3. `on<string>(...)` makes `unmasked` exist only on string fields, on scoped handles too. Done.
4. A chain of nine extensions, and a preset that applies nine inside it: both check. Done.

The port order for the rest: `extension.spec.ts`, `extension-hooks.spec.ts`, `field-extras.spec.ts` (done with toy
extensions), then the specs of each kernel behavior, `slots.spec.ts`, `kit.spec.ts`, the other type tests, and
`measure-bundles.ts` for the bundle tiers.

## Open risks

- `on<T>` does not cover every per-path conditional that `MaskExtras` could express.
- A slot group's need for _state_ is not enforced by the types. Its need for api is. `SlotDefinition` declares `attrs`,
  `present` and `state` as methods, which TypeScript compares bivariantly. Making them function properties would enforce
  state needs and may break contextual typing of existing slot bodies. Not tried.
- `defineForm` with a schema means a preset cannot be configured later with another schema. Reuse is
  `defineForm(init).extend(standard)`.
- Error messages when `.extend` rejects an extension come from the last overload (`preset`), so they read as a preset
  mismatch. The failing line is still the right one.

## Implementation notes

Written at the end of phase 1 (core). Phase 2 ports the other behaviors with the recipe below.

### What exists

| File                               | Role                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `spike/src/api.ts`                 | Types only. The Kind layer is gone. New: `Form`, `Extendable`, `Needs`, `Extension`, `option`, `on`, `Self`.   |
| `spike/src/context.ts`             | `createContext(options)` returns controls. State slices, derived state, field members, option listeners.       |
| `spike/src/form.ts`                | `defineForm`, `defineExtension`, `option`, `on`, `defineSlots`, `slotsOf(form)`, `adapterControlsOf(instance)` |
| `spike/src/values.ts`, `change.ts` | `values` extension. `createValues(ctx, deps)` and `createChange()` stay as plain functions.                    |
| `spike/src/standard.ts`            | The preset. It chains only `values` for now.                                                                   |
| `spike/src/test-helpers.ts`        | `profileForm` (`standard` over `Profile`), `createProfileForm(options)`, schemas, `fakeElement`.               |
| `type-tests/extension-api.ts`      | Needs, inference, options, state, fields, `Self`, chains of nine, presets. All against the real types.         |
| `type-tests/extension-parts.tsx`   | Parts, `KeyProp`, `createParts`, hooks, `usePart`, slot groups.                                                |

Checks: `cd explorations/extension-api/spike && pnpm exec vp test run` and `../../../node_modules/.bin/tsc -p tsconfig.json`
(from `spike/`, or from `type-tests/` for the type tests). Phase 1 owns and passes: `api`, `context`, `form`, `values`,
`change`, `effect`, `paths`, `test-helpers`, `standard`, and the specs `form`, `context`, `values`, `change`, `extension`,
`extension-hooks`, `field-extras`, `effect`, `smoke` (79 tests), plus both type-test files above.

### Recipe: port a kernel behavior

A behavior stays a plain function `createX(ctx, deps)`, as in UI SDK, and gets a thin extension wrapper. See `values.ts`.

```ts
export const values = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'values',
    state: options => ({ values: options.defaultValues }),
    api: ctx => ({ values: createValues(ctx, { change: createChange<Values>() }) }),
  });
```

1. **Dependencies.** The wrapper's `form` parameter is `Extendable<V, Needs<V, 'values' | 'validation'>>`. `Needs` names
   the kernel apis in `KernelApis<V>` (`values`, `validation`, `error`, `status`, `events`, `arrays`, `reset`, `submit`,
   `field`, `array`, `scope`). A need that has no name there is written as an object type:
   `Extendable<V, Needs<V, 'values'> & { warning: CheckApi<V, 'warning'> }>`. `deps` is the api of the earlier
   extensions. Pass the members to `createX(ctx, { values, validation })`. An optional dependency in the old code
   (`validation?`) is a need on one of the two forms of the extension, or two wrappers. Decide per behavior and say so.
2. **State.** Every slice the behavior owned through `ctx.slice(name, initial)` becomes a key of `state: options => ({...})`.
   The factory gets the merged options, so `values` starts from `options.defaultValues`. Write it as
   `ctx.state.<key>.get()` and `.set(next | updater)`. A behavior function takes `FormContext<unknown, { values: Values }>`
   so a spec can call it with a hand-made context.
3. **Dynamic state keys.** A check named by an option is a factory: `check('warning')` returns the wrapper, and its
   `state` and `api` return `Record<Name, ...>` through a cast, as `named` does in `type-tests/extension-api.ts`. Use
   `<const Name extends string>`.
4. **Derived state** (the status). Declare the underlying slice in `state`. Then call
   `contextInternals(ctx).derive('status', compute)` inside `api`. The store then holds the computed value under that key.
5. **Options.** `options: { saveDraft: option.action<(draft: V) => unknown>() }`. The kind is for the adapter, the type is
   for `create` and `ctx.options()`. A callback that needs the instance types it with `Self`:
   `option.action<(values: V, form: Self, intent?: string) => unknown>()`, and calls `ctx.instance<Self>()`.
   `ctx.options()` always has `id`, `schema` and `defaultValues` too.
6. **Field members.** A behavior that builds field handles (`createHandles`) wraps each handle with
   `contextInternals(ctx).decorateField(handle, path)`, with the path relative to the scope. It returns
   `Scope<V, Checks>`. Reading the checks at runtime from `validation.checks` and stating them as a type argument is
   the open question for the `handles` wrapper: the type needs a check-name union, the runtime has the list.
7. **Slots.** `slots: slot => ({ ...fieldSlots(slot) })`. The slot factory is typed by `Provides & Api` and
   `NeedState & State`. A slot group from `defineSlots` states its needs. A `key` prop (`props: { name: 'key' }`) is
   typed as a path by the component.
8. **Duplicates.** Do not return an api key, state key or option that an earlier extension owns. The builder throws.
9. **Tests.** Build a form: `defineForm({ schema, defaultValues }).extend(values).extend(x).create(options)`. The old
   `createContext(options)` returned `[ctx, controls]`. It now returns `controls`, and
   `controls.extensionContext(name, state)` gives a context.

### Presets

Decision: a preset is a function from form to form, and `form.extend(preset)` applies it. `Form.extend` has two overloads:
an extension (a function of `Extendable` that returns `defineExtension(...)`), and a preset (a function of `Form` that
returns a form). At runtime `extend` calls the function. If the result has `extend`, it is a form and is returned. Else it
is a definition and is appended.

Why: each kernel behavior stays an extension of its own, so a lean form is `.extend(values).extend(validation)`. The
preset repeats no option, state or slot declaration, which a single composing extension would have to. The type test
applies nine extensions inside one generic preset, on a form that already has extensions, and checks the result. A
preset is also what a user writes for their own house style.

Rejected: one composing extension (declarations repeat); a variadic `.extend(a, b, c)` (TypeScript cannot map a tuple of
generic functions to their accumulated types).

`standard` is `<Values, Api extends {}, Options, State extends {}, Slots, Fields>(form: Form<...>) => form.extend(values)...`.
The `extends {}` bounds are required: an unconstrained type parameter does not satisfy `Extendable<V, {}>`.

### Form-level default options

Decision (the user's): defaults live on the form, typed. `form.configure(options)` takes `Partial<ResolveSelf<BaseOptions<Values> & Options, Instance>>`,
the same type as `create`, so `Self` resolves to the instance and `saveDraft` receives `Values`. It returns a new form of
the same type, so it is immutable and safe at module scope.

- **Order matters for types.** The options of an extension applied after `configure` are typed for `create` only. Call
  `configure` again after it. A single call after the last `.extend` types everything.
- **Merge.** `{ ...defineForm options, ...configure defaults, ...create options }`. Successive `configure` calls merge, and
  a later call wins. The same merge runs in `adapterControls.setOptions`, then scopes are placed into the result. `.extend`
  and a preset carry the defaults forward.
- **Not on `defineForm`.** The init cannot know the options of extensions applied later, so a typed `options` key there
  would be loose. `.configure` is the only place.
- **Not checked at runtime.** An unknown option is a type error, not a thrown error, as for `create`.

### Deviations from the sketch above

- `Extendable` takes a third parameter, `State`, so a slot group can need state and the form is checked for it at `.extend`.
- `on<T>(guard?)(build)`: curried, and `build(field, path)` gets the path relative to the scope. Types are erased, so the
  guard decides at runtime. An extension that adds fields to a form with no `field` api throws at `create`.
- `FormContext<Options, State>` keeps its old name. It has `state` and `store`, and no `slice`. Its `store` is typed by the
  extension's own state. A behavior that reads another slice takes the behavior's api as a dependency.
- `option.action<(form: Self) => ...>` and `ResolveSelf`: an option may take the instance as a parameter, and `create`
  resolves it. Not in the sketch. `onSubmit(values, form)` needs it.
- `FormKind`-typed parts are now inferred from `slots`. A slot's `key` prop is typed `KeyProp` in the part's props, and the
  component resolves it with `ResolveKeys<Props, Values>`, so a scope re-types the names. `PartsOf<F>`, `ValuesOf<F>`,
  `StateOf<F>`, `OptionsOf<F>`, `InstanceOf<F>`, `FieldsOf<F>` and `ApiOf<F>` read the types back from a form for adapters.
- `Scope<Values, Checks, Fields>`: the one view type, formerly `HandlesApi` with the alias `ScopedHandles`. The third parameter was `Kind`. A phantom `[handlesChecks]` lets `Instance` read the
  check names from an api that has handles (`ChecksOfApi`).
- `createParts(form, elements)` and `usePart(form, slot, ...)` take the form. They no longer take a `ConfiguredForm`.
- `defineForm` also takes `name`, `id` and `scopes`. A scope definition carries its own hooks under `Symbol.for('oxform.scope.mount')`
  (called whenever options merge) and `Symbol.for('oxform.scope.verify')` (called once in `create`, with the instance), so
  `form.ts` never imports `scopes.ts` and a form without scopes pays nothing. See [Scopes](#scopes).
- `form.optionKinds` replaces `definition.options` for adapters. `slotsOf(form)` replaces `slotsOf(definition)`.
- `createChange()` takes no context. `createValues` reads `ctx.state.values`.
- The `create*` and `standardForm` `declare`s are removed from `api.ts`. The implementation files are the surface now.

### Slot-only extensions

An extension that only adds slots uses `slots(build)` and declares nothing:

```ts
form.extend(slots(slot => ({ ...fieldSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot) })));
```

- **Typing.** `slots` is `(build) => (form: Extendable<V, Provides, NeedState>) => Extension<{}, {}, {}, Slots, never>`. A
  generic call takes its type arguments from the contextual type, so inside `.extend(...)` the `Provides` and `NeedState`
  are the api and state that the form has accumulated. `slot` is `SlotFactory<Provides, NeedState>`, so an inline slot reads
  typed state (`state.shown`) and a group is checked against it.
- **Needs are enforced at the group call.** A group is `defineSlots((slot: SlotFactory<GroupApi, GroupState>) => ...)`.
  Spreading it with a factory that lacks its api or its state is a compile error on that call. State was not enforced
  before: `SlotDefinition` declared `attrs`, `state`, `present`, `text` and `bind` as methods, and TypeScript compares
  method parameters bivariantly. They are now `readonly` function properties, so the parameters are checked strictly.
  `type-tests/part-scope.tsx` has the `@ts-expect-error` cases: a missing api need, a missing state need, both missing,
  an inline slot that reads absent state, and the groups inside `defineExtension` with a hand-written `Extendable`.
- **`defineExtension(form, ...)` stays** for an extension that adds api, options, state or field members. A hand-written
  `Extendable<V, Needs, State>` is needed there, because those types are inputs of `api` and `state`.
- **Runtime.** `slots(build)` is `defineExtension(form, { name: 'slots', api: () => ({}), slots: build })`. Slots from
  several `.extend` calls merge in order, and a later key replaces an earlier one, as `slotsOf` did for any extension.
- **Limit.** `slots(...)` has no form to read until it is inside `.extend(...)`. A reusable slot-only piece is a `defineSlots`
  group (it states its needs), applied with `slots(slot => ({ ...group(slot) }))`. Calling `slots(...)` on its own gives
  `slot` the type `SlotFactory<unknown, unknown>`, so a group that needs anything fails to compile.

### Handles and check names

Decision: the check names are read from the api in the types, and from `validation.checks` at runtime. Nothing is written by hand.

- **Types.** `handles` is `<Values, Provides extends HandlesNeeds<Values>>(form: Extendable<Values, Provides>)`. It keeps the
  whole api so far as `Provides`, so `.extend(handles)` infers it from the form. The api it returns is
  `Scope<Values, CheckNamesOf<Provides>>`. `CheckNamesOf<Api>` is the keys that hold a `CheckApi` under their own name,
  so a check extension returns `Record<Name, CheckApi<Values, Name>>` (as `check('warning')` does) and its name appears on
  every field handle as `warning()` and `setWarning(...)`.
- **Runtime.** `Object.fromEntries(validation.checks.map(check => [check.name, check]))`, read once when `handles` runs.
- **Order.** The sugar covers the checks that are in the chain before `handles`. A check extended after it has no sugar, in
  the types and at runtime. `standard` puts `handles` last.
- **No validation.** A lean form without `validation` has no sugar, and `field('name').error` is a type error.
  `validation` is an optional need (`{ readonly validation?: ValidationApi<Values> }`).
- **Fields.** Each handle is wrapped with `contextInternals(ctx).decorateField(handle, path)`, with the path relative to the
  scope, so `scope(...).field(...)` and `form.field(...)` get the members of every extension's `fields`.
- Rejected: `handles('error', 'warning')` (names written by hand, so they can drift from the registered checks); reading the
  checks lazily in `field(path)` (the runtime would then offer sugar that the types do not have).
- The type test is `type-tests/kernel-extensions.ts` (tsc 7.0.2): sugar for `error` and `warning` when they are in the chain,
  none without validation, none for a check extended after `handles`, and a type error for each missing need.

### Status, events, reset and arrays (track C)

- Each is a wrapper over its `createX(ctx, deps)`. Wrappers: `status`, `events`, `reset`, `arrays`, `handles`. The chain order is
  `values`, `validation`, `check(...)`, `status`, `events`, `arrays`, `reset`, `submit`, `handles`. `reset` needs `events` to clear
  refs, so `events` goes first.
- **Optional dependencies.** `validation` (and `events` for `reset`) is an optional member of the need:
  `Extendable<V, Needs<V, 'values'> & { readonly validation?: ValidationApi<V> }>`. A form without it still applies the
  extension, and a form with it passes the type. The extension must come after `validation` to use it. This avoids two wrappers.
- **Status state.** `state` declares the raw slice under `status`, and `derive('status', compute)` makes the store hold the
  derived `StatusState` under the same key. The factory is typed as the public `StatusState` (what `store.state.status` and
  slots read), so the wrapper casts `ctx` to the behavior's raw slice type once. The behavior reads the derived value from
  `ctx.store` through one cast.
- **Options moved.** `status` owns `defaultStatus` and `defaultFieldStatus` (`option.value`).
- **Internals stay WeakMaps** keyed by the api object (`statusInternals`, `eventsInternals`, `arraysInternals`). The api
  object that `extend` hands on is the same reference, so they still work. Not a public surface.
- **Form-level options.** Resolved by `form.configure(options)` (see "Form-level default options"). The `adapter-controls`
  spec asserts again that a configured `onSubmit` survives `setOptions({})`.

## Bundle sizes

Measured with `cd spike && pnpm exec vp pack && node measure-bundles.ts`: minified and gzipped, dependencies bundled, one
build per tier. Each tier is now a real form built with `defineForm(...).extend(...)` and exported, so it includes the
builder runtime and the extension wrappers. The old spike's tiers re-exported behaviors without a form, so the old numbers
are a lower bound and the comparison below is not like for like.

| Tier                                                                 | Minified | Gzip    | Budget (gzip) | Old spike (gzip) |
| -------------------------------------------------------------------- | -------- | ------- | ------------- | ---------------- |
| Values only                                                          | 9.00 kB  | 3.54 kB | 3.80 kB       | 2.33 kB          |
| Values, status, events                                               | 13.05 kB | 4.99 kB | 5.40 kB       | 3.73 kB          |
| Values, validation, one check                                        | 12.43 kB | 4.80 kB | 5.15 kB       | 4.10 kB          |
| Same, plus a placed scope                                            | 14.23 kB | 5.38 kB | 5.50 kB       | 4.39 kB          |
| Lean login (values, validation, check, status, events, submit)       | 17.61 kB | 6.43 kB | 6.95 kB       | 5.39 kB          |
| Full `standard` preset, with its slots                               | 24.21 kB | 8.59 kB | 9.25 kB       | 7.08 kB          |
| Today's `@oxform/core`                                               | 24.83 kB | 8.09 kB | reported only | 8.09 kB          |
| Diagnostic: builder only, no extension                               | 7.93 kB  | 3.12 kB | none          |                  |
| Diagnostic: `createContext`, `createChange`, `createValues`, no form | 6.96 kB  | 2.80 kB | none          | 2.33 kB          |

Budgets are the measured gzip size plus about 8%, rounded up to 50 bytes, as in the old spike. They were raised from the old
values (2.50, 4.05, 4.40, 4.70, 5.85 and 7.70 kB) because the tiers changed shape, not to hide a regression: see below.

### Findings

- **Tree-shaking works through `.extend` chains.** The built output of each tier has only the extensions in its chain.
  `tier-lean-login` has no `arrays`, `reset` or `handles` extension, no `oxform.scope.prefix` and no `aria-invalid`
  (the field slots). `tier-status-events` has no `validation`. Only `tier-full-preset` has the slots, the scope prefix and
  all nine extensions. The method chain does not pull in extensions that the entry does not import, because each is a plain
  value imported by the module that applies it.
- **The new design is bigger than the old spike.** The lean login form grew 1.0 kB gzip (6.40 kB, still 21% smaller than
  today's core). The full preset grew 1.5 kB gzip and is now 6% larger than today's core (8.56 kB against 8.09 kB), where the
  old spike was 12% smaller.
- **Where the growth is, for the values-only tier (+1.17 kB gzip over the old 2.33 kB):**
  - `defineForm`, `.extend`, `.create`, the duplicate checks and the adapter controls: about 0.30 kB (3.09 kB builder-only
    against 2.80 kB for the three behaviors alone).
  - The `values` extension wrapper, with its `Needs` and option descriptors: about 0.41 kB.
  - The context itself (state factory, field members, option merge), which grew since the old spike: about 0.47 kB
    (2.80 kB against 2.33 kB).
- **Cost per extension.** Adding an extension costs about the same as it did before plus a wrapper: status and events add
  1.46 kB over values (old: 1.40 kB), a placed scope adds 0.58 kB (old: 0.29 kB, see the next point), and the slots, arrays, reset and
  handles add 2.16 kB over the lean login form (old: 1.69 kB).
- **Scope rules.** The conflict rules (deep default merge, own-key and dotted-key checks, the unknown-check check) cost the
  scopes tier 0.33 kB gzip (5.05 kB to 5.38 kB), only in forms that use `scopes`: the hooks live in `scopes.ts`. A form without
  scopes grew 0.03 kB gzip in every tier (the loops and hook keys in `create` and `merge` in `form.ts`).
- **`@tanstack/store`** is still about 1.7 kB gzip of every tier, so about half of the values-only and builder-only tiers.
- **Not measured:** the React adapter, and the old spike's path helpers against today's `remeda` use (the same limits as
  before).

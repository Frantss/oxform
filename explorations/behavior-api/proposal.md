# Proposal: compose Oxform from behaviors

Status: draft for review. No runtime code is implemented. The numbered files in
this folder are uncompiled sketches of the proposed API. `api.ts` holds its
public types. `type-tests/` checks those types with `tsc`.

## Principles

Every design decision in this proposal is checked against these five principles.

1. **Composability.** A form is built from several pieces. The pieces can be
   assembled as needed to serve each use case.
2. **Reusability.** Each piece of a form can be extracted, packaged and reused in
   similar use cases.
3. **Extensibility.** Users can extend a form's behavior without changes to the
   engine.
4. **Strongly typed.** Every built-in and extended feature correctly affects the
   form's types.
5. **Lightweight.** The core is slim. Most built-in features are opt-in, so
   tree-shaking removes the features a user does not use and the bundle shrinks.

### Acceptance checklist

A criterion is met when its evidence exists and passes. "Type test" means a file
in `type-tests/`, checked with `tsc` (TypeScript 7.0.2).

| #   | Criterion                                                                                                                 | Evidence                                                                                                     | Status                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 1a  | A form with no schema, validation, checks, arrays or reset can be composed                                                | Type test `composition.tsx` (minimal form), sketch `03` part 4                                               | Met (types)                                                                 |
| 1b  | Behaviors depend on each other only through plain arguments, except check registration                                    | `api.ts` signatures                                                                                          | Met, with one exception                                                     |
| 1c  | Slots compose per form, and a form has only the slots its behaviors support                                               | Type test `composition.tsx` (slot groups, positive and negative)                                             | Met (types)                                                                 |
| 2a  | A behavior packaged as an extension applies to any form that provides what it needs, and is rejected by one that does not | Type tests `reuse.ts`, `composition.tsx`                                                                     | Met (types)                                                                 |
| 2b  | A group of slots is reusable across forms                                                                                 | Type test `composition.tsx`                                                                                  | Met (types)                                                                 |
| 2c  | A piece of form structure (a fragment) is reusable and mountable more than once                                           | Type test `composition.tsx`, sketch `08`                                                                     | Met (types and runtime). Parts take a `scope`.                              |
| 3a  | A user adds options, state, api and parts without an engine change                                                        | Type tests `consumer.tsx`, `composition.tsx`                                                                 | Met (types)                                                                 |
| 3b  | A user adds members to every field handle                                                                                 | Type test `composition.tsx` (field extras)                                                                   | Met (types)                                                                 |
| 3c  | A user hooks into value changes, validation runs and submit                                                               | `values.intercept`, `values.onChange`, `validation.onRun`, `submit.intercept`, `submit.onResult` in `api.ts` | Met (signatures). No runtime.                                               |
| 3d  | A user wraps a base slot                                                                                                  | None                                                                                                         | Out of scope (decision). An extension can add a slot or replace one by key. |
| 4a  | `Values` comes from the schema, and every option, callback, path, issue key and part is typed from it                     | Type tests `consumer.tsx`, `composition.tsx` (24 negative cases, plus the positive calls beside them)        | Met                                                                         |
| 4b  | Extensions change the types: api, state, parts, options, field handles                                                    | Type tests `composition.tsx`, `reuse.ts`                                                                     | Met                                                                         |
| 4c  | A form's kind cannot drift from its implementation                                                                        | Type test `conformance.ts` (generic `Values`, with a negative case)                                          | Met for the preset. Each kind author must repeat the pattern.               |
| 4d  | Check names in results come from the registered checks                                                                    | None                                                                                                         | Not met. The kind states them.                                              |
| 5a  | Each behavior is a separate export with no import-time side effects                                                       | `api.ts` signatures                                                                                          | Not yet shown. Needs a bundle measurement.                                  |
| 5b  | Using only values, status and events does not bundle validation, arrays, reset or the preset                              | Type test `composition.tsx` (types only)                                                                     | Not yet shown. Needs a bundle measurement.                                  |
| 5c  | A size budget exists for three tiers (see Plan)                                                                           | None                                                                                                         | Not met                                                                     |

## Problem

- `FormCore` combines values, field status, issues, validation lanes and reset.
  `FormApi` adds submit. A single concern cannot be tested, replaced or
  extended alone. (Principles 1, 3, 5)
- The only extension point is `FieldPlugin`. It adds extras to a field and
  cannot extend the form. (Principle 3)
- Features such as autosave live outside the form. A form effect
  (`createEffect`, `useFormEffect`) only observes selected state. The user
  still writes the timers, state and cleanup, and the result is not part of the
  form's api or state. (Principles 2, 3)
- Issue levels (`checks`) are part of the core for every user, including those
  who need only errors. (Principle 5)
- A repeated block, such as an address, repeats in the schema, defaults and
  checks. (Principle 2)
- React, Solid 1 and Solid 2 each hand-write the hook and component surface.

## Inspiration

[UI SDK](https://ui-sdk.dev/) defines a component with
`definePrimitive({ name, options, api, slots })`. Inside `api(context)`, it
creates behaviors (`createChange`, `createRovingFocus`, ...) that share one
store. Behaviors receive their dependencies as arguments. A framework adapter
renders the slots.

## Proposal

Define an Oxform form the same way. A form is a primitive. Its `api` composes
behaviors.

### Entry points

| Entry point             | Contents                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@oxform/core`          | The kernel: `defineForm`, `configureForm`, `extendForm`, `defineExtension`, `defineFragment`, the context, every `create*` behavior, and the slot groups |
| `@oxform/core/standard` | `standardForm`: a suggested preset, built only from the kernel's public API                                                                              |

`standardForm` has no private access. It is one composition among many. Users
can use it, extend it, or write their own in a few lines.

### The preset

`standardForm` composes: values, validation, one `error` check, field status,
field events, arrays, reset and submit. Per-event validators go in the `error`
option (`change`, `blur`, `focus`, `submit`).

### Lightweight by composition

Every behavior is its own export. A form pays only for the behaviors it
composes. Validation is optional: status, events, arrays, reset and submit take
`validation` as an optional dependency, and `valid` is true while no check is
registered. A form with only values, status and events needs no schema
(`minimalForm` in `03`). Importing `standardForm` brings in every behavior, so
it is the convenient path and not the smallest one. The documentation should
show the lean path first, and Plan item 3 sets a size budget.

### Checks

A check is a named set of issues by path, filled by event validators.
`createCheck(ctx, { values, validation }, { name, blocking, exclusive })`
is generic and registers itself with `validation`. The preset's `error` is one
call: `blocking: true`, `exclusive: true`. The kernel treats it like any other
check.

A check reads the option named after it, and one word names the option, the
check, the instance (`form.error`) and the state slice (`state.error`). More
levels are more calls. A `warning` check does not block. A `risk` check blocks.
These options replace today's single `checks` map. See `03-validation-and-checks.ts`.

`validation.run` returns issues grouped by check name, so `issues.error` is
the list the current API returns as `issues.error`.

A check entry is a Standard Schema issue (`message`, optional `path`). The
check adds the event `type` itself. Per-event refresh and `exclusive` need it.

### Parts

As in UI SDK, a slot definition never names an element. It declares `attrs`,
`on`, `present`, `state` and `props`. The adapter chooses the tag in
`createParts(def, { root: 'form', field: 'input', fieldError: 'p', submit: 'button', reset: 'button' })`.
Parts render real elements. Children may be a function of the part's state.
Props are inferred from the `props` declaration (`{ name: 'key' }`), and
slot state from the `state` function, so `slot(...)` takes no generics.
Lists are hooks (`useArrayField`), not components. Any other element uses
`usePart`. The `field` part also sets `data-dirty`, `data-touched` and
`data-blurred`, and `useField(name)` returns the bound handle and its state.

Slots are reusable. `defineSlots` creates a group of slots. The `slot`
parameter is annotated with what the group needs, for example
`SlotFactory<{ events: EventsApi<any> }, { status: StatusState }>`. A form
spreads the group into `slots`. The form fails to compile if it lacks that api or
state. The kernel exports `fieldSlots`, `fieldErrorSlots`, `submitSlots` and
`resetSlots`. Each is a separate export, so an unused group is tree-shaken. The
preset owns only `root`, which connects submit and reset. Slot `attrs` and
`state` read plain state, never methods on it, and use `part.api` for anything
that needs the instance.

### Extensions

An extension packages one behavior: its options, its kind, its api and its
slots. `defineExtension<Needs, Kind>({...})` returns a function that applies it
to a form. `Needs` states what the extension requires from a form, for example
`{ values: ValuesApi<any>; validation: ValidationApi<any> }`. Applying it to a
form that lacks that api is a type error. The api returns only the additions,
and the result is merged with the base. `extendForm(def, input)` is the
one-off form of the same operation. See `06-custom-behaviors.ts`.

An extension can add a slot, or replace a base slot by key. It cannot wrap a base
slot. That is a decision, not a gap.

Extensions reach every part of a form through the kernel's hooks, not through
private access:

| Need                                       | Hook                                   |
| ------------------------------------------ | -------------------------------------- |
| Rewrite or refuse a value change           | `values.intercept`, `details.cancel()` |
| React to a value change                    | `values.onChange`                      |
| Observe a validation run                   | `validation.onRun`                     |
| Add a blocking or non-blocking issue level | `createCheck`                          |
| Refuse or observe a submit                 | `submit.intercept`, `submit.onResult`  |
| Add members to every field handle          | `fieldExtras` in the extension's kind  |
| Add state, options, api and parts          | the extension's kind                   |

### Fragments

A fragment is a schema, defaults and validators for a sub-object, without a
place. `defineFragment` creates one. `configureForm(def, { schema, defaultValues, fragments: { billing: address, shipping: address } })`
mounts it. `Values` becomes the form's own values plus `{ billing: Address, shipping: Address }`.
`form.scope('billing')` returns handles typed to the sub-object, so a function
written for `HandlesApi<Address, 'error'>` works at any mount point and in any
form. `scope` accepts only paths that hold an object. See `08-fragments.tsx`.

### Concepts

| Concept                                            | Role                                                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineForm<Kind>(input)`                          | Creates a primitive: options, `api(ctx)`, `slots`. The kind is a type argument.                                                                                            |
| `create*` behaviors                                | `createChange`, `createValues`, `createValidation`, `createCheck`, `createFieldStatus`, `createFieldEvents`, `createArray`, `createReset`, `createSubmit`, `createHandles` |
| `configureForm(def, options)`                      | Infers `Values` from `schema`, then types every other option. Returns a configured definition.                                                                             |
| `extendForm(def, input)`                           | Adds behaviors, options and parts to a form. Returns a new definition.                                                                                                     |
| `defineExtension(input)`                           | Packages a behavior as a reusable extension with stated needs                                                                                                              |
| `defineSlots(build)`                               | Packages a group of slots with stated needs                                                                                                                                |
| `defineFragment(input)`                            | Packages a piece of form structure                                                                                                                                         |
| `configured(options?)`                             | Creates an instance, in any runtime                                                                                                                                        |
| `createParts(configured, elements)`                | Adapter components, one per slot, each rendering the element you name, plus hooks (`useForm`, `useField`, `useArrayField`, `useScope`, `useSelector`)                      |
| `usePart(configured, slot, slotProps, props, tag)` | A part with a custom element or data-driven content, as in UI SDK                                                                                                          |

Sketches: `01-define-a-form.ts` (slot groups and the preset's source),
`02-using-a-form.tsx` (quick start), `03-validation-and-checks.ts` (the error
check, more levels, a lean form, a form with no validation), `04-arrays.tsx`,
`05-status-reset-submit.tsx`, `06-custom-behaviors.ts` (extensions, field
extras, hooks), `07-runtimes-and-testing.tsx`, `08-fragments.tsx`.

## Typing model

TypeScript cannot carry `Values` from `configureForm` through a generic function
value. A test showed it infers `Api<unknown>` before it knows `Values`. The
working model is a **form kind**: an interface that maps `Values` to the form's
options, state, api, parts, base field handle and field extras, written with
`this['values']`.

- `configureForm` infers `Values` from the `schema` option, then checks every
  other option against it. Wrong defaults, unknown options and callback value
  types are errors.
- `defineForm` and `extendForm` take the kind as a type argument. It is not
  inferred from the implementation. An api-only extension needs no kind.
- A kind author writes the state, api and parts types by hand, and uses a named
  alias for `this['values']`, because `this` is not allowed in a nested type
  literal.
- To keep a kind honest, write the api as a function generic in `Values` and
  annotate its return type with the kind's api (see `type-tests/conformance.ts`).
  `defineForm` itself checks the implementation only at `Values = any`.
- The names of the checks in `validation.run` results come from the kind, not
  from the `createCheck` calls.

## Options

`options` in `defineForm` declares each input and its kind, as in UI SDK. The
kind tells an adapter how to pass the value. It does not give the option a
TypeScript type (the form's kind does).

| Kind                                               | Used for                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `value`                                            | Objects and functions, such as `schema` and `defaultValues`      |
| `action`                                           | Functions that are awaited: `onSubmit`, `onInvalid`, `saveDraft` |
| `callback`                                         | Functions that only report                                       |
| `string`, `number`, `boolean`, `list`, `id`, `key` | Readable from attributes                                         |

Values come from `configureForm(def, options)`, from `configured(options)` and
from `Root` props. A behavior reads them with `ctx.options()` inside its methods
and reacts to changes with `ctx.onOptions`. A check reads the option named
after it. `onSubmit` and `onInvalid` are both `action`, because both are
awaited, and may return any value. `Root` takes the options as props, so the
`onSubmit` prop is the option and shadows the `<form>`'s DOM `onSubmit`.

## Server rendering

Today `useForm` creates the instance in a `useState` initializer, and ids come
from `generateId()` (`utils/generate-id.ts:1`), which uses `Date.now()` and
`Math.random()`. Both runtimes would render different ids on the server and the
client. The Solid adapters already have SSR and hydration specs
(`packages/solid-v*/src/server-tests`). The proposal sets these rules:

1. **Definitions are shared. Instances are not.** `defineForm`, `extendForm`,
   `defineExtension` and `configureForm` are stateless and safe at module
   level. An instance is created per render or per request, by `Root`, by
   `configured(options)`, or by the caller. No module-level instance on a server.
2. **`api(ctx)` runs on the server and must be inert.** It may create slices
   and subscribe to the store. It must not touch the DOM or `window`, and it
   must not start timers or requests. Work starts on events, or in `bind` and
   `connect`, which run only in the browser. The autosave extension already
   follows this: its timer starts in `values.onChange`.
3. **`attrs`, `state` and `present` are pure.** The first HTML already has
   `value`, `aria-*`, `data-*` and `disabled`. Creation does not validate, as
   today, so the first HTML has no errors unless the instance already holds
   them (rule 7).
4. **Ids come from the adapter.** An `id` option of kind `id` is generated by
   the adapter (`useId` in React, the hydration-safe id in Solid). The kernel
   no longer calls `generateId()`.
5. **Options are not serialized.** `value`, `action` and `callback` options stay
   in memory. The client builds its own instance from the same options, so
   `defaultValues` must be deterministic across both.
6. **`useSelector` returns the initial state on the server.** React uses
   `getServerSnapshot`. Solid keeps its owner-scoped getters.
7. **Request handlers use the same definition.** `validation.run()` and
   `submit.run()` need no DOM. A server action calls
   `configureForm(def, {...})` once and `configured({ defaultValues: body, onSubmit })`
   per request. After `await form.validation.run()`, the same instance renders
   the errors: `<Root form={form}>` accepts an existing instance. This covers a
   no-JavaScript post-back.
8. **Cleanup.** `ctx.onDestroy` runs when the adapter unmounts. A server render
   has no unmount, so the server adapter calls `destroy` after rendering.
   Rule 2 means nothing leaks if it is skipped.

Verification:

- `renderToString` of the quick start matches the expected HTML (values,
  `aria-*`, `disabled`).
- A hydration test in React, Solid 1 and Solid 2 shows no mismatch warnings.
- Two concurrent server renders of one definition share no state.
- The behavior and kernel tests run in a Node environment with no `window`.
- A request-handler test validates a body and renders the errors from the same
  instance.

Risks:

- `Root form={form}` adds a second way to supply an instance. Accepted: it is
  the only server path that needs it.
- Adapters differ in id and snapshot APIs. Mitigation: hide them behind the
  `id` option kind and `useSelector`.
- A user-written behavior can break rule 2. Mitigation: document it, and run
  the kernel tests with no `window`.

## Inner workings

1. **Context.** `ctx` provides `store`, `options()`, `onOptions`, `onDestroy`,
   `instance()` and `slice(name, initial)`. Each behavior registers its own
   state slice in `api`. `api` runs once per instance, before the first render,
   so server rendering has state. `instance()` gives the instance under
   construction to event handlers, for example to pass `form` to `onSubmit`.
2. **Change pipeline.** `createChange` is the only path for value changes:
   interceptors, then the write, then listeners. Behaviors subscribe with
   `values.onChange` and `values.intercept`. Listeners invalidate validation
   lanes, mark status, and run user behaviors. The change `details`
   carry `reason`, `source` and `cancel()`. This replaces `core.set` calling
   `invalidateValidationLanes` directly (`form-core.ts:229`).
3. **Dependencies.** A behavior receives the behaviors it needs as arguments.
   There is no event bus. The one implicit link is check registration (item 4).
   `validation` is an optional dependency of status, events, arrays, reset and
   submit.
4. **Checks.** `createCheck` owns one slice (issues by path). It registers with
   `validation`, which runs every registered check for an event, shares the
   stale-result lanes, and reports blocking checks to `status` for `valid`.
   A check that is `exclusive` replaces all its issues in scope, as `error` does
   today. Other checks refresh only entries of the selected event and keep
   untyped ones. With no check registered, `valid` is true.
5. **State.** One tree: `values`, per-path field state, status, and one slice
   per user behavior. Derived values (`default`, `valid`, `pristine`) are
   memoized per path. Today the derived store rebuilds every field entry on
   every change (`form-core.ts:51`). The gain is unmeasured.
6. **Fragments.** The kernel wraps each fragment's schema: it validates
   `values[prefix]` and re-prefixes the issue paths. The composed schema runs
   the form's schema and each wrapper. A fragment's validators, and its default
   values, are placed at the same prefix. Standard Schema has no composition
   API, so this needs no library-specific `.extend`.
7. **Field handles.** `createHandles` builds `field`, `array` and `scope`. The
   base handle type and the extras come from the kind (`handle`, `fieldExtras`),
   so an extension's extras appear on `form.field(path)` typed by the value at
   that path.
8. **Adapters.** Core builds neutral field bindings. An adapter supplies the
   subscription, context and the `Root` element. Solid 1 and Solid 2 keep
   separate adapters because their reactivity differs.
9. **Lifecycle.** `'~mount'` and `'~update'` are removed. `Root` props feed
   `ctx.onOptions`. Updating options never resets values.

## Approaches considered

|     | Approach                                                                             | Verification                                                                                                                                               | Risk and mitigation                                                                          |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A   | **Behaviors composed in `api` (this proposal).** New core beside the old one.        | Translate the existing core specs to the new API. Type tests for inference. Lane and race specs. Examples in React and both Solid versions. Bundle budget. | Largest change. The type model needs hand-written kinds. Spike types and the pipeline first. |
| B   | **Extract behaviors inside `FormApi`.** Keep the public API. Open `extendForm` last. | Existing specs stay green after each commit.                                                                                                               | Can stall halfway and leave two models. Does not give opt-in bundles.                        |

Rejected: composing a form as a list of extensions (`buildForm(withValues, withCheck('error'), ...)`).
It removes hand-written kinds and derives check names, but it moves the main
composition surface from one `api(context)` to a list. The `api(context)` model
stays, with hand-written kinds for `Values`-dependent types.

Rejected: building on UI SDK itself. It targets UI components, is in beta, and
would add a dependency that Oxform must track.

## Changes against the current spec

- The single `checks` map is split. Each level is its own `createCheck` call
  and reads an option of the same name (`error`, `warning`, `risk`).
- Issue buckets become checks: `form.error.at(path)`, `form.error.set(...)`,
  `field.error()` and `field.setError(...)` (sugar for the checks given to
  `createHandles`), and `reset.all({ keep: { checks } })`.
- `validation.run` groups results by check name.
- `form.field(name)` and `form.array(name)` replace `form.field.change(name, ...)`
  and `form.array.append(name, ...)`. The array behavior is `form.arrays`.
- Values are read with `values.get(path?)`.
- `form.validate(...)` becomes `form.validation.run(...)`. `form.reset(...)`
  becomes `form.reset.all(...)`. `form.submit(onSuccess, onError)` becomes
  `form.submit.run()`. The callbacks are the `onSubmit` and `onInvalid` options.
- `Root` prevents the default submit. This is a choice in the `root` slot of
  `standardForm`, not a rule of the library.
- `<Root onSubmit>` is the option, not the DOM event handler.
- `formOptions(...)` and `useForm(options)` become `configureForm(def, options)`.
- New: `defineForm`, `extendForm`, `configureForm`, `defineExtension`,
  `defineSlots`, `defineFragment`, interceptors and `cancel()` on changes,
  `validation.onRun`, `submit.intercept`, `submit.onResult`, `form.scope`.

## Open questions

1. **Kind authoring cost.** Each form or extension with `Values`-dependent types
   needs a hand-written kind. Decide whether this cost is acceptable, or whether
   the spike should look for a lighter encoding.
2. **Replacement rules.** Today `error` replaces everything in scope, and other
   levels refresh by event. `exclusive` keeps both rules but exposes the
   difference as a flag. Decide whether to unify them. That would change
   behavior in the spec.
3. **Registration.** `createCheck` registers with `validation` implicitly. This
   breaks the rule that dependencies are explicit arguments. Alternative:
   `createValidation(ctx, { values, checks: [error] })`, but an extension could
   not then add checks.
4. **Check names in types.** The kind states the check names. Decide whether a
   conformance test per kind is enough, or whether names should derive from the
   `createCheck` calls.
5. **Parts inside a scope.** Designed: `<Field scope={billing} name='zip' />` names the field relative to the
   scope, typed by the scope's values. The hooks take `{ scope }` too. Open: a forgotten `scope` on a part whose
   name also exists on the form.
6. **Migration.** Users of levels need a codemod from `checks` to one option
   per check, and from `useForm(options)` to `configureForm`.
7. **Controlled values.** Deferred. Nothing here needs them.
8. **Performance.** Benchmark the memoized derived state before and after.
9. **Option sources.** `defaultValues` can come from `configureForm`,
   `configured(options)` or `Root` props. Proposed rule: later wins (`Root` over
   instance over `configureForm`), and `configureForm` fixes the types. A
   definition without defaults requires them at the instance.
10. **Not yet sketched.** Form `id` generation per adapter, `unregister` on
    unmount, `useFormEffect`, and non-React adapters' `createParts`.

## Plan

1. Review the sketches, `api.ts` and the checklist, and cut or change API pieces.
2. Spike the runtime of `defineForm`, `configureForm`, `extendForm`,
   `createChange`, `createValues`, `createValidation` and `createCheck` in a
   throwaway package. Include a second check (`warning`), because it tests
   registration and `exclusive`. Port the validation lane and race scenarios
   from `docs/form-core-behaviors.md` (deleted, in git history). Keep
   `type-tests/` passing.
3. **Measure bundle size** in three tiers (minified and gzipped, tree-shaken):
   values and one check; the lean login form; the full preset. Compare with
   today's `@oxform/core`. Set a budget from the result, and add it to CI.
   Checklist items 5a to 5c depend on this.
4. Add a conformance test for each kind that ships (`type-tests/conformance.ts`
   is the pattern).
5. Migrate. The spike results and the checklist are in `spike-results.md`.
6. If go: build the remaining behaviors, then the React adapter, then both
   Solid adapters, then migrate examples and docs.

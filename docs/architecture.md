# Architecture

This guide describes the internal design of `@oxform/core` for contributors. The public documentation in
`apps/docs` describes how to use it. The source paths are relative to `packages/core/src`. For the contract of `@oxform/core/adapter`, see [Adapter authors](./adapter-authors.md).

## Modules

| Folder       | Holds                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| `main/`      | The kernel: forms, extensions, the context, slot groups, scopes, `createEffect` and the types |
| `behaviors/` | One module per built-in behavior: a `createX(context, deps)` function and its extension       |
| `presets/`   | `standard`, which uses only what the public entry points export                               |
| `internal/`  | Path helpers, such as `getAt`, `setAt`, `joinPath`, `isWithin` and `isDeepEqual`              |

The entry points are in `packages/core/export`. Runtime imports go one way: presets, then behaviors, then main. A
type-only import may cross, because `Needs` and `BuiltInApis` name the api types of the behaviors. The four entry
points are one package, so the internal channels below have one module instance.

## Forms and chains

`main/form.ts`, `makeForm`.

- A form is a plain object with `name`, `extend`, `configure` and `create`. A private `WeakMap` (`chains`) maps each
  form to its extensions, in order. `slotsOf(form)` and `extend` read it.
- `extend(fn)` calls `fn(form)`. When the result is a form (it is in `chains`), `extend` returns it: `fn` is a
  preset. Otherwise the result is the object of `defineExtension`, and `extend` returns a new form with that object
  at the end of the chain.
- `configure` returns a new form whose configured options are the old ones merged with the new ones.
- `defineExtension` returns the object it gets. The `form` parameter carries the types only.
- Options are a type only (`optionTypes`). A duplicate option name is a type error of `extend` (`DuplicateOption` in
  `main/types.ts`), and nothing checks it at runtime.

## Instance creation

`main/form.ts`, `createInstance`.

1. `merge` joins the options: `defineForm`, then `configure`, then `create`. Each placed scope then puts its
   default values and validators into the merged options (see "Scopes").
2. `create` sets an `id` from a module counter (`form-1`) when the options have none. An adapter always passes
   one.
3. `createContext(options)` makes the context controls. The field members of each extension are registered first,
   so a handle made later carries them.
4. For each extension, in chain order:
   - `checkNeeds` compares `needs` with the api and the store state so far. A missing need throws and names the
     extension and the need.
   - `state(options)` runs, and `extensionContext` adds its keys to the store. A key that another extension owns
     throws.
   - `api(context, deps)` runs. `deps` is a copy of the api so far, with property descriptors, so a getter stays
     live. A key that an earlier extension returns, or `id`, `store` or `destroy`, throws.
   - `checkGroups` checks the needs of each slot group in the slots of the extension.
5. An extension with `fields` needs a `field` api, or `create` throws.
6. Each placed scope verifies that the form has its checks.
7. When a step throws, the context is destroyed and no instance exists.
8. The api gets `id`, `store` and `destroy`. `bindInstance` makes `context.instance()` valid. The adapter controls
   (`setOptions`, `unmount`) go in a `WeakMap` that `adapterControlsOf` reads.

## The context

`main/context.ts`, `createContext`.

- The context has two TanStack stores. `base` holds the state slices. The public `store` derives from `base`, and
  adds the derived slices (see "Derived status"). An unchanged result keeps its reference.
- `extensionContext(name, state)` gives one extension its context: `options()`, `onOptions`, `onDestroy`,
  `instance()`, `state.<key>` for its own keys only, and `store`.
- `setOptions` replaces the options and calls the `onOptions` listeners. Only the adapter controls call it.
- `unmount` runs the cleanups and keeps them registered, so an instance can mount again. `destroy` runs them, then
  drops them and the option listeners.
- `contextInternals(context)` gives the built-in behaviors `derive`, `decorateField`, `validation` and
  `registerValidation`. It is not on the public context.

## State factories

- `state(options)` of an extension runs once per instance, before its `api`. It returns every state key of the
  extension.
- Each key becomes one slice of `base`. `context.state.<key>` reads and writes that slice. An extension cannot write
  the slice of another extension: it uses the api of that extension.
- `status` keeps raw flags in its slice and registers a derivation under the same key, so the store shows the
  derived status (see "Derived status").

## Internal channels

A channel is a module-private `WeakMap`, keyed by an api object that the owner made. A lookup with another object
throws, so a built-in behavior accepts only the api of the built-in extension.

| Channel                                                                 | Carries                                                          | Used by                                        |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| `contextInternals(context)`                                             | `derive`, `decorateField`, `validation()`, `registerValidation`  | Every behavior that needs one                  |
| The validation link, `validation()`                                     | The validation api, or a stand-in with no check                  | status, events, arrays, reset, submit, handles |
| `statusInternals(status)`                                               | `mark`, `setForm`, `reset`, `remap`, `generation`                | events, arrays, reset, submit                  |
| `eventsInternals(events)`                                               | `ref`, `clearRefs`                                               | handles, reset                                 |
| `arraysInternals(arrays)`                                               | `ids`                                                            | handles                                        |
| `checkInternals(check)`                                                 | `remap`                                                          | arrays                                         |
| `registerCheck`, `isDiscarded`, `isInScope`                             | Check registration, and the result of a discarded run            | check, submit                                  |
| `Symbol.for('oxform.scope.mount')`, `Symbol.for('oxform.scope.verify')` | The place and verify logic of a scope                            | `makeForm`, `createInstance`                   |
| `slotsOf`, `adapterControlsOf`, `prefixOf`                              | The slots of a form, the adapter controls, the prefix of a scope | Adapters, through `@oxform/core/adapter`       |

### The validation link

`validation` registers its api with `registerValidation` when its `api` runs. The other behaviors call
`contextInternals(context).validation()` each time they use it. Without `validation`, the link is a frozen stand-in:
every path is valid, nothing is validating, and a run resolves valid with no issues. So a chain without `validation`
acts as a chain with `validation` and no check, and no built-in behavior has an optional need.

## The change path

`behaviors/change.ts` and `behaviors/values.ts`.

1. `values.set(path, updater, { reason })` resolves the updater against the current value.
2. The interceptors run in the order they were added. Each one can return a new change, or call `cancel()`. A
   canceled change stops here and `set` returns `false`.
3. The write compares the new value with the current value at the path by `Object.is`. An equal value is not
   written, and `set` returns `false`.
4. The listeners run in the order they were added, with the change and its details.

The order of registration is the order of the chain, because each extension subscribes when its `api` runs.
`validation` listens to every written change and marks the pending runs that the change makes stale.

## Validation runs

`behaviors/validation.ts`, `createValidation`.

- Each `check` registers with `registerCheck`: the check api, `validatorFor(event)` and `refresh`.
- `run(targets, { type })` validates the events of `type`, or every event. Each pair of check and event with a
  validator runs at the same time. Issues outside the targets are dropped.
- A run has lanes: one per event, keyed by its sorted targets and the event. A new run marks each pending run that
  shares a lane as stale. A change marks each pending run whose targets overlap the changed path as stale. `reset`
  calls `discard` through the link.
- A stale run applies nothing. It resolves `[true, issues]` with an empty list per check, and the result goes in a
  `WeakSet`, so `isDiscarded` lets `submit` tell it from a valid run. `onRun` listeners do not run.
- An applied run calls `refresh` of each check that ran: an exclusive check replaces every entry in scope, and
  another check replaces the entries of the events that ran. A blocking check with issues makes the run invalid.
- The `validating` slice counts the pending runs.

## Derived status

`behaviors/status.ts`, `createStatus`.

- The slice holds the raw flags: the form flags, the flags of each marked path, and a `generation` number that goes
  up at each whole-form reset.
- `derive('status', compute)` makes the store show the derived `StatusState`. `compute` builds an entry for each
  node of the values and each marked path. `valid` reads the blocking checks through the validation link.
- The cost is linear in the number of fields. Unchanged entries keep their reference, so a selector of one field
  does not see a change of another field.
- `submit` reads `generation` to know that a reset happened during an attempt.

## Slots and slot groups

`main/form.ts`.

- A slot is plain data. The `slot` factory is the identity, and exists for the types.
- `defineSlots({ name, needs }, build)` returns a function that records the group of each slot it builds in a
  `WeakMap`. `createInstance` reads it to check the needs of each group once the extension that spreads the group
  has run.
- `slots(build)` is an extension with no api and no state.
- `slotsOf(form)` merges the slots of the chain in order, so a later key replaces an earlier one.

## Scopes

`main/scopes.ts`.

- `defineScope` returns the scope with two symbol keys: `mount` and `verify`. `makeForm` calls them, so a form with
  no scope never loads this module.
- `mount` throws for a dotted key and for a key of the form's own default values. It merges the default values at
  the path deeply over the scope's own, and joins the validators of the scope to the option of each check, at the
  path.
- A joined validator runs each part and merges the issues. A part of a scope gets the values at its path, and the
  paths of its issues start with that path.
- `verify` runs after every `api`, and throws for a check of the scope that the form does not have.
- `handles` makes the `Scope` objects. A scope keeps its prefix under `Symbol.for('oxform.scope.prefix')`, and
  `prefixOf` reads it for the adapters.

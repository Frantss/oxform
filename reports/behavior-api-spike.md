# Behavior API spike

## `createChange` and `createValues` depend on each other

- `explorations/behavior-api/api.ts:634` declares `createChange(ctx)`, and `api.ts:636` declares
  `createValues(ctx, { change })`. `createChange` owns the pipeline (interceptors, write, listeners)
  but has no way to perform the write, because the values slice belongs to `createValues`.
- The spike's `createChange` in `explorations/behavior-api/spike/src/change.ts` takes a `write`
  function as a second argument. That is a deviation from the sketch.
- Why it matters: proposal principle 1b says behaviors depend on each other only through plain
  arguments. Resolving the cycle either changes the `createChange` signature or adds a hidden link
  (`createValues` registers its writer on `change`), which is a second implicit link beside check
  registration.
- Options: (a) `createChange(ctx, write)` and `createValues` builds its own `change` (but then `change`
  is no longer a dependency argument); (b) `createValues` registers a writer on `change` (hidden link);
  (c) `createValues` owns the pipeline and `createChange` is the pure interceptor and listener store.
  Decision: (c). `createChange(ctx)` keeps its sketch signature. `ChangeApi.apply` became
  `run(change, write, details)` in `api.ts`, and `createValues` supplies the write. No sketch
  call site changed.

## `createCheck` registers with `validation` but `ValidationApi` has no registration member

- `api.ts:457` has no member for registering a check, while `api.ts:646` says `createCheck` registers
  itself with `validation`. The spike needs an internal registration path, which is the implicit link
  open question 3 describes.

## The root `schema` option has no defined role in validation

- `explorations/behavior-api/api.ts:641` makes `createValidation` require a `schema` option, and the
  sketch `03-validation-and-checks.ts` calls it "the submit fallback" and the source of `Values`.
  `validation.run()` is described as running "root schema and every event", but no check reads `schema`.
- The spike (`spike/src/validation.ts`) does not use `schema`. It runs only each check's per-event
  validators. Decide whether the root schema feeds the `error` check on `submit`, or only fixes `Values`.
- Why it matters: it changes what `run()` returns for a form that has only a `schema`.

## Validator store has no real status

- `ValidatorStore` (`api.ts:437`) includes `status`, but the spike has no status behavior. `run()`
  passes an empty stand-in (`spike/src/validation.ts`). A validator that reads `store.status` gets nothing.

## Decision: `schema` stays in the core

- The `schema` option stays a kernel option, and `configureForm` infers `Values` from it
  (`api.ts:338`). Its runtime role in validation is still open. The spike does not read it at runtime.

## Stop-point result for TK-001 to TK-006

- Implicit registration works with two checks (`spike/src/warning-check.spec.ts`). `exclusive` is the
  only difference between `error` and `warning` in the kernel: `error` replaces all entries in scope,
  and `warning` refreshes only entries of the selected event and keeps untyped ones.
- `configureForm` infers `Values` from `schema`, and a spike kind rejects wrong paths, wrong value
  types and mismatched `defaultValues` (`spike/src/form.spec.ts`, `@ts-expect-error` cases).
- Not covered: slots and parts (`defineForm` ignores them), fragments, the `id` option (the caller
  supplies it, as an adapter would), and the `ValidationApi` type has no `Checks` link to `createCheck`
  calls (open question 4: each test states `'error' | 'warning'` by hand).

## TK-007 to TK-011 results

### Validation lanes and races (`spike/src/validation-lanes.spec.ts`)

- Covered: overlapping change discards a run (`[true, {}]`), including ancestor and descendant overlap;
  an unrelated change keeps it; a newer run for the same targets and event discards the older one;
  different events or targets run side by side; rejection rejects the run promise; target scopes
  (descendants in, ancestors and siblings out); `{ key }` path segments and numeric indices; an empty
  target array; pathless issues apply only to whole-form runs; an untyped run uses every event.
- Not covered: reset discarding a run, and the `validating` status. Both need behaviors the spike
  does not build (`createReset`, `createFieldStatus`).
- Found while porting: `run()` validity covers issues emitted in this run, not preserved entries in
  scope (`docs/form-core-behaviors.md:58`). The first TK-004 code counted preserved entries.
- Found while porting: an exclusive check must replace its entries once per run. Replacing per event
  made a later event wipe an earlier event's issues in an untyped run
  (`spike/src/validation.ts`, one `refresh` per check).
- Open: when a run is discarded, `onRun` does not fire. The api comment says "every completed run".

### Hooks and server rules (`extension-hooks.spec.ts`, `inert-api.spec.ts`)

- `values.intercept` with `cancel()`, `values.onChange` and `validation.onRun` work from an extension
  that uses only `extendForm`.
- Creating an instance runs in Node with no `window`, starts no timers or requests, and does not
  validate. Two instances of one configured definition share no state, and a request-handler flow
  renders errors from the same instance.
- Not covered: `renderToString`, hydration, `useSelector` and `Root form={form}` (need an adapter).

### Conformance (`spike/src/spike-form.ts`)

- `spikeApi<Values>` annotated with `SpikeApi<Values>` compiles, and removing `error` fails with a
  `@ts-expect-error` that holds. The pattern works for a kind with one check. Each kind author must
  repeat it (checklist 4c). Check names (4d) are still stated by hand.

### Bundle size (`spike/vite.config.ts`, `spike/measure-bundles.ts`)

Built per tier with `vp pack`, minified, dependencies bundled, one bundle per entry. Baseline is the
built `@oxform/core` 0.6.0 with `@tanstack/store` and `remeda` bundled.

| Entry                                                         | Minified | Gzip    |
| ------------------------------------------------------------- | -------- | ------- |
| Values only (`createContext`, `createChange`, `createValues`) | 5.66 kB  | 2.22 kB |
| Values, validation, one check, `defineForm`/`configureForm`   | 8.64 kB  | 3.42 kB |
| Today's `@oxform/core` (everything)                           | 24.83 kB | 8.09 kB |

- The values-only entry does not include validation, so criterion 5b holds for these two pieces.
  `@tanstack/store` is about 4.3 kB minified and 1.7 kB gzip of that, in both spike tiers.
- These numbers are not comparable one to one. The spike has no status, events, arrays, reset or
  submit, and a path helper that does not handle everything today's core does. The lean login form
  (tier b) and the full preset (tier c) cannot be measured until those behaviors exist.
- No budget is set and nothing is added to CI. That needs tiers (b) and (c).

## Remaining behaviors: status, events, reset, arrays, submit, handles, preset

Built in `explorations/behavior-api/spike/src/` (103 tests). The go or no-go evidence is in
`explorations/behavior-api/go-no-go.md`. Findings:

- **Hidden coupling is wider than check registration.** `status.ts`, `events.ts`, `reset.ts` and `submit.ts`
  read check state through helpers in `spike/src/validation.ts` that use a module-level `WeakMap` keyed on the
  validation object (`currentIssues`, `hasBlockingIssues`, `hasValidatorFor`, `clearEntries`, `isValidating`,
  `isDiscarded`). The sketch signatures (`api.ts:659` to `api.ts:716`) give these behaviors only `validation`,
  which exposes `run` and `onRun`. Principle 1b ("plain arguments, except check registration") is not met.
- **Sketch signatures lack members the behaviors need.** `StatusApi` (`api.ts:378`) has no writes, so events,
  arrays, reset and submit needed `mark`, `setForm`, `reset`, `remap` and `generation`
  (`spike/src/status.ts`). `EventsApi` (`api.ts:517`) has no `ref`, and `ArraysApi` (`api.ts:537`) has no
  `ids`. `createFieldStatus` needs `values` for the field `default` flag, `createSubmit` needs `values` to pass
  `onSubmit` its snapshot, and `createHandles` needs `values` and `status` for `state`. The spike widens these
  signatures locally and leaves `api.ts` unchanged.
- **Reset cannot clear refs.** `createReset` has no `events` argument, so `keep.refs` has no effect
  (`spike/src/reset.ts`).
- **`store.state.status` is raw.** It holds interaction flags per path. `status.form` and `status.at()` derive
  `valid`, `default`, `validating` and the aggregates on read. Slots that read `state.status.fields[key]` (the
  preset's `field` slot, `type-tests/conformance.ts:97`) would get raw flags unless derived state moves into the
  store (open question 8, memoization).
- **Issues do not follow array items.** Field state and ids follow `swap`, `move` and `remove`, but check
  entries are keyed by path and stay put (`spike/src/arrays.ts`). The behavior spec does not say.
- **Out-of-range `swap` and `move` are a no-op** in the spike. The behavior spec says positive out-of-range
  indices are not clamped and leaves the result undefined.
- **An interceptor-canceled submit is not counted.** `submit.intercept` with `attempt.cancel()` clears
  `submitting` and does not increment `submits`. The sketch does not say.
- **A discarded run is detected by identity.** `submit` tells a discarded run from an empty valid run by a
  shared frozen tuple (`isDiscarded`), because both resolve to `[true, {}]` when no check is registered.
- **Bugs fixed while testing:** array item ids were regenerated on every read until stored, and a canceled
  submit incremented the submit count.
- **Bundle tiers** (`spike/measure-bundles.ts`): values 2.23 kB gzip, values and status and events 3.35 kB,
  values and check 3.50 kB, lean login 4.86 kB, full preset 5.99 kB, today's core 8.09 kB. Budgets are checked
  by the script and not wired into CI.

## Decisions applied (supersedes the findings above where noted)

- **Hidden coupling (supersedes "Hidden coupling is wider than check registration").** Status, events, arrays,
  reset and submit now read checks through the public `validation.checks`, `validation.issues()` and
  `validation.validating`, and `check.validates()` and `check.clear()` (`explorations/behavior-api/api.ts`).
  Check registration is the only implicit link left (`spike/src/validation.ts`, `registerCheck`). The
  kernel-internal channels `statusInternals`, `eventsInternals` and `arraysInternals` carry the members that were
  kept off the public apis on purpose (status writes, `ref`, `clearRefs`, `ids`). They are module-private
  `WeakMap`s, not on the instance.
- **Sketch signatures (supersedes "Sketch signatures lack members").** `api.ts` now passes `values` to
  `createFieldStatus`, `createSubmit` and `createHandles`, `status` to `createHandles`, and `events` to
  `createReset`. The sketches `01` and `03` and `type-tests/conformance.ts` were updated to match, and
  `type-tests/` still pass.
- **Reset refs (supersedes "Reset cannot clear refs").** `createReset` clears refs through `events`, unless
  `keep.refs` or `keep.fields` says otherwise (`spike/src/public-surface.spec.ts`).
- **Check names.** Kept hand-written. A declared name that no `createCheck` registers is typed but undefined at
  runtime.
- **Bundle tiers after the change:** values 2.23 kB gzip, values with status and events 3.38 kB, values with a
  check 3.55 kB, lean login 4.94 kB, full preset 6.18 kB, today's core 8.09 kB. All within their budgets.
- **Still open:** the runtime role of the root `schema`, derived status in the store, and issues that do not
  follow array items.

## Issues follow array items, slots, extensions, fragments, effect

Built in `explorations/behavior-api/spike/src/`. 146 tests (145 pass, 1 documented expected failure).

- **Decision: the root `schema` only sets the data shape.** `createValidation` no longer asks for a `schema`
  option (`api.ts:658`), and the comments in `api.ts` and sketch `03` that called it a submit fallback were
  corrected. `proposal.md` still says in its "Fragments" and "Inner workings 6" text that a composed schema
  validates. I did not edit it because it holds uncommitted changes. Today's library validates the root schema
  on submit by default (`docs/form-core-behaviors.md:73`), so the migration needs a codemod that adds
  `error: { submit: schema }`.
- **Check entries follow array items** (`spike/src/check.ts`, `spike/src/arrays.ts`). Entries move with `swap`,
  `move`, `prepend`, `insert` and `remove`. A removed item's entries are dropped. Entries under `update` and
  `replace` are not cleared, and a configured `change` validator recomputes them anyway.
- **No runtime provider for field extras.** The kind's `fieldExtras` types extra members on `form.field(path)`
  (`api.ts:62`, sketch `06` `withMask`), but `ExtensionInput` (`api.ts:281`) has no member that supplies them and
  `createHandles` cannot see extensions. The sketch's `withMask` has `api: () => ({})`, so `mask` has no
  implementation. Not built. Needs a design: for example `fieldExtras(path)` on the extension input, called by
  `createHandles` for each handle.
- **The preset's `field` slot is wrong on the real store.** The slot reads `state.status.fields[key].valid`.
  The spike store keeps raw interaction flags, so `valid` is `undefined` and a valid field gets `aria-invalid`.
  `spike/src/slots.spec.ts` marks the case `it.fails` so it flags the day derived status reaches the store.
- **Fragments inside `configureForm` taxed every form.** The first version imported the fragment code from
  `configureForm`, which added about 0.4 kB gzip to forms that never use fragments. A fragment now carries its
  own mount logic under a symbol key, so `configureForm` does not import `spike/src/fragments.ts`. The
  public types in `api.ts` did not change.
- **Fragment validators.** A fragment's check validators join the form's own validator for the same check and
  event, run against the values at the mount, and re-prefix their issue paths. A fragment's `schema` only shapes
  the types, as for the form.
- **Extensions.** `defineExtension` is `extendForm` with the packaged input. A slot with a base key replaces the
  base slot. `@ts-expect-error` rejects `withAutosave` on a form without `validation`.
- **Bundle tiers** (gzip): values 2.23 kB, values and status and events 3.38 kB, values and a check 3.74 kB, the
  same with fragments 4.03 kB, lean login 5.03 kB, full preset with slots 6.73 kB, today's core 8.09 kB. The
  budgets in `spike/measure-bundles.ts` were raised to match, and all tiers are within them.

## Derived status in the store, and field extras

- **Derived status** (`spike/src/context.ts`, `spike/src/status.ts`). The context's `store` is now a derived
  store over the slices written with `ctx.slice`. A behavior registers a derivation through the kernel-internal
  `contextInternals(ctx).derive(name, compute)`, and the store holds the computed value under the slice name.
  The status slice keeps raw flags in the written state and exposes the derived `StatusState` in `store.state`.
  `validation` keeps a pending count in the state, so `validating` is reactive. The preset's `field` slot now
  reads a correct `valid` (`spike/src/slots.spec.ts`), and selectors and effects on `state.status` work
  (`spike/src/derived-status.spec.ts`).
- **Cost.** `events.change` plus a read of `store.state.status`, in Node: 0.03 ms at 20 fields, 0.19 ms at 200,
  1.09 ms at 1000. Writes alone cost 0.01 ms because the derived state is lazy. The recomputation is linear in
  the number of fields. Per-path memoization keeps object identity stable for subscribers, and does not skip
  the recomputation. Today's core was not measured. The timing spec was deleted after the run.
- **Field extras** (`spike/src/form.ts`, `api.ts` `ExtensionInput.fieldExtras` and `ExtendFormInput.fieldExtras`).
  `extendForm` wraps the merged `field(path)` so each handle carries the extras. The handle is not spread: its
  `state` is a getter, so property descriptors are copied to keep it live. An extra that redefines a base
  member throws. An extension with `fieldExtras` on a form without `field` throws when the instance is
  created, and the types reject it through `Needs`.
- **Types and runtime can disagree.** The kind narrows `mask` to string fields. At runtime the extension decides
  what it returns, so a careless `fieldExtras` that always returns `mask` puts it on `tags` too. The sketch and
  the spike extension check `typeof field.get() === 'string'`.
- **Scoped handles have no extras**, in the types or at runtime. `HandlesApi` for a scope has its own `Values`,
  so extending it needs a typed `HandlesApi` that carries the extras.
- **Bundle tiers** (gzip) after both changes: values 2.33 kB, values with status and events 3.73 kB, values
  with a check 4.05 kB, with fragments 4.34 kB, lean login 5.39 kB, full preset 7.08 kB, today's core 8.09 kB.
  Derived status costs about 0.35 kB in the tiers that include status. Budgets were reset.

## Field extras on scoped handles

- **Runtime** (`spike/src/form.ts`). `extendForm` wraps `field(path)` and `scope(prefix)` together, so every handle
  set a scope returns carries the extras, at any depth and across several extensions. `fieldExtras` gets the path
  relative to the scope. Covered in `spike/src/field-extras.spec.ts`.
- **Types** (`api.ts`, `HandlesApi`). The extras are typed at every depth: `form.scope('a').scope('b').scope('c')
  .field('text')` has `mask`, typed by the sub-object's own values (`type-tests/composition.tsx`, spike).
- **Encoding.** `HandlesApi<Values, Checks, Kind>` is one recursive interface. `Kind` defaults to `FormKind`, whose
  extras are `unknown`, so the plain `HandlesApi<Address, 'error'>` is the same interface and the scoped handles of
  any form are assignable to it through variance. Each of these made TypeScript 7 fail with "Type instantiation is
  excessively deep": a recursive alias, a depth counter on a tuple, a second interface related to `HandlesApi`
  structurally (also with `extends`), an intersection that overrides `field`, written-out levels, and inferring the
  check names from the `scope` signature. This replaces the earlier one-level limit.
- **The kind states its check names** (`FormKind.checks`, `ChecksOf`). `StandardKind` has `checks: 'error'`, and
  `ExtendedKind` merges the names of the base and the extension. The scoped handles use them for the check sugar
  (`error()`, `setError()`). A kind that does not set it contributes no names. This is a new member of the typing
  model, and the names are still written by hand (decision 2).
- **Assignable to `HandlesApi`.** `addressFields(form.scope('billing'))` still compiles for a form with an
  extension, so a function written once for a fragment works at any mount point.

## React adapter

- **What exists** (`spike/src/react/create-parts.tsx`). `createParts(form, elements)` returns `Root`, one component per
  part, and the hooks `useForm`, `useSelector`, `useField`, `useArrayField` and `useScope`. It knows no behavior: a
  part runs the form's slot (`present`, `state`, `attrs`), turns `on` into React props, and runs `bind` in a ref.
  Tests are `spike/src/react/parts.spec.tsx` and run in Chromium with `vite.react.config.ts`: typing and `data-dirty`,
  submit and field issues (`aria-invalid`, `role="alert"`), `onSubmit`, hooks, an existing instance, strict mode, and
  a server render.
- **Core bug found: unstable store state** (`spike/src/context.ts`, `spike/src/status.ts`). After the last
  subscriber leaves, the derived store computes again on the next read and returned a new state object and a new
  `status` wrapper. React strict mode subscribes, unsubscribes and subscribes again, so `useSyncExternalStore` saw a
  changed snapshot after every commit and failed with "Maximum update depth exceeded". Fixed: an unchanged result keeps
  its reference. Regression test in `derived-status.spec.ts`. This is what any adapter needs from the store: a
  snapshot that is stable until something changes.
- **Gaps** are listed in the next section: `usePart` and parts inside a scope are not built.
- **`FormHooks` in `api.ts`** now uses function properties, so the hooks can be destructured without an
  unbound-method lint warning.

## React adapter against vercel-labs/ui

Compared `spike/src/react/create-parts.tsx` with `vercel-labs/ui` (`packages/react/src/use-primitive.tsx`,
`render-element.ts`, `.agents/experts/react/*`). Fixed, with tests in `spike/src/react/parts.spec.tsx` (14, in Chromium) and `spike/src/adapter-controls.spec.ts`:

- **Events are native listeners.** The adapter attaches the slot's `on` events to the element in its ref callback,
  so there is no table of React prop names (React spells them inconsistently, such as `dblclick` and
  `onDoubleClick`), and any DOM event a slot names works. The slot runs before React's own handlers. So
  `preventDefault()` in a slot already shows on React's event, for a router link or a parent handler. The author's
  React handlers (`onChange`) still run, after the slot's. Authors cannot cancel a slot's handler. A controlled
  `<input value>` raises no React warning (tested).
- **Store reads follow TanStack's `useSelector`.** Each part selects what it shows (`present`, `state`, `attrs`) from
  the store state, and re-renders only when that changes by value. `useField` selects the value and the status of its
  path with `shallow`. A part does not re-render for another field's change (tested with `Profiler`).
- **Options follow the props.** `Root` hands its options to the instance in a layout effect on each render, like
  today's `~update`. This needs `adapterControlsOf(instance)` in `form.ts`, a module-private channel like the other
  internals, with `setOptions` (merged with the configured options and fragments) and `unmount`.
- **Lifecycle.** Unmounting runs the cleanups of work in progress and leaves the instance usable, so strict mode,
  Suspense and Activity need no rebuild, and a discarded instance holds nothing. `destroy` is for good and the
  adapter does not call it.
- **Prop precedence and refs.** The form's attrs win over the author's props. A user `id` on a part is therefore
  ignored, and the field's `aria-describedby` cannot dangle. The author's `ref` is merged with `bind`, and the
  field's `bind` returns a cleanup that calls `unregister`. `ref` is typed through `ComponentPropsWithRef`.
- **`render`.** A part takes `render` as an element or a function of `(props, state)`, the only way to render
  another element. The element's own ref is merged.
- **`'use client'`** on the adapter module. **`useSelector`** takes an optional `compare`.

Not copied from vercel-labs/ui on purpose: preview and commit-time machinery, effect-based subscriptions, the
`FinalizationRegistry` sweeper and Proxy read tracking. Parts read through `useSyncExternalStore`, so an update
cannot join a transition, as in today's `packages/react`.

Open: a `provided` form that changes after mount.

## Parts inside a scope

- **Design.** A part takes an optional `scope` (handles from `useScope` or `form.scope`). The scoped handles carry
  their prefix under a symbol (`spike/src/handles.ts`, `prefixOf`), which survives the spread that field extras
  do. The adapter joins it with each `'key'` prop (`create-parts.tsx`), so slots, ids, errors and status all keep
  working on full keys.
- **Types** (`api.ts`, `PartComponent`). Two signatures on one interface: the form's own values without a
  `scope`, and `<Scoped>` inferred from `scope` with names typed by `PartsOf<Kind, Scoped>`. `type-tests/composition.tsx`
  checks relative names, a wrong name, a full path inside a scope, and a scope of the wrong shape. No TS2589 here.
- **Runtime.** Chromium tests: two scopes in one form with issues for the second only and unique ids, nested
  scopes beside a full name, and array items swapped with `key={id}` keeping the same element, its focus and its
  value.
- **Hooks.** `useField(path, { scope })`, `useArrayField` and `useScope` take a scope, typed by its values, and read and
  subscribe to the full path (`create-parts.tsx`). `useScope` with a scope opens a scope inside it.
- **Open.** A `scope` forgotten on a part whose name also
  exists on the form compiles and writes to the form's field. A reusable block for several forms must be passed
  `Field` and `FieldError`, since they belong to one form's `createParts`.

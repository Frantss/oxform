# Behavior-based API spike: results

Status: the design is adopted and the next step is the migration. This records what the spike showed, the
decisions made along the way, and what is still open. Spike code is in `spike/`, findings
are in [reports/behavior-api-spike.md](../../reports/behavior-api-spike.md), and the tickets are in
[tickets/](./tickets/readme.md).

## Decisions made

1. **Check state is read through a public path (option A).** `validation` gets `issues(path?)`, `checks` and
   `validating`, and a check gets `validates(event)` and `clear(path?)`. Status, events, arrays, reset and
   submit read checks only through these. Check registration stays implicit and is the one hidden link left.
2. **Check names stay hand-written.** Every composition states `'error'` or `'error' | 'warning'`. This is the
   easiest approach. The remaining hole: a declared name that no `createCheck` registers is typed but missing
   at runtime. Documentation must say so.
3. **Internal members stay internal.** Status writes (`mark`, `setForm`, `reset`, `remap`, `generation`), the
   events `ref` and `clearRefs`, and the arrays `ids` are not on `StatusApi`, `EventsApi` or `ArraysApi`. Kernel
   behaviors reach them through module-private channels (`statusInternals`, `eventsInternals`,
   `arraysInternals`). Other signature gaps were fixed in `api.ts`: `values` for status, submit and handles,
   `status` for handles, and `events` for reset.
4. **Adapters were deferred until the core settled.** The React adapter is now in the spike (see "React adapter" in the report). Solid 1 and Solid 2 are still deferred.
5. **The root `schema` only sets the data shape.** It validates nothing. To validate on submit, pass a validator
   to the check (`error: { submit: schema }`). `createValidation` no longer requires a `schema` option, and the
   sketch comments that called the schema a submit fallback were corrected. This differs from today's library,
   which validates the root schema on submit by default, so the migration and codemod must add the explicit
   option.
6. **Check entries follow array items.** Issues move with `swap`, `move`, `prepend`, `insert` and `remove` (a
   removed item's issues are dropped, later items shift). The array-level issue stays in place. The remap is a
   kernel-internal channel (`checkInternals`), not public.
7. **Derived status lives in the store.** `state.status` holds the full derived `StatusState`: the form status
   and an entry for every node of the values, with `valid`, `default`, `pristine` and `validating` computed from
   the raw flags, the values and the check issues. The context builds its `store` as a derived store over the
   written slices, and a behavior registers a derivation through a kernel-internal channel
   (`contextInternals(ctx).derive`). Each field's status object is reused while its flags are unchanged, so a
   selector on one field sees a stable reference when another field changes. `validation` keeps a pending count
   in the state, so `validating` is reactive. `status.form` and `status.at()` read the same derived state.
8. **`fieldExtras(path, field)` is part of the extension input.** An extension implements the members it adds to
   every `form.field(path)` handle, and the kind's `fieldExtras` types them. `field` is the base handle, so the
   extras read its live `state` and call its methods. The extension must state a `field(path)` api in `Needs`.
   An extra cannot redefine a member of the base handle (it throws). The kind narrows the extras by the field
   value in the types, and at runtime the extension decides what it returns, so it must mirror the kind.
9. **Scoped handles carry the field extras.** `form.scope('billing').field('zip').mask(...)` works like the
   full-path handle, with the base handle, the check sugar and a live `state` kept. The path given to
   `fieldExtras` is relative to the scope. This holds at any depth of nested scopes, at runtime and in the types
   (`scope(a).scope(b).scope(c).field(...)` is typed). A scoped handle set is still assignable to a function written for `HandlesApi`. The
   kind states its check names (`checks: 'error'` on `StandardKind`, merged by `ExtendedKind`) so the scoped
   handles carry the check sugar.
10. **Parts take a `scope`.** `<Field scope={billing} name='zip' />` names the field relative to the scope
    (`billing` from `useScope('billing')` or `form.scope('billing')`), and the names are typed from the scope's
    values. The adapter joins the scope's prefix with each `'key'` prop, so slots are unchanged. Reordering array
    items keeps the element and its focus, since only the prop changes. Without a `scope`, names are paths of the
    form. The hooks take it too: `useField(path, { scope })`, `useArrayField` and `useScope` (which opens a scope
    inside a scope). A block written once is passed its scope, and reaches `Field` through the form's `createParts`.

## What the spike built

Kernel behaviors with runtime: context, change pipeline, values, validation, checks (`error`, `warning`),
status, events, reset, arrays, submit, handles, `defineForm`, `configureForm`, `extendForm`, `defineExtension`,
`defineSlots` with the slot groups (`fieldSlots`, `fieldErrorSlots`, `submitSlots`, `resetSlots`), fragments
(`defineFragment` and mounting in `configureForm`), `createEffect`, derived status in the store, field extras,
and a `standardForm` preset with its slots, typed by the proposal's `StandardKind`. 178 Vitest tests pass in
Node, 18 more pass in Chromium for the React adapter, and `tsc` passes on the spike and on `type-tests/`.

Built: the React adapter (`createParts` with `Root`, the part components and the hooks). Parts and hooks take a `scope` (decision 10). Not built: `usePart` and the Solid 1 and Solid 2 adapters.

## Acceptance checklist

| #   | Criterion                                                                   | Status                                 | Evidence                                                                                                                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1a  | Minimal form composes                                                       | Met, with a caveat                     | `spike/src/bundle/tier-values.ts` composes values only. Through `configureForm` a `schema` is still required (decision: schema stays in the core).                                                                                                                                  |
| 1b  | Dependencies are plain arguments                                            | Met, with two exceptions               | Check registration (implicit, as the proposal states) and the kernel-internal channels of decision 3 (`statusInternals`, `eventsInternals`, `arraysInternals`). Reads of check state go through the public `validation.checks` and `issues()` (`spike/src/public-surface.spec.ts`). |
| 1c  | Slots compose per form                                                      | Met (types and runtime)                | `type-tests/composition.tsx`, and `spike/src/slots.spec.ts` (a form keeps only the groups it spreads).                                                                                                                                                                              |
| 2a  | Extension applies where its needs are met                                   | Met (types and runtime)                | `spike/src/extension.spec.ts`: `withAutosave` applies to the preset, and `@ts-expect-error` rejects it on a form without `validation`.                                                                                                                                              |
| 2b  | Slot group reusable                                                         | Met (types and runtime)                | `spike/src/slots.spec.ts`: the same group spreads into two forms.                                                                                                                                                                                                                   |
| 2c  | Fragment reusable                                                           | Met (types and runtime)                | `spike/src/fragments.spec.ts`: one fragment mounted twice, and in another form. A part given a `scope` names its field relative to it (`spike/src/react/parts.spec.tsx`, `type-tests/composition.tsx`).                                                                             |
| 3a  | Add options, state, api, parts                                              | Met (types and runtime), parts as data | `spike/src/extension.spec.ts`: option, state slice, api and a slot. The React adapter renders the slot (`spike/src/react/parts.spec.tsx`).                                                                                                                                          |
| 3b  | Add members to every field handle                                           | Met (types and runtime)                | `spike/src/field-extras.spec.ts`: `mask` on string fields, typed by value, with the base handle and its live `state` kept. `type-tests/composition.tsx` checks the `fieldExtras` signature and the scoped extras (typed and working at three levels of scope).                      |
| 3c  | Hook into change, validation, submit                                        | **Met at runtime**                     | `values.intercept` with `cancel()`, `values.onChange`, `validation.onRun`, `submit.intercept`, `submit.onResult` (`extension-hooks.spec.ts`, `submit.spec.ts`).                                                                                                                     |
| 3d  | Wrap a base slot                                                            | Out of scope (decision)                | Unchanged.                                                                                                                                                                                                                                                                          |
| 4a  | `Values` from schema, all typed                                             | Met                                    | `type-tests/`, and the `@ts-expect-error` cases in `spike/src/form.spec.ts` against the real runtime.                                                                                                                                                                               |
| 4b  | Extensions change the types                                                 | Met                                    | `type-tests/`. `extendForm` api merge is typed in `spike/src/form.spec.ts`.                                                                                                                                                                                                         |
| 4c  | Kind cannot drift                                                           | Met for the preset                     | `spike/src/standard.ts` (`standardApi<Values>` annotated with `StandardApi`) and `spike/src/spike-form.ts` (negative case). Each kind author repeats the pattern.                                                                                                                   |
| 4d  | Check names come from checks                                                | **Not met (accepted, decision 2)**     | Every composition states `'error'` or `'error' \| 'warning'` by hand.                                                                                                                                                                                                               |
| 5a  | Separate exports, no side effects                                           | Met (spike)                            | Per-tier bundles in `spike/dist` drop unused behaviors.                                                                                                                                                                                                                             |
| 5b  | Values, status and events do not bundle validation, arrays, reset or preset | Met (spike)                            | `tier-status-events` has no `~standard` call, so `createValidation` is tree-shaken. `status.ts` reads checks through the public api and no longer imports the validation module.                                                                                                    |
| 5c  | Size budget for three tiers                                                 | Met for the spike                      | `spike/measure-bundles.ts` fails when a tier exceeds its budget. Not wired into CI (the spike is outside the workspace).                                                                                                                                                            |

## Bundle sizes (minified and gzipped, dependencies bundled)

| Entry                                                          | Minified | Gzip    | Budget (gzip) |
| -------------------------------------------------------------- | -------- | ------- | ------------- |
| Values only                                                    | 5.88 kB  | 2.33 kB | 2.5 kB        |
| Values, status, events                                         | 9.70 kB  | 3.73 kB | 4.05 kB       |
| Values, validation, one check, `defineForm`                    | 10.49 kB | 4.10 kB | 4.4 kB        |
| Same, plus fragments                                           | 11.38 kB | 4.39 kB | 4.7 kB        |
| Lean login (values, validation, check, status, events, submit) | 14.51 kB | 5.39 kB | 5.85 kB       |
| Full `standardForm` preset, with its slots                     | 19.99 kB | 7.08 kB | 7.7 kB        |
| Today's `@oxform/core`                                         | 24.83 kB | 8.09 kB | reported only |

- The full preset, now with slots and derived status, is about 12% smaller than today's core in gzip, and the
  lean login form about 33% smaller. The slots cost the preset about 0.5 kB gzip, and derived status about
  0.35 kB in every tier that includes status.
- Fragments are opt-in: a fragment carries its own mount logic, so `configureForm` does not import it. A first
  version put fragments inside `configureForm` and added about 0.4 kB gzip to every form. That broke principle 5
  and was fixed (`spike/src/fragments.ts`).
- The saving from opting out is modest above the lean tier: the lean login form is 1.7 kB gzip smaller than
  the full preset. The budget of the status tier was raised from 3.7 kB to 4.05 kB for derived status. `@tanstack/store` is about 1.7 kB gzip of every tier.
- Comparison limits: the spike's bundle tiers leave out the React adapter, and its path helpers are simpler than today's
  `remeda` use. Expect the new API to grow with the adapter.

## Open questions answered by the spike

1. **Kind authoring cost.** About 15 lines of type aliases for a one-check form (`spike/src/spike-form.ts`),
   plus the generic-`Values` conformance function. Acceptable for a preset. Every extension that touches
   `Values` pays it too. Not tested: an extension author's experience.
2. **Replacement rules.** `exclusive` kept both rules and worked. Not unified.
3. **Registration.** Implicit registration works with two checks. Reads no longer use it: they go through the
   public `validation.checks` and `issues()` (decision 1). Registration is the one remaining implicit link, and
   it is what lets an extension add a check.
4. **Check names in types.** A conformance test per kind catches drift of the api, not of names. The names stay
   hand-written in every composition (decision 2).
5. **Performance of derived status.** Measured with `events.change` followed by a read of `store.state.status`,
   200 changes per run, in Node: 20 fields 0.03 ms, 200 fields 0.19 ms, 1000 fields 1.09 ms per change. Writes
   alone cost 0.01 ms, because the derived state is computed lazily on read. The cost is linear in the number of
   fields: every change walks all paths and recomputes each field's status. The memoization is per path for
   object identity (subscribers see stable references), not a skipped recomputation. This is the same shape as
   today's derived store, which rebuilds every field entry per change, and I did not measure today's core. A
   recomputation limited to changed paths is possible later if a measured form needs it.

## Gaps found while implementing, and their status

- Fixed in `api.ts` (and the call sites in the sketches and `type-tests/`): `validation.issues`,
  `validation.checks`, `validation.validating`, `check.clear`, `check.validates`, `values` for
  `createFieldStatus`, `createSubmit` and `createHandles`, `status` for `createHandles`, `events` for
  `createReset`.
- Kept internal on purpose (decision 3): status writes, `ref`, `clearRefs`, `ids`.
- Fixed (decision 6): check entries follow array items.
- Decided (decision 5): the root `schema` only sets the data shape.
- Fixed (decision 7): derived status lives in the store, and the preset's `field` slot is correct on the real
  store (`spike/src/slots.spec.ts`, `spike/src/derived-status.spec.ts`).
- Fixed (decision 8): `fieldExtras(path, field)` gives extensions a runtime for field extras.
- Fixed (decision 10): parts and hooks take a `scope`. Open: a `scope` forgotten on a part whose name also exists on the form.
- Fixed (decision 9): scoped handles carry field extras at any depth, at runtime and in the types.
- Open: the derived status recomputes every path on each change. See open question 5 above.

## What remains for the migration

The spike showed that the kernel composes, the typing model holds against a real runtime, extension points work,
and the React adapter renders slots, scopes and arrays. Open items, none of which blocks the migration:

1. **Derived status cost.** It is linear in the number of fields (0.19 ms per change at 200 fields). Forms stay
   under 100 fields, so it stays as is. Revisit if a measured form needs it.
2. **Kind authoring cost.** Every extension that touches `Values` writes about 15 lines of kind types. The spike
   has no evidence from an extension author's side.
3. **Check names** are hand-written (decision 2), so a declared name that no `createCheck` registers is typed but
   missing at runtime. Documentation must say so.
4. **Migration work.** A codemod for the root `schema` change (decision 5), for `checks` to one option per check,
   and for `useForm(options)` to `configureForm`.
5. **Not built:** `usePart`, Solid 1 and Solid 2.
6. **Quirks.** A `scope` forgotten on a part whose name also exists on the form compiles and writes to the
   form's field.

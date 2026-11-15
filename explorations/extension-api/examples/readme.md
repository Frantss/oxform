# Examples

Examples of the extension API in [`../readme.md`](../readme.md). They are type-checked against the spike with
`tsc -p examples/tsconfig.json` (run from `explorations/extension-api`). They are not run. The types are in
`../spike/src/api.ts`. Each one ports the sketch with the same number in `../../behavior-api/`.

`@oxform/core` resolves to `../spike/src/index.ts`, `@oxform/core/standard` to `../spike/src/standard.ts` and
`@oxform/react` to `../spike/src/react/index.ts`. `ambient.d.ts` declares the application code and schemas the
examples call (`save`, `pay`, `weakPasswordSchema`, and so on). They are not part of the API.

| File                                                         | Shows                                                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [01-define-a-form.ts](./01-define-a-form.ts)                 | A kernel extension written in full (`values`, `check`), slot groups, and the `standard` preset            |
| [02-using-a-form.tsx](./02-using-a-form.tsx)                 | The quick start: `defineForm(...).extend(standard)`, parts, hooks and core-only use                       |
| [03-validation-and-checks.ts](./03-validation-and-checks.ts) | The error check, more levels with `.extend(check(...))`, a lean form and a minimal form                   |
| [04-arrays.tsx](./04-arrays.tsx)                             | Array mutations, stable ids and `useArrayField`                                                           |
| [05-status-reset-submit.tsx](./05-status-reset-submit.tsx)   | Status, the submit lifecycle and reset                                                                    |
| [06-custom-behaviors.ts](./06-custom-behaviors.ts)           | The extension authoring guide: autosave, masks, warnings, hooks only, a slot only, composition and errors |
| [07-runtimes-and-testing.tsx](./07-runtimes-and-testing.tsx) | The same form in core, in tests (an extension on the leanest form), React and Solid                       |
| [08-scopes.tsx](./08-scopes.tsx)                             | A scope defined once and placed twice, `form.scope(path)`, and scoped parts                               |

The playground kits (`../kit/`) are covered by 01 (lean form), 03 (lean form), and 06 (autosave, masks,
warnings). 06 follows the real kit code, including the `dirty` autosave state and the mask helpers.

## Names checked by the compiler

These names were assumptions when the sketches were written. `tsc` now checks them against the ported kernel:
`values`, `validation`, `check(name, { blocking?, exclusive? })`, `status`, `events`, `arrays`, `reset`, `submit`,
`handles` and `slots(...)`. `standard` is a preset (a function from form to form), not an extension.

## Spec mismatches

Where [`../readme.md`](../readme.md) and the implementation (`spike/src/api.ts`) disagree, the sketches follow the
implementation.

| Spec                                     | Implementation                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `fields: on<string>(field => ({ ... }))` | `fields: on<string>(guard)(builder)`: a curried call. The optional guard decides at runtime. The builder gets `(field, path)`. |
| `state: () => ({ ... })`                 | `state: options => ({ ... })`. The factory gets the merged options, so `values` reads `defaultValues`.                         |
| `Extendable<V, Needs>`                   | `Extendable<V, Provides, State>`: a third type states the state slices an extension needs.                                     |
| `standard` is an extension               | `standard` is a preset: `form.extend(preset)` is a second overload that takes a function from form to form.                    |
| No way to name the instance in an option | `Self` stands for the instance in an option's parameters: `option.action<(draft: V, form: Self) => unknown>()`.                |
| `defineForm({ schema, defaultValues })`  | Also takes `name`, `id` and `scopes`. Any other option is a default set with `.configure(options)`, or goes to `create`.       |
| No form-level defaults                   | `form.configure(options)`: typed by the extensions applied so far. `create(options)` and the props of `Root` override it.      |

## Gaps found while writing

- Option defaults: resolved by `form.configure(options)`. In 02, 03, 05, 07 and 08 the validators, `defaultStatus` and
  `onSubmit` that the old `configureForm` set are now `.configure(...)` after the last `.extend`.
- 07 tests an extension on the leanest form. The old sketch built a bare context with `createContext`. In the new
  model a context exists only inside a form, so a "behavior alone" test is a form with only `values`.
- `check` needs casts for computed keys (01). A literal-name overload, or a `defineCheck` helper, would remove them.

## Findings from type-checking

The kernel was not patched. Each item is something the examples needed or found awkward. Two missing exports were added
for the examples to import: the `createX` behaviors in `spike/src/index.ts`, and a new `spike/src/react/index.ts`.

1. **A generic-name extension needs three casts** (`01-define-a-form.ts:79-85`). `check(name)` builds its option, state
   and api under a computed key, which TypeScript widens to `{ [x: string]: ... }`, so each record is cast to
   `Record<Name, ...>`. A fixed name does not need them (`warnings` in `06-custom-behaviors.ts:132-136`, apart from a
   `{} as CheckState` for the empty slice). The real `check` in `spike/src/check.ts:116` pays the same cost. Why it
   matters: every extension named by a parameter repeats the pattern. A `defineCheck`-style helper or a keyed
   `defineExtension` overload would remove it.
2. **Slot groups still state their needs by hand** (`01-define-a-form.ts:92`). `defineSlots` takes
   `SlotFactory<{ events: EventsApi<any> }, { values: unknown; status: StatusState; error: CheckState }>`, and the
   api need uses `EventsApi<any>`. The `slots(...)` helper removes the wall for the form that uses a group, but each
   group's own declaration is a manual type that can drift from its body. Needs can be checked at the use site only.
3. **`usePart` does not accept the part's own props type** (`spike/src/api.ts:1010`, used in
   `02-using-a-form.tsx:52`). `usePart(form, slot, slotProps, props, tag)` takes `ComponentPropsWithoutRef<Tag>`, so a
   wrapper that forwards `PartProps<'select'>` fails: `children` may be a function of the part's state, and `render` is
   not part of the element's props. The example now forwards plain element props. Why it matters: a custom part cannot
   pass on `render` or a function child to the part it wraps, which the built-in parts accept.
4. **`@oxform/react` has no public entry.** `spike/src/react/create-parts.tsx` exports only `createParts` and
   `usePart`, and `PartProps` is a private, different type of the same name (`create-parts.tsx:44`). The public
   `PartProps` is declared in `api.ts:865`. The examples use a barrel, `spike/src/react/index.ts`, that re-exports it.
5. **`values.intercept` gives `change.path` as `string`** (`06-custom-behaviors.ts:119`). `masks` indexes its
   `{ [P in Path<V>]?: string }` option with `change.path as Path<V>`. A typed path on the change would remove the cast.
6. **A state factory that starts with `null` needs an assertion** (`06-custom-behaviors.ts:55`, `:136`). `savedAt: null`
   infers `null`, so the slice is cast to `AutosaveState`. An empty check slice is written `{} as CheckState`.
7. **`ambient.d.ts` is needed for application code.** The examples call `save`, `pay`, `analytics`, schema factories
   and the test globals. The API does not touch these. `vitest` resolves through a path alias in the tsconfig.

Nothing else needed a cast, an `any` or an `@ts-expect-error`. `Extendable<V, Needs<V, ...>>` in `06-custom-behaviors.ts`
is the declared dependency of an extension, as designed, and is not counted above.

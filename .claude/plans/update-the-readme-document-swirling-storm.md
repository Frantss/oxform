# Plan — Update READMEs to document all APIs

## Context

The current READMEs are stubs. The root [readme.md](readme.md) only describes
the project and lists install commands; the package readmes
([packages/core/readme.md](packages/core/readme.md),
[packages/react/readme.md](packages/react/readme.md)) are 10–14 lines each and
contain nothing beyond install. None of the public API surface — factory
functions, classes, hooks, components, options, status flags — is documented
anywhere a consumer can find it.

The user wants every public API documented, with API docs living in **each
package's own readme** (so npm/jsr listings render the relevant reference).
Per the user, WIP/unexported pieces (`defineForm`, `FormProvider`,
`useFormContext`) are explicitly out of scope — they are not in
[packages/react/export/index.ts](packages/react/export/index.ts) yet.

The deliverable is purely documentation — no source changes.

## Files modified

1. [readme.md](readme.md) — Root readme. Becomes a project-level entry
   point that pitches the library, points to the two package readmes, and
   links the existing `docs/` guides for contributors. No API reference here.
2. [packages/core/readme.md](packages/core/readme.md) — Full `oxform-core` API
   reference.
3. [packages/react/readme.md](packages/react/readme.md) — Full `oxform-react`
   API reference (the primary doc most users will read).

Files **not** modified: `docs/*`, source files, `package.json`s, exports.

## Root readme.md — outline

- **Headline + one-paragraph pitch** (keep current copy)
- **Key benefits** (keep current bullets)
- **Features** (keep current; expand briefly: sync/async validation, array
  fields, nested fields, framework-agnostic core, Standard Schema)
- **Packages** — table linking to the two package readmes:
  - [oxform-core](packages/core/readme.md) — framework-agnostic
  - [oxform-react](packages/react/readme.md) — React integration (start here)
- **Quick start** — minimal React snippet (8–12 lines) lifted from
  [examples/react/src/examples/basic.tsx](examples/react/src/examples/basic.tsx),
  pointing to the React readme for the full API.
- **Examples** — link to [examples/react](examples/react)
- **Contributing** — link to [AGENTS.md](AGENTS.md) and the `docs/` guides
  ([structure](docs/structure.md), [commands](docs/commands.md),
  [testing](docs/testing.md), [typescript](docs/typescript.md),
  [code-style](docs/code-style.md),
  [form-core-behaviors](docs/form-core-behaviors.md))
- **License** — MIT, link to [license.md](license.md)

## packages/core/readme.md — outline

Full API reference for everything exported from
[packages/core/export/index.ts](packages/core/export/index.ts).

- **Intro** — keep the existing "you probably want oxform-react" note.
- **Installation** (keep existing block).
- **Quick example** — small vanilla snippet: `formOptions` + `createForm` +
  `form.field.change` + `form.submit`.
- **API reference**, organized by category:
  - **Factory functions** — `createForm`, `createField`, `createArrayField`,
    `createEffect`, `formOptions`. Signatures + 1–2 line description each.
  - **`FormApi`** — getters (`id`, `store`, `status`, `values`, `options`,
    `field`, `array`), methods (`validate`, `reset`, `submit`).
    Internal/lifecycle methods (`~mount`, `~update`) called out under a
    dedicated subheading and clearly marked internal.
  - **`FormApi.field`** (`FormCoreField`) — `change`, `focus`, `blur`, `get`,
    `register`, `unregister`, `errors`, `setErrors`, `reset`, `status`. Brief
    behavior notes (e.g. updates ascendants, honors `should.*` options); link
    to [docs/form-core-behaviors.md](docs/form-core-behaviors.md) for the
    exhaustive spec instead of duplicating it.
  - **`FormApi.array`** (`FormCoreArray`) — `append`, `prepend`, `insert`,
    `swap`, `move`, `update`, `remove`, `replace`. Same approach.
  - **`FieldApi`** — every public method + getter (proxies to
    `FormApi.field`).
  - **`ArrayFieldApi`** — every public method + getter, plus `ids`.
  - **Options types** — `FormOptions`, `FieldOptions`, `ArrayFieldOptions`.
    Field-by-field shape table.
  - **Store types** — `FormStore`, `FieldStore`, `ArrayFieldStore`. Shape +
    when each property updates.
  - **Status types** — `FormStatus`, `FieldStatus`, `FieldState`. Table:
    flag → meaning → when it flips.
  - **Validation types** — `ValidationType`, `FormIssue` (Standard Schema
    issue), `ValidateOptions`.
  - **Event option types** — `FieldChangeOptions`, `FieldFocusOptions`,
    `FieldBlurOptions` (each has the `should.{validate,dirty,touch}` shape;
    document defaults).
  - **Reset option types** — `FormResetOptions`, `FormResetKeepOptions`,
    `FormResetFieldOptions`, `FieldResetKeepOptions`, `FieldResetStatus`.
  - **Error handling types** — `FormSubmitSuccessHandler`,
    `FormSubmitErrorHandler`, `FormErrorsOptions`, `FormSetErrorsOptions`,
    `FieldSetErrorsMode` (`replace` | `append` | `keep`).
  - **Plugin types** — `FieldPlugin`, `FieldExtra`, `FieldPluginsInput`,
    `FormWithOptions`. One-line each (advanced; mark as advanced).
  - **Type helpers** — `FormValues`, `FormFields`, `FormArrayFields`,
    `FormFieldValue`, `AnyFormApi`, `AnyFormLikeApi`, `FormLikeStore`,
    `ApiSelector`. One-line each.
  - **Misc** — `ArrayLike`, `EventLike`, `StandardSchema` re-export.
  - **Deep type utilities** (`#types/deep` re-export) — `DeepKeys`,
    `DeepValue`, `DeepKeysOfType`, `ArrayDeepKeys`, `DeepRecord`. One-line
    each, marked as low-level.

## packages/react/readme.md — outline

Full API reference for everything exported from
[packages/react/export/index.ts](packages/react/export/index.ts). This is the
doc most users will land on.

- **Intro** — one paragraph: React bindings on top of `oxform-core`.
- **Installation** (keep existing block).
- **Quick start** — full working snippet from
  [examples/react/src/examples/basic.tsx](examples/react/src/examples/basic.tsx):
  schema → `useForm` → `<Field>` → submit handler.
- **Common patterns** — short snippets (lifted from `examples/react/src/examples`):
  - Array fields with `<ArrayField>` (from
    [examples/react/src/examples/array.tsx](examples/react/src/examples/array.tsx))
  - Reactive submit button via `<Subscribe>` (from
    [examples/react/src/examples/async.tsx](examples/react/src/examples/async.tsx))
  - Side effects via `useFormEffect` (from
    [examples/react/src/examples/effect.tsx](examples/react/src/examples/effect.tsx))
  - Reading errors (from
    [examples/react/src/components/field-error.tsx](examples/react/src/components/field-error.tsx))
- **Hooks** — one section per hook, each with signature + parameters +
  return shape + a 5–8 line snippet:
  - `useForm(options)` → `UseFormReturn<Values>` (= `FormApi<Values>`)
  - `useField({ form, name })` → `UseFieldReturn<Value>` (`FieldApi` +
    `props: { value, ref, onChange, onBlur, onFocus }`)
  - `useFieldApi({ form, name })` → `UseFieldApiReturn` (raw `FieldApi`,
    no subscription) — explain when to use this vs `useField`
  - `useArrayField({ form, name })` → `UseArrayFieldReturn`
  - `useFormStatus({ form })` → `UseFormStatusReturn` (= `FormStatus`)
  - `useFormEffect(api, selector, fn)` → `void`
  - `useSubscribe(api, selector)` → `Selected`
- **Components** — one section per component, each with props table + child
  render-prop signature + snippet:
  - `<Field form name>{field => …}</Field>` — `FieldProps`
  - `<ArrayField form name>{array => …}</ArrayField>` — `ArrayFieldProps`
  - `<Subscribe api selector>{selected => …}</Subscribe>` — `SubscribeProps`
- **Re-exports from `oxform-core`** — `formOptions` and the full type list,
  with a "see [oxform-core](../core/readme.md) for details" pointer rather
  than re-documenting them.
- **TypeScript types** — `UseFormReturn`, `UseFieldReturn`, `UseFieldApiReturn`,
  `UseArrayFieldReturn`, `UseFormStatusReturn`, `UseFormStatusProps`,
  `FieldProps`, `ArrayFieldProps`, `SubscribeProps`. Definition + one-line
  meaning each.

## Conventions used in all three readmes

- File/symbol references use markdown links to the source path so readers
  can jump to definitions (e.g. [createForm](packages/core/src/form/create-form.ts)).
- Code blocks use ` ```typescript ` / ` ```tsx ` / ` ```bash `.
- Defaults and behaviors lifted from
  [docs/form-core-behaviors.md](docs/form-core-behaviors.md) — link to that
  doc as the canonical behavior spec rather than duplicating it.
- WIP/unexported (`defineForm`, `FormProvider`, `useFormContext`) is **not**
  mentioned — out of scope per user.
- `~`-prefixed methods (`~mount`, `~update`) are documented under "Internal
  / lifecycle" subheadings with a note that they are not for application code.

## Verification

1. **Read pass** — open each of the three readmes in a markdown preview and
   confirm formatting renders, all internal links resolve, and no
   placeholder text remains.
2. **Coverage check** — diff the symbol list in each readme against
   [packages/core/export/index.ts](packages/core/export/index.ts) and
   [packages/react/export/index.ts](packages/react/export/index.ts).
   Every exported name should appear under a heading in its package's readme.
   The three exceptions allowed (and explicitly noted): `defineForm`,
   `FormProvider`, `useFormContext` — none of which are in the export files.
3. **Snippet sanity** — every code snippet is copied verbatim from
   `examples/react/src/` or from a test in `packages/*/src/tests/`. Spot-check
   one snippet by running the relevant example with `bun --filter
examples/react dev` to confirm it still compiles.
4. **Format pass** — run `bun run fix:format` to apply the project's markdown
   formatter (oxfmt) to the three changed files.

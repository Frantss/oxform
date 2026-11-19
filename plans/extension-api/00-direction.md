# Direction: rebuild Oxform on the extension API

Status: complete, revision 4. Ready for implementation. This file is the source of truth for the plan. Every
other file in this folder must agree with it. When a file needs to differ, it records the difference in its
own "Deviations and decisions" section and does not change the direction silently.

Revision 4 applies the owner decisions 17 and 18 of 2026-11-15: every need is required, and the plan decides
every remaining choice. No question to the owner remains. Revision 3 applied the owner decisions 8 to 16.

Revision 2 changes the reference. Revision 1 was written against `explorations/behavior-api/`, which the
newer spike in `explorations/extension-api/` replaces. Names such as `FormKind`, `extendForm`,
`configureForm`, `defineFragment`, `fieldExtras` and `standardForm` are **not** part of the target API.

## Goal

Rebuild Oxform as a library where a form is an ordered chain of extensions, each one a packaged behavior,
rendered by thin framework adapters. The release is a breaking change. No compatibility layer ships.

## Starting point

- **The reference is `explorations/extension-api/`**: [readme.md](../../explorations/extension-api/readme.md)
  (the design, rules, decisions, bundle sizes), `spike/src/` (runtime and `api.ts` types), `type-tests/`,
  `examples/` (eight type-checked sketches and their findings) and `kit/` (autosave, masks, warnings, lean
  form).
- `explorations/behavior-api/` is history. Use it only for material that the newer spike did not restate:
  the server rendering rules and the option kinds in
  [proposal.md](../../explorations/behavior-api/proposal.md), the decisions in
  [spike-results.md](../../explorations/behavior-api/spike-results.md), and the ten playground forms. Where
  the two disagree, the newer spike wins.
- A spike is a **reference**, not a code base. We do not move, update or migrate spike files or today's
  `packages/*` source. Every package, test, example and document is written new, to production standards.
- Today's packages (`@oxform/core` 0.6.0, `@oxform/react`, `@oxform/solid`) stay in git history. They are the
  "before" side of the migration guide and the source of behavior scenarios in
  [form-core-behaviors.md](../../docs/form-core-behaviors.md).

## Principles

Each decision in the plan is checked against these five principles. The documentation teaches them with the
same names and in the same order.

1. **Composable.** A form is a chain of extensions. The chain is assembled per use case.
2. **Reusable.** An extension, a preset, a slot group and a scope can each be packaged and used in another
   form.
3. **Extensible.** A user adds options, state, api, slots and field members with no engine change.
4. **Type-safe.** `Values` comes from the schema. Every type is inferred from the chain. Nothing is
   hand-written to keep types and runtime in step.
5. **Lightweight.** A form pays only for the extensions in its chain. Tree-shaking is verified in CI. Size is
   measured and published, and has no limit.

The design is inspired by [UI SDK](https://ui-sdk.dev/): a `define*` primitive with `name`, `options`,
`state`, `api` and `slots`, behaviors that are plain functions of `(ctx, deps)`, and slots that an adapter
renders.

## The model in one example

```ts
const profileForm = defineForm({ schema, defaultValues }) // fixes Values
  .extend(standard) //   a preset: a function from form to form
  .extend(autosave) //   an extension: needs `values` and `validation`
  .configure({ saveDraft }); // typed defaults for every instance

const form = profileForm.create(); // an instance, in any runtime
const { Root, Field, useField } = createParts(profileForm); // an adapter
```

## Glossary

Use these words, with these meanings, in code, tests and documentation. Do not use a synonym.

| Term           | Meaning                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Form           | The immutable result of `defineForm`, `.extend` or `.configure`. Safe at module scope. Not an instance.                       |
| Instance       | One live form from `form.create()`: api, `store`, `id`, `destroy()`.                                                          |
| Extension      | One object from `defineExtension`: `name`, `options`, `state`, `api`, `slots`, `fields`.                                      |
| Needs          | What an extension or slot group requires from the form so far. Stated in `Extendable` and in `needs`. Every need is required. |
| Behavior       | The concern that a built-in extension implements: values, validation, status, ... Not a public function.                      |
| Preset         | A function from form to form that applies several extensions. `standard` is the first preset.                                 |
| Option         | An input of a form, declared with an `option.*` descriptor.                                                                   |
| Check          | A named set of issues by path, added by the `check(name)` extension. `error` is one check.                                    |
| Slot           | The framework-neutral description of one rendered piece. A slot never names a framework component.                            |
| Slot group     | A reusable set of slots made by `defineSlots`.                                                                                |
| Part           | What an adapter renders from a slot: a component or a hook result.                                                            |
| Scope          | A sub-object. `defineScope` describes one without a path, and `scope(path)` on an instance views one.                         |
| Handle         | The object from `field(path)` or `array(path)` on an instance.                                                                |
| Field members  | Members an extension adds to field handles through `fields` and `on<T>`.                                                      |
| Adapter        | A framework package that turns a form into parts and adapter hooks.                                                           |
| Extension hook | A subscription point of a built-in api: `values.intercept`, `values.onChange`, `validation.onRun`, ...                        |
| Adapter hook   | A function from `createParts` that reads a form inside a component: `useField`, `useSelector`, ...                            |
| Kernel         | Contributor-only word for the code behind `@oxform/core` (main APIs). Not used in public documentation.                       |

Words that are not used: "fragment" (now scope), "kind", "field extras" (now field members), "definition"
and "configured form" (now form), "pipe" and "stage". "Primitive" is UI SDK's word and appears only where
the text describes UI SDK. "Extension API" is the name of the whole model. "Behavior API" was the first
spike's name and is not used in new material.

## Packages and entry points

| Entry point              | Category           | Contents                                                                    |
| ------------------------ | ------------------ | --------------------------------------------------------------------------- |
| `@oxform/core`           | Main APIs          | Define a form, an extension, a slot group and a scope. Options. The types.  |
| `@oxform/core/behaviors` | Built-in behaviors | The built-in extensions, the slot groups, the api types                     |
| `@oxform/core/presets`   | Form presets       | `standard`                                                                  |
| `@oxform/core/adapter`   | Adapter authors    | What an adapter reads from a form. Not for application code.                |
| `@oxform/react`          | Adapter            | `createParts`, `usePart` and their types                                    |
| `@oxform/solid`          | Adapter (Solid 1)  | The same adapter surface for Solid 1                                        |
| `@oxform/solid/v2`       | Adapter (Solid 2)  | The same adapter surface for Solid 2. A runtime split, not an API category. |

Rules:

- The entry point tells the reader the category. An import line shows whether code uses a main API, a
  built-in behavior or a preset.
- `@oxform/core/behaviors` exports each built-in behavior as an extension (`values`), with its api types. The
  function behind an extension is internal. A user never calls it. A custom extension uses a built-in behavior
  through its api: it states the behavior in `Needs` and in `needs`, reads it from `deps`, and subscribes to
  its extension hooks.
- `@oxform/core/adapter` is the fourth core entry point, for adapter authors only. `01-public-api.md` owns
  its contents.
- Runtime imports go one way: presets → behaviors → main. The adapter entry point imports from main only. Type-only imports may cross (`Needs` and
  `BuiltInApis` in the main entry point refer to the api types of the behaviors).
- A preset has no private access. It uses only what `@oxform/core` and `@oxform/core/behaviors` export. A test enforces it.
- The core entry points are one package, because kernel-internal channels (listed in `01-public-api.md`,
  section 5) need one module instance. The build must emit shared chunks so that no module is duplicated
  between entry points.
- The packages are ESM only.
- An adapter has one entry point. It does not re-export core. `@oxform/core` is a peer dependency of each
  adapter, so an application has one copy of the core. This is a change: today core is a dependency of the
  adapters, and `@oxform/react` re-exports core types.
- Only the extensions that `standard` applies ship. Autosave, masks and warnings from `kit/` become
  documented examples (YAGNI). The lean form is a documented example too.

Rejected:

- One entry point per behavior (`@oxform/core/values`, ...). Tree-shaking already removes what a chain does
  not import (readme, "Bundle sizes → Findings"), and ten more entry points add packaging and documentation
  cost.
- Separate packages (`@oxform/behaviors`, `@oxform/presets`). The internal channels would become a public
  contract between packages, and versions could drift.
- One flat `@oxform/core` entry point, as in `spike/src/index.ts`. It hides the three categories that the
  owner asked to be visible.

### Canonical public names

These names are fixed for all plan files. They come from `explorations/extension-api/spike/src/index.ts` and
`spike/src/api.ts`, with the approved renames applied. [01-public-api.md](./01-public-api.md) owns the
signatures, places every type that this list does not name, and keeps the record of the renames (spike name
to name), so that a reader of the spike can map the names.

`@oxform/core` (main APIs):

- Functions and values: `defineForm`, `defineExtension`, `defineSlots`, `slots`, `defineScope`, `optionTypes`,
  `on`, `createEffect`, `get`, `idPart`.
- Form members: `form.name`, `form.extend(extensionOrPreset)`, `form.configure(options)`,
  `form.create(options?)`.
  (`scope(path)`, `field(path)` and `array(path)` are instance members that the `handles` extension adds.)
- Form types: `Form`, `AnyForm`, `Instance`, `Extension`, `Extendable`, `Needs`, `BuiltInApis`, `Self`,
  `FormContext`, `StateSlice`, `BaseOptions`, `OptionTypes`, `FieldMembers`, `FieldOf`,
  `ElementTag`.
- Read-back types: `ValuesOf`, `ApiOf`, `StateOf`, `OptionsOf`, `PartsOf`, `FieldsOf`, `InstanceOf`.
- Scope types: `Scope`, `ScopeDefinition`, `ScopedValues`.
- Slot and part types: `Slot`, `SlotFactory`, `SlotDefinition`, `SlotRecord`, `PartSpec`, `PartHandle`,
  `PartEventContext`, `PartDomProps`, `PropKind`, `PropsOf`, `KeyProp`, `Attributes`.
- Path and utility types: `Path`, `PathValue`, `ObjectPath`, `ArrayPath`, `ArrayItem`, `ArrayValue`,
  `Updater`, `MaybePromise`, `Unsubscribe`, `DeepPartial`.

`@oxform/core/behaviors` (built-in behaviors):

- Extensions, in the order `standard` applies them: `values`, `validation`, `check(name, options)`,
  `status`, `events`, `arrays`, `reset`, `submit`, `handles`.
- Slot groups: `rootSlots`, `fieldSlots`, `fieldErrorSlots`, `submitSlots`, `resetSlots`.
- Types: `ChangeApi`, `ValuesApi`, `ValidationApi`, `CheckApi`, `StatusApi`, `EventsApi`, `ArraysApi`,
  `ResetApi`, `SubmitApi`, and the types these use (`FieldHandle`, `ArrayHandle`, `FieldState`,
  `FieldStatus`, `FormStatus`, `StatusState`, `CheckState`, `CheckEntry`, `CheckOptions`, `CheckSugar`,
  `CheckValidators`, `ValidationEvent`, `ValidationRun`, `IssuesByCheck`, `Change`, `ChangeDetails`, ...).

`@oxform/core/presets` (form presets):

- `standard`.

Adapters (`@oxform/react`, `@oxform/solid`, `@oxform/solid/v2`):

- `createParts(form, elements?)` (returns the part components, `Root`, `useForm`, `useSelector`, `useField`,
  `useArray`, `useScope`) and `usePart`, with their types. A part is scoped with its `scope` prop only.

### Design items

Every item is decided. Each keeps its number, because other files cite the numbers. `01-public-api.md` holds
each decision, and `06-roadmap.md` (decision register) holds who decided and why.

1. **Renames for a cohesive API** (owner request). Decided: the rename table is approved and applied (owner
   decision 10). An extension, its api type and its instance member share one word.
2. **What adapters import from core.** Decided: the entry point `@oxform/core/adapter` (owner decision 8).
   The spike's React adapter reads `slotsOf`, `adapterControlsOf`, `prefixOf`, `form.optionKinds` and path
   helpers from core source.
3. **Framework-neutral `ElementTag`.** Decided: `keyof HTMLElementTagNameMap` in core (`01`, 7.3). `api.ts`
   takes it from React's `JSX.IntrinsicElements`, but core slot types use it.
4. **Not built in the spike:** the Solid 1 and Solid 2 adapters, and a replacement for `useFormEffect`.
   Decided: `01`, 6.3 specifies the Solid adapters, and no adapter exports a `useFormEffect` (`01`, 7.4).
5. **Findings of the type-checked examples** (`examples/readme.md`, "Findings"): casts in a named extension
   such as `check(name)`, hand-written needs of slot groups, `usePart` props, state factories that start with
   `null`. Decided in `01`, 7.5.
6. **Risks named in the readme**: `on<T>` limits, the error message when `.extend` rejects an extension, a
   check extended after `handles` has no sugar. Decided in `01`, 7.6.
7. **Gaps against 0.x** found by the migration guide: root-only (pathless) issues, options of a live
   instance without an adapter, ids of an instance created without an adapter, an "any form" type pattern.
   Decided in `01`, 7.7.
8. **Who calls a `createX` function.** Decided: nobody outside the package. The functions are not exported
   (owner decision 13).
9. **Slot groups for a lean form.** Decided: every need is required (owner decision 17), and each built-in
   group needs exactly what it uses (owner decision 14). `rootSlots` needs `submit`, `resetSlots` needs
   `reset`, `fieldSlots` needs no check, and `fieldErrorSlots` gives the `field` part with error links. A
   form with no `submit` spreads no root group, and its `Root` renders no element (`01`, 3.2).
10. **Check names outside field sugar.** `form.validation` and `onInvalid` are typed with `string` check
    names in the spike, so a misspelled name compiles. Decided: type them from the chain, with a stated limit
    as the fallback (`01`, 9, G4).

## Settled decisions

Plan files apply these and do not reopen them.

From the extension API spike:

- One primitive, `defineExtension(form, definition)`, with inferred types. No hand-written kind.
- `defineForm({ schema, defaultValues })` fixes `Values` first. It also takes `name`, `id` and `scopes`.
- `.extend` runs in call order, and hooks run in that order. A duplicate option name throws at `.extend`. A
  duplicate api key or state key throws at `create`.
- Every need is required (owner decision 17). A missing need is a type error at `.extend` or at the spread of
  a slot group, and a runtime error at `create` that names the extension or group and the need. A form with a
  missing need never produces an instance. `01-public-api.md`, 3.1, says why the runtime check is at `create`.
- A form is immutable. `.extend` and `.configure` return a new form.
- A preset is a function from form to form, applied with `.extend`.
- Option precedence is `create` over `configure` over `defineForm`.
- A slot with the key of an earlier slot replaces it. There is no slot wrapping.
- For the field sugar (`field.error()`, `field.setError()`), check names are read from the chain in the
  types and from `validation.checks` at runtime. `handles` goes after the checks whose sugar it must carry.
- A scope is the only term for a sub-object, and `form.scope(path)` is the only accessor. The six scope
  conflict rules in the readme apply.
- Inside the package, a behavior stays a plain function `createX(ctx, deps)` with a thin extension wrapper.
  Only the extension is public.

Carried from the first spike:

- A `schema` only types `Values`. Nothing validates with it. Validation on submit needs
  `error: { submit: schema }`.
- Internal members stay internal and are reached through module-private channels.
- Derived status lives in the store. Its cost is linear in the number of fields and is accepted.
- Check entries follow array items.
- Forms are shared. Instances are per render or per request. `api` is inert at creation, on the server too.
- The form id comes from the adapter, not from the kernel. Field ids are derived from it.

## Quality bar

- **Unit tests**: every behavior function, every built-in extension and every main API, in Node with no
  `window`, with enforced coverage. This is a change: today's core tests run in a browser.
- **Integration tests**: the critical flows only. The `standard` preset end to end, validation lanes and
  races, custom extensions on a form, scopes, server rendering and hydration, and each adapter in a real
  browser.
- **Type tests**: every public export of every entry point has positive and negative type cases.
- **Tree-shaking checks**: the tiers of the extension API spike (real forms built with `.extend`), built from
  the published entry points, fail CI when a tier contains an extension that its chain does not import.
- **Size report**: a script measures each tier and reports the sizes. It has no budget and fails no check.
  The documentation publishes the numbers.
- **Packaging checks**: `publint`, `attw` for ESM only, and a check that the entry points share modules.

## Documentation direction

Two audiences, with one source:

- **Public documentation** (`apps/docs`): explains the five principles and the UI SDK inspiration, puts the
  main public APIs first, and teaches by examples of composing and extending forms.
- **Examples are chosen, not copied** (owner rule). The spike's examples and kit show that the API works.
  They are not the examples to publish. Each feature gets one representative example that solves a real
  problem in a simplified way: the reader sees why the feature exists, and nothing in the example is there
  only to exercise the API. `04-documentation.md` owns the list: for each feature, the real problem, the
  example, and why it is representative. `examples/*` and the migration guide follow the same list.
- **Agent-first documentation**: every page is usable by a coding agent without the site. That means
  machine-readable indexes, a plain Markdown form of each page, complete and type-checked snippets with
  imports, and one page per task with a predictable shape.
- **Migration guide**: one small page written for an agent that upgrades a 0.x code base. It is a mapping
  table, an ordered procedure and a verification step.
- **Comparison**: one page compares Oxform with TanStack Form, React Hook Form and Formisch, in features and
  capabilities, as a static table. [07-comparison.md](./07-comparison.md) owns its method and content rules.
- **Contributor documentation** (`docs/*.md`, `AGENTS.md`, package readmes) is rewritten for the new
  structure. Each fact stays in one place.

## Plan files and ownership

Each fact has one owner. Other files link to it and do not restate it.

| File                                             | Owns                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [00-direction.md](./00-direction.md)             | Goal, principles, glossary, entry points, canonical names, settled decisions       |
| [01-public-api.md](./01-public-api.md)           | The export inventory and signatures per entry point, adapter surface, design items |
| [02-structure.md](./02-structure.md)             | Workspace, folders, source layout, build, package manifests, tooling, CI           |
| [03-testing.md](./03-testing.md)                 | Test layers, file conventions, coverage, type tests, bundle checks, test inventory |
| [04-documentation.md](./04-documentation.md)     | Example catalogue, public docs site map, page templates, agent-first delivery      |
| [05-migration-guide.md](./05-migration-guide.md) | The draft of the agent-focused migration guide itself                              |
| [06-roadmap.md](./06-roadmap.md)                 | Phases, work packages, order, exit criteria, risks, the decision register          |
| [07-comparison.md](./07-comparison.md)           | The comparison with other form libraries: method, fairness rules, features         |
| [08-tickets.md](./08-tickets.md)                 | The ticket list and the map from each ticket to its work package                   |

## Owner decisions

Decided by the owner on 2026-11-14.

1. **Module format.** ESM only. No CJS output and no `require` condition.
2. **Version line.** The release is `0.7.0` for every published package.
3. **Renames.** `01-public-api.md` holds one rename table that makes the API cohesive (design item 1). The
   owner approved it in decision 10.
4. **Shipped extensions.** The behaviors of the standard form ship as built-in extensions. No other
   extension ships.
5. **Solid entry points.** `@oxform/solid` and `@oxform/solid/v2`, as today.

Decided by this plan. Owner decision 18 makes them final:

6. **No codemod.** An agent-focused migration guide replaces the codemod that the first spike's documents
   list.
7. **Built-in extensions live in `@oxform/core/behaviors`**, not in an entry point of their own.

Decided by the owner on 2026-11-15.

8. **`@oxform/core/adapter`** is the fourth core entry point, for adapter authors only.
9. **Reference.** The reference is `explorations/extension-api/`.
10. **Renames.** The rename table of `01-public-api.md` is approved and applied in every plan file.
    `01-public-api.md`, section 7.1, keeps the record.
11. **Rebuild approach.** A long-lived integration branch, as `06-roadmap.md` describes.
12. **No size budgets.** No size limit exists, and no size check is in CI or in the definition of done. A
    script measures and reports sizes. The tree-shaking checks stay: they verify the Lightweight principle
    without a size number.
13. **Behavior functions are not public.** `@oxform/core/behaviors` exports the built-in extensions, the slot
    groups and the api types only. A custom extension uses a built-in behavior through its api (`Needs`,
    `deps`) and its extension hooks.
14. **Built-in slot groups work on a lean chain.** A lean form writes no slot by hand that a built-in group can
    provide. Each built-in group needs exactly what it uses (`01-public-api.md`, 3.2). Decision 17 replaces the
    first form of this decision, which made `reset` and the `error` state optional needs.
15. **Scoped parts.** A part is scoped with its `scope` prop only. `createParts` returns no `within`. The
    adapter hooks keep their `{ scope }` option.
16. **Comparison.** The documentation compares Oxform with TanStack Form, React Hook Form and Formisch, in
    features and capabilities, as a static table. `07-comparison.md` owns the design of the comparison. Decision
    19 replaces the first form of this decision, which also compared sizes.
17. **Needs are hard requirements.** The owner's words: "no hand work means that dependencies are hard
    requirement, if a behavior/extension needs another and it is missing the form config should fail". Every
    extension, every built-in slot group and the preset state their needs, and every need is required. No
    need is optional. Built-in pieces are split so that each needs what it uses, and the user still writes no
    slot or code that a built-in piece provides (`01-public-api.md`, 3.1 and 3.2).
18. **Finish the plan.** The owner's words: "finish the plan, do not ask me for anything else". The plan
    decides every remaining choice with its recorded default, or with the simplest option that fits the
    direction. `06-roadmap.md`, decision register, records each one, who decided it and why.

Decided by the owner on 2026-11-18.

19. **The comparison is a static table.** The owner's words: "comparison was meant to be a static table
    comparison of features and capabilities". The comparison workspace, its form versions and the size method
    are removed. Only the feature data stays, now in `apps/docs/data/comparison-features.json`.

Decided by the owner on 2026-11-16, recorded on 2026-11-18 (commit `7ae20db`).

20. **Only behavior tests and type tests.** The owner deleted the package and build tests (the module-sharing
    spec, the consumer and tree-shaking checks, the bundle fixtures and the size report), the test meta-checks
    (test structure, test duplicates, the 100% per-file coverage gate) and the cases that pin implementation
    details. `publint`, `attw`, the type coverage check and the parity check stay. The definition of done in
    `06-roadmap.md` marks the items that this decision removes.

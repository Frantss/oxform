# Public API: exports, contracts and adapter surface

Status: complete, revision 4 (based on `explorations/extension-api/`, with the owner decisions of 2026-11-15). This file specifies the target public
surface of the rewrite. It is not a diff of the spike. It follows [00-direction.md](./00-direction.md) for the
glossary, the entry points, the canonical names and the settled decisions, and does not restate them. Folder
layout is in [02-structure.md](./02-structure.md), tests in [03-testing.md](./03-testing.md), the docs site
and the published examples in [04-documentation.md](./04-documentation.md), and the migration steps in
[05-migration-guide.md](./05-migration-guide.md).

Evidence paths are short. `api.ts` is `explorations/extension-api/spike/src/api.ts`. `spike/` is
`explorations/extension-api/spike/src/`. `readme` is `explorations/extension-api/readme.md`. `examples/` and
`type-tests/` are folders of `explorations/extension-api/`. `old/` is `explorations/behavior-api/`.

Spike status codes: **B** built and tested, **T** typed only, **N** not built, **C** the target differs from
the spike (the row or a later section says how).

## 1. Rules for the surface

1. Each export has one home. No entry point re-exports a name of another entry point. The spike's one flat
   entry (`spike/index.ts:3`, `export type * from './api'`) also exports the React types from core. The
   target does not.
2. A type goes where its owner is: form, extension, option, scope, slot and path types in `@oxform/core`; a
   type that describes one behavior's api, options or state in `@oxform/core/behaviors`. A main signature may
   refer to a behaviors type (type-only, as the direction allows).
3. A helper that `api.ts` does not export stays private: `PropType`, `SlotPropsOf`, `ReplaceSelf`,
   `MembersFor`, `WithFieldMembers`, `ForbiddenScopeKey`, the brand symbols, `DefaultElementOf`, `ElementOf`,
   `PartNames`, `PartPropsOf`, `PartStateOf` (`api.ts:57`, `:81`, `:225`, `:440`, `:454`, `:486`, `:873-904`).
4. Core types need the DOM library (`HTMLElement`, `HTMLElementEventMap`, `Event`: `api.ts:115`, `:135`,
   `:567`). Core runtime needs no DOM.
5. The path types are owned by the new core. `api.ts:26` imports them from today's `packages/core`.

## 2. `@oxform/core` (main APIs)

### 2.1 Functions and values

| Export            | Role                                                | Signature                                                                                       | Spike |
| ----------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----- |
| `defineForm`      | Makes an empty form and fixes `Values`              | `defineForm({ schema, defaultValues, name?, id?, scopes? })` (`api.ts:475`, `:489`)             | B     |
| `defineExtension` | Defines one extension as one object, types inferred | `defineExtension(form, { name, needs, options?, state?, api, slots?, fields? })` (`api.ts:333`) | B, C  |
| `defineSlots`     | Makes a slot group with stated needs                | `defineSlots({ name, needs }, build)` (`api.ts:170`)                                            | B, C  |
| `slots`           | An extension that only adds slots                   | `slots(build)` (`api.ts:183`)                                                                   | B     |
| `defineScope`     | Describes a sub-object without a path               | `defineScope({ schema, defaultValues, checks? })` (`api.ts:509`)                                | B     |
| `optionTypes`     | The options of an extension, as one type            | `optionTypes<{ limit: number }>()`. Nothing at runtime (D34)                                    | B     |
| `on`              | Field members for fields whose value extends a type | `on<T>(guard?)(build)` (`api.ts:311`)                                                           | B     |
| `createEffect`    | Subscribes a selector on an instance                | `createEffect(instance, selector, effect)` (`api.ts:837`)                                       | B     |
| `get`             | Reads a dotted path from plain state, in slots      | `get(value, path)` (`api.ts:844`)                                                               | B     |
| `idPart`          | Makes a path safe for an element id                 | `idPart(key)` (`api.ts:845`)                                                                    | B     |

Form members (`api.ts:367-405`): `name`, `extend(extension)`, `extend(preset)`, `configure(options)`,
`create(options?)` and `optionKinds` (see 7.2). `scope(path)` is not a form member. It is a member of the
instance, added by `handles` (`api.ts:459-464`), as the direction states.

### 2.2 Types

All are in `api.ts` and are **B** through `type-tests/` unless a note says otherwise.

| Group     | Exports (`api.ts` line)                                                                                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form      | `Form` (367), `AnyForm` (407), `Instance` (468), `Extension` (319), `Extendable` (268), `Needs` (286), `BuiltInApis` (273), `Self` (221), `FormContext` (247), `StateSlice` (241), `BaseOptions` (235)                                                                        |
| Option    | `OptionTypes` (D34)                                                                                                                                                                                                                                                           |
| Field     | `FieldMembers` (290), `FieldOf` (295)                                                                                                                                                                                                                                         |
| Read-back | `ValuesOf` (409), `ApiOf` (412), `StateOf` (413), `OptionsOf` (427), `PartsOf` (419), `FieldsOf` (416), `InstanceOf` (422)                                                                                                                                                    |
| Scope     | `Scope` (825), `ScopeDefinition` (502), `ScopedValues` (512)                                                                                                                                                                                                                  |
| Slot      | `Slot` (144), `SlotFactory` (149), `SlotDefinition` (125), `SlotRecord` (157), `PartSpec` (95), `PartHandle` (107), `PartEventContext` (114), `PartDomProps` (102), `PropKind` (55), `PropsOf` (68), `KeyProp` (77), `Attributes` (118), `ElementTag` (851, redefined in 7.3) |
| Path      | `Path` (32), `PathValue` (33), `ObjectPath` (35), `ArrayPath` (36), `ArrayItem` (37), `ArrayValue` (40)                                                                                                                                                                       |
| Utility   | `Updater` (42), `MaybePromise` (43), `Unsubscribe` (44), `DeepPartial` (46)                                                                                                                                                                                                   |

Types that `api.ts` exports and the direction does not name:

| Type (`api.ts` line)                                                                    | Placement                     | Reason                                                           |
| --------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `OptionTypes`                                                                           | `@oxform/core`                | An extension author names it when a helper builds options (D34). |
| `ResolveSelf` (228), `FormTypes` (357)                                                  | Not exported                  | `OptionsOf` and the read-back types cover every known use.       |
| `ResolveKeys` (90), `PartsFromSlots` (160), `ChecksOfApi` (434), `FieldMembersOf` (451) | The adapter entry point (7.2) | Only an adapter's types use them (`api.ts:893`, `:973`, `:987`). |

### 2.3 Contracts

| API                    | Input and result                                                                                                | Runtime rules                                                                                                                                                                                                                                                                                                                                                                                          | Server rule                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `defineForm`           | `schema` and `defaultValues` (required), `name`, `id`, `scopes`. Returns a `Form` with no extension.            | `schema` only types `Values`. The name defaults to `'form'` (`spike/form.ts:158`).                                                                                                                                                                                                                                                                                                                     | Safe at module scope.                |
| `form.extend`          | An extension (a function of `Extendable` that returns `defineExtension(...)`) or a preset (form to form).       | Returns a new form. A missing need is a type error here. Its runtime error is at `create` (3.1). A duplicate option name throws here (`spike/form.ts:89-103`). The result is a preset's form when it has `extend` (`spike/form.ts:185-187`).                                                                                                                                                           | Stateless.                           |
| `form.configure`       | Partial options of the form so far, with `Self` resolved.                                                       | Returns a new form. Calls merge, a later call wins (`spike/form.ts:189`). An option of a later extension is a type error.                                                                                                                                                                                                                                                                              | Stateless.                           |
| `form.create`          | Partial options. Returns an instance: the api, `id`, `store`, `destroy()`.                                      | Options merge as `defineForm`, `configure`, `create` (`spike/form.ts:169-173`). Extensions run in order. Before each `api` runs, its `needs` are checked against the api and state so far: a missing need throws and names the extension and the need, and no instance is returned (3.1). A duplicate api key, state key or instance key throws (`spike/form.ts:123-130`, `spike/context.ts:144-151`). | One instance per render or request.  |
| `defineExtension`      | `form` carries the types only. Returns the definition object (`spike/form.ts:29-30`).                           | `needs` lists the api names and the state keys that the `Extendable` parameter states. A missing or an extra name is a type error. It is required when the parameter states a need. `state(options)` runs once per instance and declares every state key. `api(ctx, deps)` runs once per instance. `deps` is the api of the earlier extensions.                                                        | `api` is inert (direction).          |
| `FormContext`          | `options()`, `onOptions`, `onDestroy`, `instance()`, `state.<key>` (`get`, `set`), `store` (`api.ts:247-257`).  | `ctx.state` has the extension's own keys only (`spike/context.ts:154-157`). `instance()` is valid after every `api` has run (`spike/form.ts:144`). `onDestroy` cleanups run at each unmount and at `destroy()`, and stay registered (G1). No public `createContext`.                                                                                                                                   | No DOM, timer or request in `api`.   |
| `option.*`             | A descriptor: the runtime kind and the type.                                                                    | At runtime a descriptor is `{ kind }` (`spike/form.ts:33-38`). `id`, `schema` and `defaultValues` are base options that an extension cannot declare (`spike/form.ts:22-26`).                                                                                                                                                                                                                           | Pure.                                |
| `Self`                 | Stands for the instance in an option's parameters.                                                              | `configure`, `create` and `Root` resolve it (`api.ts:228-232`).                                                                                                                                                                                                                                                                                                                                        | Type only.                           |
| `on<T>`                | `guard?`, then `build(field, path)`.                                                                            | The guard decides at runtime. `path` is relative to the scope. A member that redefines a handle member, or another extension's member, throws (`spike/context.ts:54-62`). Needs a `field` api (`spike/form.ts:135-137`).                                                                                                                                                                               | Pure.                                |
| `defineSlots`, `slots` | `{ name, needs }` and `build(slot)`. A group annotates `slot` with its needs, and `needs` lists the same names. | `defineSlots` records its name and needs on each slot that `build` returns. The spike's `defineSlots` is the identity (`spike/form.ts:47-48`). `slots(build)` is an extension with no api (`spike/form.ts:51-55`). At `create` it checks the needs of each group and throws for a missing one, naming the group and the need. A later slot key replaces an earlier one (`spike/form.ts:64-65`).        | Pure.                                |
| Slot                   | `element?`, `props?`, `text?`, `present?`, `state?`, `attrs?`, `on?`, `bind?` (`api.ts:125-141`).               | `text`, `present`, `state`, `attrs` are pure functions of the store state. `on` and `bind` run in the browser only.                                                                                                                                                                                                                                                                                    | The pure members render on a server. |
| `defineScope`          | `{ schema, defaultValues, checks? }`.                                                                           | Carries its own place and verify logic, so a form without scopes pays nothing (`spike/scopes.ts:115-119`). The six conflict rules of the readme apply.                                                                                                                                                                                                                                                 | Stateless.                           |
| `createEffect`         | An object with a `store`, a selector, an effect.                                                                | Not called for the first selection. Compares by deep equality (`spike/effect.ts`). Returns `{ unsubscribe() }`.                                                                                                                                                                                                                                                                                        | Do not call it inside `api`.         |

## 3. `@oxform/core/behaviors` (built-in behaviors)

### 3.1 Extensions

All are **B**. The needs are **C**. The order is the order `standard` applies (`spike/standard.ts:26-35`).
Every need is required (owner decision 17 of the direction). The spike has optional needs: `validation` on
six extensions and `events` on `reset` (`spike/status.ts:338`, `spike/events.ts:79`, `spike/reset.ts:44-50`,
`spike/submit.ts:474`, `spike/arrays.ts:545`, `spike/handles.ts:686-688`). The target has none.

| Extension               | Needs (api, all required)                       | Options                                     | State key                               | Api member                | Hooks                   | Evidence                      |
| ----------------------- | ----------------------------------------------- | ------------------------------------------- | --------------------------------------- | ------------------------- | ----------------------- | ----------------------------- |
| `values`                | none                                            | none (`defaultValues` is a base option)     | `values`                                | `values`                  | `intercept`, `onChange` | `spike/values.ts:40-45`       |
| `validation`            | `values`                                        | none                                        | `validating` (pending count)            | `validation`              | `onRun`                 | `spike/validation.ts:176-181` |
| `check(name, options?)` | `validation` (the spike also states `values`)   | The option named `name` (`CheckValidators`) | The key named `name`                    | The member named `name`   | none                    | `spike/check.ts:116-131`      |
| `status`                | `values`                                        | `defaultStatus`, `defaultFieldStatus`       | `status` (raw; the store shows derived) | `status`                  | none                    | `spike/status.ts:248-264`     |
| `events`                | `values`, `status`                              | `onError` (with `Self`)                     | none (refs in memory)                   | `events`                  | none                    | `spike/events.ts:77-83`       |
| `arrays`                | `values`, `status`                              | none                                        | none (item ids in memory)               | `arrays`                  | none                    | `spike/arrays.ts:178-184`     |
| `reset`                 | `values`, `status`, `events`                    | none                                        | none                                    | `reset`                   | none                    | `spike/reset.ts:44-56`        |
| `submit`                | `values`, `status`                              | `onSubmit`, `onInvalid` (with `Self`)       | none (writes form status)               | `submit`                  | `intercept`, `onResult` | `spike/submit.ts:120-132`     |
| `handles`               | `values`, `status`, `events`, `reset`, `arrays` | none                                        | none                                    | `field`, `array`, `scope` | none                    | `spike/handles.ts:148-155`    |

The table has 17 needs. `standard` meets each one with an earlier extension of its chain.

#### How a chain without `validation` works

`validation` registers its api in the form context when its `api` runs. `status`, `events`, `arrays`, `reset`,
`submit` and `handles` read it through the validation link (section 5) each time they use it. Without
`validation`, the link is a stand-in with no check: every path is valid, nothing is validating, and a run
resolves valid with no issues. So a form without `validation` acts as a form with `validation` and no check,
which is the spike's rule "no check is valid" (`spike/validation.spec.ts:32`). No `deps` member is missing and
no result changes meaning, so the link is not a need.

| Approach                                                                    | Public pieces | Verification                                                                                                                   | Risks and mitigation                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A (decided).** The validation link, read when used                        | None added    | Unit rows "on a chain with no `validation`" for the six extensions. The tier "values, status, events" has no validation marker | A built-in reads `validation` without a need. Mitigation: the link is internal, exists on every form, and a form without `validation` equals a form with no check. Custom extensions state needs |
| B. A hard need on `validation` in the six extensions                        | None added    | Type rows                                                                                                                      | E02 and the tier "values, status, events" cannot be built with built-in pieces. Against "no hand work" (owner decision 14)                                                                       |
| C. One more extension per use (`validationEvents`, `validationStatus`, ...) | Five or more  | Type and unit rows per piece                                                                                                   | More pieces, and the user must remember to add each one, which is hand work                                                                                                                      |

Rejected: optional needs (owner decision 17). Check against the standards: A adds no public piece (YAGNI,
KISS), keeps one owner for the checks (`validation`, SOLID single responsibility), and lets each built-in
depend on the link abstraction and not on `validation` (dependency inversion).

#### Rules that hold for every built-in

- No extension brings a slot. Slots come from the slot groups, applied with `slots(...)` (3.2).
- An extension starts no timer, no request and no validation run at creation. `events` touches an element
  only in `focus`, `blur` and `register` (`spike/events.ts:56-69`).
- A need comes earlier in the chain. The link is read when it is used, after every `api` has run, so
  `validation` can be anywhere after `values`. The spike's rule "extend `validation` before the extensions that
  use it" is removed.
- `reset` needs `events`, because `reset.all` clears the element refs (`keep.refs`). Every chain that renders
  fields has `events`, and no catalogue chain has `reset` without `events` (YAGNI).
- `check(name, { blocking?, exclusive? })`: the extension is named `check:<name>`. `standard` applies
  `check('error', { blocking: true, exclusive: true })` (`spike/standard.ts:29`).
- `handles` reads the check names from the api so far in the types (`CheckNamesOf`, `spike/handles.ts:132-134`)
  and from the validation link at runtime, once, when its `api` runs (`spike/handles.ts:152`). A check applied
  after it has no sugar.
- **Runtime error for a missing need.** Each built-in states its needs in `needs` (2.3). `form.create` checks
  the needs of each extension before its `api` runs. A missing need throws, for example `The "events"
  extension needs "status", which no earlier extension provides.` No instance is returned.
- Why at `create` and not at `.extend`: at `.extend` the form knows the option names, because they are data,
  so a duplicate option throws there. It does not know the api keys of the earlier extensions: `api` is a
  function, and its keys exist only when it runs. A check at `.extend` needs a second list per extension
  (`provides`) that can drift from the `api` result (against DIE and "no hand work"). The type error at
  `.extend` is the configuration failure for typed code. The runtime error covers JavaScript callers and casts,
  and fires on the first `create`, before any instance exists. The duplicate api key check is at `create` for the
  same reason.
- A built-in extension that takes a `status`, `events`, `arrays` or check api needs the object that the
  built-in extension created. Another object throws (`spike/public-surface.spec.ts`).
- The order of extension hooks is registration order, which is extension order (`spike/change.ts:28`, `spike/submit.ts:54`).

The function behind each extension (`createValues`, `createStatus`, ...) is internal (owner decision 13 of the
direction). The spike exports them (`spike/index.ts`). The target does not. [02-structure.md](./02-structure.md)
names the modules. A custom extension uses a built-in behavior through its api:

- It states the behavior in `Needs`: `Extendable<Values, Needs<Values, 'values' | 'validation'>>` (`api.ts:286`),
  and in its `needs`: `{ api: ['values', 'validation'] }`.
- It reads the api from `deps` in its own `api(ctx, deps)`: `deps.values.get(path)`, `deps.validation.run()`.
- It subscribes to the extension hooks of that api: `deps.values.intercept`, `deps.values.onChange`,
  `deps.validation.onRun`, `deps.submit.intercept`, `deps.submit.onResult`.

### 3.2 Slot groups

Every need is required, and each group needs exactly what it uses (owner decisions 14 and 17 of the
direction). So a lean form gets every part from a built-in group and writes no slot by hand.

| Export            | Parts and default elements          | Needs: api         | Needs: state                | Renders                                                                                                                                                                                               | Spike |
| ----------------- | ----------------------------------- | ------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `rootSlots`       | `root`, `form`                      | `submit`           | none                        | Prevents the default of `submit` and calls `submit.run(submitter.value)`. Prevents the default of `reset`, so the browser never resets a controlled input (`spike/slots.ts:142-156`)                  | B, C  |
| `fieldSlots`      | `field`, `input`                    | `events`, `values` | `values`, `status`          | `name`, value or `checked`, `aria-invalid` from `status`, `data-dirty/touched/blurred`. No `aria-describedby` (`spike/slots.ts:51-73`)                                                                | B, C  |
| `fieldErrorSlots` | `field`, `input`; `fieldError`, `p` | `events`, `values` | `values`, `status`, `error` | The `field` part of `fieldSlots`, plus `aria-describedby` while the path has errors. The `fieldError` part: present only with entries, `id`, `role="alert"`, the first message (`spike/slots.ts:105`) | B, C  |
| `submitSlots`     | `submit`, `button`                  | none               | `status`                    | `type="submit"`, `disabled` and `data-submitting` while submitting (`spike/slots.ts:117`)                                                                                                             | B     |
| `resetSlots`      | `reset`, `button`                   | `reset`            | none                        | `type="reset"`. On `click`: prevents the default and calls `reset.all()`. The spike calls it from the root (`spike/slots.ts:134-135`, `:151-154`)                                                     | B, C  |

The five groups state 12 needs. A group's needs are checked where it is spread (types, `readme`, "Slot-only
extensions") and at `create` (runtime, from `defineSlots({ name, needs }, build)`, 2.3).

Differences from the spike, where `rootSlots` needs `reset` and `fieldSlots` needs the `error` state
(`spike/slots.ts:53-56`, `:142`):

- **Reset is on the `reset` part.** `resetSlots` needs `reset` and calls it on `click`. `rootSlots` needs only
  `submit`. The root still prevents the default of a `reset` event from any other source.
- **One group per part.** `fieldSlots` and `fieldErrorSlots` both give the `field` part. A form spreads one of
  them: `fieldErrorSlots` when it has the `error` check, else `fieldSlots`. One internal function builds both
  `field` slots (DIE). If a form spreads both, the later one wins (a later key replaces an earlier one), and
  `fieldSlots` after `fieldErrorSlots` loses only `aria-describedby`. `04-documentation.md`, section 5.2, lists
  it as a limit.
- **A form with no `submit` spreads no root group.** `Root` then renders no element and only provides the
  instance (6.1). The member filter (E02) is that form.

| Chain                                                          | Groups it spreads                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `standard`                                                     | `rootSlots`, `fieldErrorSlots`, `submitSlots`, `resetSlots` |
| Lean sign-in (E01): `values` to `submit` with `check('error')` | `rootSlots`, `fieldErrorSlots`, `submitSlots`               |
| Member filter (E02): `values`, `status`, `events`              | `fieldSlots`                                                |

Rejected:

- Optional needs in a group (owner decision 17).
- Two groups that add to one part. A slot cannot be wrapped, and a later key replaces an earlier one, so one
  element takes its attributes from one slot.
- A root group that needs nothing, plus a submit group that replaces `root`. A wrong spread order drops the
  submit handler with no error. A second root group has the same hazard and two names for one part.

Verification: the type rows (one negative case per need of the table) and the unit rows of
[03-testing.md](./03-testing.md), and the two tiers with slot groups of its tree-shaking check.

### 3.3 Types

All are **B**. Types in italics are the ones the direction leaves as "...". The line numbers are those of the
spike name where 7.1 lists a rename.

| Owner          | Exports (`api.ts` line)                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| change, values | `ChangeApi` (584), `ValuesApi` (598), `Change` (572), `ChangeDetails` (564), _`ChangeInterceptor`_ (578), _`ChangeListener`_ (582), _`ChangeReason`_ (561)                                               |
| validation     | `ValidationApi` (637), `ValidationRun` (653), `ValidationEvent` (45), `IssuesByCheck` (628), _`ValidationRunOptions`_ (632), _`ValidatorInput`_ (617), _`CheckValidator`_ (622), `CheckValidators` (626) |
| check          | `CheckApi` (668), `CheckOptions` (660), `CheckEntry` (615), `CheckState` (629), `CheckSugar` (684), _`CheckSetMode`_ (630)                                                                               |
| status         | `StatusApi` (551), `StatusState` (546), `FieldStatus` (520), `FormStatus` (530), _`FormStatusDefaults`_ (543), _`FieldStatusDefaults`_ (544)                                                             |
| events         | `EventsApi` (704), _`FieldChangeOptions`_ (697), _`FieldFocusOptions`_ (700), _`EventErrorDetails`_                                                                                                      |
| arrays         | `ArraysApi` (724), _`ArrayOperations`_ (712)                                                                                                                                                             |
| reset          | `ResetApi` (761), _`ResetOptions`_ (749)                                                                                                                                                                 |
| submit         | `SubmitApi` (777), _`SubmitAttempt`_ (766), _`SubmitResult`_ (772)                                                                                                                                       |
| handles        | `FieldHandle` (796), `ArrayHandle` (807), `FieldState` (788). The api type of `handles` is `Scope`, in the main entry point.                                                                             |

`CheckNamesOf` (`spike/handles.ts:132`) stays private: only `handles` uses it.

## 4. `@oxform/core/presets` (form presets)

| Export     | Role                                                                                                                       | Reference                 | Spike |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----- |
| `standard` | A function from form to form. It applies the nine extensions of 3.1 in order, then the four slot groups of its row in 3.2. | `spike/standard.ts:23-44` | B, C  |

- It is generic in the form it receives, so it applies to a form that already has extensions, and an
  extension can follow it (`spike/form.spec.ts:105`). The `extends {}` bounds on `Api` and `State` are required.
- It needs nothing: it applies `values` first. Each `.extend` inside it checks the needs of its extension, and
  each extension meets them with an earlier one.
- It exports no type. The types of a standard form are read back: `InstanceOf<typeof form>`, `OptionsOf<...>`.
- It has no private access: it imports only what sections 2 and 3 export.
- Size: 8.59 kB gzip in the spike (`readme`, "Bundle sizes"). The size is measured and published. It has no
  limit (owner decision 12 of the direction).

## 5. Internal channels

The package has four core entry points. The channels below are never exported from `@oxform/core`,
`@oxform/core/behaviors` or `@oxform/core/presets`, and `@oxform/core/adapter` exports only the adapter rows. A packaging test in
[03-testing.md](./03-testing.md) must assert it.

| Channel                                                                | Carries                                                                                                                     | Used by                                        | Evidence                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| `createContext(options)` and its controls                              | `store`, `setOptions`, `bindInstance`, `extensionContext`, `addFields`, `unmount`, `destroy`                                | `form.create`                                  | `spike/context.ts:13-29`, `:70`              |
| `contextInternals(ctx)`                                                | `derive(name, compute)`, `decorateField(handle, path)`                                                                      | status, handles                                | `spike/context.ts:37-48`                     |
| The validation link, `contextInternals(ctx).validation()`              | The instance's validation api, or a stand-in with no check when no `validation` is applied (3.1). `validation` registers it | status, events, arrays, reset, submit, handles | New. Replaces `deps.validation?`             |
| `statusInternals(status)`                                              | `mark`, `setForm`, `reset`, `remap`, `generation`                                                                           | events, arrays, reset, submit                  | `spike/status.ts:32-50`                      |
| `eventsInternals(events)`                                              | `ref`, `clearRefs`                                                                                                          | handles, reset                                 | `spike/events.ts:17-28`                      |
| `arraysInternals(arrays)`                                              | `ids`                                                                                                                       | handles                                        | `spike/arrays.ts`                            |
| `checkInternals(check)`                                                | `remap`                                                                                                                     | arrays                                         | `spike/check.ts:25-36`                       |
| `registerCheck(validation, entry)`, `isDiscarded(result)`, `isInScope` | Check registration, and the identity of a discarded run                                                                     | check, submit                                  | `spike/validation.ts:24-53`                  |
| Scope keys `oxform.scope.mount`, `oxform.scope.verify`                 | Symbol-keyed functions on a scope definition                                                                                | `defineForm`, `form.create`                    | `spike/form.ts:68-69`, `spike/scopes.ts:5-7` |
| The extension list of a form                                           | A private map from form to its definitions                                                                                  | `slotsOf`, `extend`                            | `spike/form.ts:57-58`                        |
| `slotsOf(form)`                                                        | The resolved slot definitions                                                                                               | **adapters**                                   | `spike/form.ts:64-65`                        |
| `adapterControlsOf(instance)`                                          | `setOptions` (merged like `create`), `unmount`                                                                              | **adapters**                                   | `spike/form.ts:77-86`                        |
| `prefixOf(scope)`                                                      | The prefix of a scope, under `Symbol.for('oxform.scope.prefix')`                                                            | **adapters**                                   | `spike/handles.ts:25-27`                     |
| Path helpers                                                           | `getAt`, `joinPath`, `isDeepEqual`, `setAt`, `isWithin`, `segments`                                                         | behaviors and **adapters**                     | `spike/paths.ts`                             |

The four adapter rows cross a package boundary (`spike/react/create-parts.tsx:23-25`). Section 7.2 settles
where they live: `@oxform/core/adapter`.

## 6. Adapter surface

### 6.1 Shared contract (all three adapters)

`create-parts.tsx` is `explorations/extension-api/spike/src/react/create-parts.tsx`.

| Item              | Contract                                                                                                                                                                                                                                                                                                 | Evidence                                                           | Spike     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- |
| `createParts`     | `createParts(form, elements?)`. `form` is any form. `elements` is optional and only overrides the element a slot declares, by slot name. An unknown name throws.                                                                                                                                         | `api.ts:995`, `create-parts.tsx:176-183`                           | B         |
| Part components   | One per slot except `root`, named by the capitalized slot name. Props: the slot's props (a `'key'` prop is a path of the form), the element's props, `children` (content or a function of the slot state), `render`.                                                                                     | `api.ts:864-871`, `:913-926`                                       | B         |
| Part rendering    | Nothing while `present` is false. Else the element with the slot's `attrs`. Slot attributes win over author props. Content: children, else the slot's `text`.                                                                                                                                            | `create-parts.tsx` (`PartView`)                                    | B         |
| Events and `bind` | The slot's `on` handlers are native listeners on the element. `bind` runs when the element attaches, and its cleanup when it detaches. The author's ref is merged.                                                                                                                                       | `create-parts.tsx` (`attach`, `mergeRefs`)                         | B         |
| `Root`            | Exists for every form. With a `root` slot it renders that slot's element. Without one it renders no element and only provides the instance (3.2). Props: `options?` (the form's options), the element's props, `form?` (an existing instance), `children`. With `form`, `options` is a type error (G12). | `api.ts:939-950`, `create-parts.tsx:209-234`                       | B, C      |
| Options           | `Root` creates the instance once. New option values reach it on each update, merged like `create`. With `form`, the instance keeps its owner's options.                                                                                                                                                  | `create-parts.tsx:217-222`, `spike/adapter-controls.spec.ts`       | B         |
| Options           | Options are a type only, so an adapter reads no option list (D34). `Root` gives its `options` prop to the instance and every other prop to the element. The `id` option defaults to the hydration-safe id of the framework.                                                                              | `packages/react/src/create-parts.ts`                               | —         |
| Lifecycle         | Leaving the tree runs the instance's cleanups and keeps the instance usable. The adapter never calls `destroy`.                                                                                                                                                                                          | `create-parts.tsx:222`, `spike/context.ts:25-28`                   | B         |
| Ids               | The adapter makes the form id with the framework's hydration-safe id and passes it as the `id` option. A caller's `id` prop wins.                                                                                                                                                                        | `create-parts.tsx:212-215`                                         | B         |
| Instance lookup   | One context per form object, shared by `createParts` and `usePart`. Both must get the same form object.                                                                                                                                                                                                  | `create-parts.tsx:52-57`                                           | B         |
| `scope` prop      | A part takes `scope` (from `useScope` or `form.scope`). Its `'key'` props are then paths of the scope. It is the only way to scope a part: the spike's `within(scope)` is removed (owner decision 15 of the direction).                                                                                  | `api.ts:915-919`                                                   | B, C      |
| `useForm`         | The instance from the nearest `Root` of this form. Throws outside one.                                                                                                                                                                                                                                   | `create-parts.tsx:59-63`                                           | B         |
| `useSelector`     | `useSelector(selector, { compare? })` on the instance state.                                                                                                                                                                                                                                             | `api.ts:961-964`                                                   | B         |
| `useField`        | Same signature as `form.field`, plus `{ scope }`. Follows the value and status of that path only: it reads the state keys `values` and `status` (G13).                                                                                                                                                   | `api.ts:969-973`, `create-parts.tsx:243-250`                       | B         |
| `useArray`        | Same signature as `form.array`, plus `{ scope }`. Follows the array value: it reads the state key `values` (G13).                                                                                                                                                                                        | `api.ts:975-979`                                                   | B         |
| `useScope`        | Same signature as `form.scope`, plus `{ scope }`. Stable result for the same inputs.                                                                                                                                                                                                                     | `api.ts:984-992`                                                   | B         |
| `usePart`         | `usePart(form, slot, slotProps, props, tag)`: one slot in another element. See 7.5 item 3.                                                                                                                                                                                                               | `api.ts:1001-1011`, `create-parts.tsx:276-287`                     | B, C      |
| Server render     | The first HTML has the state at creation: values, `aria-*`, `data-*`, `disabled`. Nothing starts. The client builds its own instance from the same options. No state is serialized.                                                                                                                      | `old/proposal.md` "Server rendering"; `spike/react/parts.spec.tsx` | B (React) |

### 6.2 `@oxform/react`

| Export                                                                       | Kind  | Reference              | Spike |
| ---------------------------------------------------------------------------- | ----- | ---------------------- | ----- |
| `createParts`, `usePart`                                                     | value | `spike/react/index.ts` | B     |
| `PartElements`, `PartRender`, `PartProps`, `PartComponent`, `PartComponents` | types | `api.ts:853-926`       | B     |
| `RootProps`, `RootComponent`, `FormHooks`                                    | types | `api.ts:939-993`       | B     |

- The spike's barrel exports three of these types (`spike/react/index.ts`). The target exports all of them.
  `BoundParts` (`api.ts:929`) is the type of `within` and is not carried over.
- Adapter hooks return plain values and re-render the component. `useSelector` passes the state at creation as the
  server snapshot.
- `render` is an element (cloned) or a function `(props, state) => node` (`api.ts:859-861`).
- The id comes from `useId`. The module has `'use client'` (`create-parts.tsx:1`).

### 6.3 `@oxform/solid` and `@oxform/solid/v2` (not built)

Export names are the same as in 6.2. The table lists what must differ, and why.

| Item                          | React                                       | Solid 1 and Solid 2                                                                                            | Reason                                                                                             |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `useSelector` result          | `Selected`                                  | `Accessor<Selected>`                                                                                           | A Solid component runs once. A plain value is never updated.                                       |
| `useField`, `useArray` result | The handle. The component re-renders.       | The handle. `state`, `get()` and `ids` track when read in a reactive scope.                                    | No re-render. Today's adapters do the same (`packages/solid-v1/src/create-form.ts:27-33`).         |
| Hook path arguments           | `string`                                    | `string` or `Accessor<string>`                                                                                 | A path that changes must be followed (`packages/solid-v1/src/internal/create-binding.ts:19-31`).   |
| `children` as function        | `(state) => node`, called per render        | `(state: Accessor<State>) => JSX.Element`, called once                                                         | No re-render.                                                                                      |
| `render`                      | Element or function                         | Function only: `(props, state: Accessor<State>) => JSX.Element`                                                | A Solid JSX element is a DOM node. It cannot be cloned with new props.                             |
| Part props                    | Read per render                             | Read through the props object inside reactive scopes. No destructuring.                                        | Solid props are getters.                                                                           |
| Absent part                   | Returns `null`                              | Conditional rendering. The element is created and disposed, and `bind` follows it.                             | No re-render.                                                                                      |
| `Root` options                | Layout effect on each render                | Solid 1: a computation that tracks the props. Solid 2: `createEffect(compute, effect)`, skipped on the server. | `packages/solid-v2/src/create-form.ts:23-28` against `packages/solid-v1/src/create-form.ts:22-25`. |
| Form id                       | `useId`                                     | `createUniqueId`                                                                                               | Each is the framework's hydration-safe id.                                                         |
| Store on the server           | `useSyncExternalStore` server snapshot      | Read `store.state` directly. No subscription when `isServer`.                                                  | `packages/solid-v1/src/internal/create-store-state.ts:12`.                                         |
| Cleanup                       | Effect cleanup                              | `onCleanup` of the owner. Every hook needs an owner.                                                           | `packages/solid-v1/src/internal/require-owner.ts`.                                                 |
| Element creation              | `createElement(tag)`                        | The dynamic element of the web package.                                                                        | The tag is data.                                                                                   |
| Multiple select value         | React selects the options of a list `value` | The part sets `selected` on each option. Solid sets `value` as a property, which takes no list.                | TK-043: a list `value` becomes `"a,b"` and selects nothing.                                        |
| `'use client'`                | Yes                                         | No                                                                                                             | React Server Components only.                                                                      |

Solid 1 and Solid 2 have the same public types. They differ inside: the import source of `JSX`, `isServer`
and the dynamic element (`solid-js/web` against `@solidjs/web`), and the effect and memo APIs (compare
`packages/solid-v1/src` and `packages/solid-v2/src`). TK-043 tested the two known risks in Solid 1. Solid sets
a controlled value as a DOM property, apart from a list `value` (the row above). A toggle needs no `click`
listener in Solid, and the one of the `field` slot, which React needs, also works there.

### 6.4 Adapter parity

Parity means all of these hold. [03-testing.md](./03-testing.md) owns the tests.

1. The three adapters export the same value names and the same type names.
2. `createParts` returns the same member names for the same form.
3. One shared list of scenarios runs against each adapter in a browser. Each scenario asserts DOM output,
   attributes and form state, not framework internals.
4. The server HTML of one form is the same in the three adapters, apart from framework markers, the order
   of attributes, `disabled` against `disabled=""`, and the space before the end of a tag (`normalizeHtml`).
5. The only allowed differences are the rows of the table in 6.3. A new difference needs a new row.

## 7. Design items

### 7.1 Renames applied

Decided (owner decision 10 of the direction): the rename table is approved, and every plan file uses the new
names. The rule: one word names a concern. The extension is `<word>`, the api type `<Word>Api`, the instance
member and the state key `<word>`, and the internal function `create<Word>`. `handles` is the one stated
exception: it adds three members (`field`, `array`, `scope`), and its api type is `Scope`.

Use this record to map a name of the spike to its name in the plan.

| Spike name          | Name                   | Kind                             | Reason                                                                                             |
| ------------------- | ---------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `KernelApis`        | `BuiltInApis`          | Type of `@oxform/core`           | "Kernel" is a contributor-only word (`api.ts:273`).                                                |
| `useArrayField`     | `useArray`             | Adapter hook                     | `useField` and `useScope` already mirror `form.field` and `form.scope`.                            |
| `ValidateOptions`   | `ValidationRunOptions` | Type of `@oxform/core/behaviors` | It pairs with `ValidationRun`.                                                                     |
| `ValidatorStore`    | `ValidatorInput`       | Type of `@oxform/core/behaviors` | It is the argument of a validator function, not a store (`api.ts:617`). It has `values` only (G2). |
| `EventValidators`   | `CheckValidators`      | Type of `@oxform/core/behaviors` | It is the option of a check.                                                                       |
| `SetEntriesMode`    | `CheckSetMode`         | Type of `@oxform/core/behaviors` | It is the mode of `CheckApi.set`.                                                                  |
| `createFieldStatus` | `createStatus`         | Internal function                | It owns the form status too.                                                                       |
| `createFieldEvents` | `createEvents`         | Internal function                | The word of the extension.                                                                         |
| `createArray`       | `createArrays`         | Internal function                | The word of the extension. `form.array(path)` is the handle, so the api stays `arrays`.            |

Not renamed: `onDestroy` (06, D16). Its documentation states when the cleanup runs (G1).

Spike names that the target removes and does not rename:

- The `createX` functions as public exports of `spike/index.ts` (owner decision 13). They stay as internal
  functions, with the three renames above.
- `within` and `BoundParts` (owner decision 15).
- `Form.optionKinds` and the `option` descriptors. Options are a type only (D34).
- `ResolveSelf` and `FormTypes` (2.2).

Reviewed and kept: `slots` and `defineSlots`, `option`, `on`, `Extendable`, `Needs`, `Self`, the read-back
types, `FieldMembers` and `FieldsOf`, `ScopedValues`, the five slot group names, `FieldChangeOptions` and
`FieldFocusOptions` (options of a field action, used by events, arrays and handles), `IssuesByCheck`.

Verification: the export-name test of each entry point, and a search for the spike names that returns only this
record. Rejected: rename the api to the function (`form.array` collides with the handle, and `fieldStatus` is
wrong for the form status).

### 7.2 What adapters import from core

Problem: the React adapter imports `slotsOf`, `adapterControlsOf`, `prefixOf`, `getAt`, `isDeepEqual` and
`joinPath` from core source, and reads `form.optionKinds` (`spike/react/create-parts.tsx:23-25`, `:210`).
Adapters are separate packages.

| Approach                                                                                            | Verification                                                                                                                       | Risks and mitigation                                                                                                          |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **A (decided).** A fourth entry point, `@oxform/core/adapter`, documented for adapter authors only. | The export-name test of the entry point. The module-sharing check covers it. Each adapter imports nothing else that is not public. | A fourth entry point to package and document. It is a semver contract. Mitigation: one contributor page, no public docs page. |
| B. The same functions in `@oxform/core`, with an `unstable_` prefix.                                | The export-name test.                                                                                                              | An application developer sees them in autocomplete, which the direction wants to avoid. No mitigation.                        |

Contents for A: `slotsOf(form)`, `adapterControlsOf(instance)`, `prefixOf(scope)`,
`joinPath`, `isDeepEqual`, and the types `AdapterControls`, `ResolveKeys`, `PartsFromSlots`, `ChecksOfApi`,
`FieldMembersOf`. `get` is already public. `optionKinds` leaves the public `Form` type (`api.ts:375`), and core
keeps no option list (D34). Rejected: reach everything through `Symbol.for` keys with no export (no types,
and each adapter repeats the key strings).

Decided: approach A (owner decision 8 of the direction).

### 7.3 Framework-neutral `ElementTag`

Problem: `api.ts:851` takes `ElementTag` from React's `JSX.IntrinsicElements`, and core slot types use it
(`api.ts:95`, `:125`, `:144`, `:152`).

| Approach                                                                 | Verification                                                                                                                                  | Risks and mitigation                                                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **A (decided, D13).** `ElementTag = keyof HTMLElementTagNameMap` in core | A type test in each adapter: every `ElementTag` is a key of its intrinsic elements. A negative test: `element: 'inptu'` fails in `slot(...)`. | No SVG and no deprecated tags. Mitigation: `render` covers them. A custom element is added by declaration merging. |
| B. `Tag extends string` in core. Each adapter narrows it.                | Adapter type tests: a part with an unknown tag has the type `never`.                                                                          | A typing error in a slot shows only where `createParts` is used. Mitigation: a runtime check in development.       |

A adds no dependency: core types already need the DOM library (rule 4). Checked with tsc 7.0.2:
`Exclude<keyof HTMLElementTagNameMap, keyof JSX.IntrinsicElements>` is `never` for `@types/react` 19.3.0 and
for `solid-js` 1.9.17. Rejected: a tag map as a type parameter of every slot type, and a hand-written union.

### 7.4 Solid adapters and a replacement for `useFormEffect`

The Solid surface is in 6.3 and 6.4. For `useFormEffect` (`packages/react/src/use-form-effect.ts`) and Solid
`createFormEffect`:

| Approach                                                                                                                                                                                                                                | Verification                                                    | Risks and mitigation                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **A (decided, D31).** No adapter export. Document one pattern per adapter. React: core `createEffect(useForm(), selector, effect)` inside `useEffect`, with `unsubscribe` as the cleanup. Solid: `useSelector` plus Solid's own effect. | A type-checked docs snippet per adapter, run as a browser test. | A stale callback in React. Mitigation: the snippet keeps the callback in a ref.          |
| B. `useFormEffect(selector, effect)` in the result of `createParts`, in the three adapters.                                                                                                                                             | Parity scenarios for the hook.                                  | One more member to keep in parity, for what Solid has natively. Mitigation: none needed. |

A keeps the adapter surface at the direction's list. B is additive later if the pattern proves heavy.

### 7.5 Findings of the type-checked examples

From `examples/readme.md`, "Findings from type-checking". The "Decided" column is the decision (06, D32 for
item 3, D24 for the others).

| #   | Finding                                                                                                                                            | Decided                                                                                                                                                                                                    | Other viable approach                                                    | Verification                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | An extension named by a parameter needs three casts (`spike/check.ts:121-130`).                                                                    | Keep the casts inside the built-in `check`, which is the only shipped case. Document the pattern for authors.                                                                                              | A keyed overload of `defineExtension`, or a `defineCheck` helper.        | A type test: `form.<name>` and its option are typed for two names.     |
| 2   | A slot group states its needs by hand (`spike/slots.ts:53-56`). The target states them twice: in the `slot` annotation and in `needs` (2.3).       | Accept. A type lock makes a difference between the two a type error. Needs are checked where the group is spread and at `create`. Each built-in group gets a positive case and one negative case per need. | Infer needs from the body. Not possible: `slot` must be typed first.     | `type-tests/part-scope.tsx` cases, kept. A type case for the lock.     |
| 3   | `usePart` takes `ComponentPropsWithoutRef<Tag>`, so a wrapper cannot pass `render` or a function child (`api.ts:1009`).                            | Type `props` as the part's own props for that tag (`PartProps`, without the slot props). The runtime already accepts them (`create-parts.tsx:286`).                                                        | Keep the element props only, and document the limit.                     | A type test: a wrapper forwards `PartProps<'select'>`. A browser test. |
| 4   | `@oxform/react` had no public entry.                                                                                                               | Settled by 6.2.                                                                                                                                                                                            | none                                                                     | The export-name test.                                                  |
| 5   | `change.path` needs a cast in a generic extension (`examples/06-custom-behaviors.ts:119`). `Change.path` is already `Path<Values>` (`api.ts:573`). | Find the cause in a type test first. Expected: `Path<V>` of an unresolved `V` does not index a mapped option. Then document the cast.                                                                      | Type the option as `Partial<Record<string, string>>` in such extensions. | The type test.                                                         |
| 6   | A state factory that starts with `null` needs an assertion (`examples/06-custom-behaviors.ts:55`).                                                 | Document a return type on the factory: `state: (): { autosave: AutosaveState } => ...`. No API change.                                                                                                     | A `state` helper that takes the type as an argument.                     | The docs snippet is type-checked.                                      |

### 7.6 Risks named in the readme

The "Decided" column is the decision (06, D18 for the second row, D24 for the others).

| Risk (`readme`, "Open risks" and "Handles and check names")               | Decided                                                                                                        | Other viable approach                                                    | Verification                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `on<T>` cannot express every per-path condition.                          | Accept for this release. Document that the condition is the value type, and that the guard must match it.      | A second builder keyed by path. Not needed by any kit extension (YAGNI). | Type tests for `on<string>`, `on<number>` and no guard.            |
| The error when `.extend` rejects an extension reads as a preset mismatch. | Declare the preset overload first, so the reported error is the extension overload's. Prove it in a type test. | Keep the order, and document how to read the message.                    | A type test file with the expected diagnostic text, checked in CI. |
| A check applied after `handles` has no sugar, in types and at runtime.    | Keep the rule (settled). Document it. `standard` applies `handles` last.                                       | Throw in `create` when a check registers after `handles` ran.            | A type test and a unit test that pin the rule.                     |
| A preset cannot be configured later with another schema.                  | Accept. Reuse is `defineForm(init).extend(standard)`.                                                          | none                                                                     | none                                                               |

### 7.7 Gaps against 0.x

The "Decided" column is the decision (06, D22, D17, D15 and D45, in row order).

| Gap                                                                                                                                      | Decided                                                                                                                                                                                                                                 | Other viable approach                                               | Verification                                                                        | Risks and mitigation                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Root (pathless) issues: `CheckApi.at` and `set` need a path (`api.ts:671-672`).                                                          | The empty path `''` is the root, in the types too: `at('')`, `set('', entries)`, `at('', { nested: true })` for every entry. The runtime already stores a pathless issue under `''` (`spike/validation.ts:61-62`, `spike/reset.ts:29`). | Make `path` optional in `at`, and add `setRoot(entries)`.           | Unit tests for `set`, `at` and `clear` on `''`. A type test.                        | `''` can look like a mistake. Mitigation: one documented rule. No form-level error part ships: read `state.error['']` with `useSelector`. |
| Options of a live instance without an adapter (`spike/form.ts:145-148`).                                                                 | No instance member. A caller creates the instance with its final options, or passes callbacks that read current data. An adapter author uses `adapterControlsOf` (7.2).                                                                 | A public `instance.setOptions(partial)`, also used by the adapters. | `spike/adapter-controls.spec.ts` scenarios, through the adapter entry point.        | A core-only app that needs it has no path. Mitigation: `setOptions` is additive later.                                                    |
| Ids without an adapter: the id is `''`, or the one `id` of `defineForm` for every instance (`spike/form.ts:140`, `spike/handles.ts:81`). | `create()` with no `id` takes one from a module counter (`form-1`). An adapter always passes its own id, so the settled rule holds for rendered forms.                                                                                  | Keep `''`, and document that a caller passes `id` to `create`.      | A unit test: two instances have different ids. The hydration tests of each adapter. | A counter differs between server and client for a hand-rendered core-only form. Mitigation: document `id` for that case.                  |
| An "any form" type (0.x `AnyFormApi`).                                                                                                   | `AnyForm` exists for a form (`api.ts:407`). Add no `AnyInstance`. Document: `<F extends AnyForm>` with `InstanceOf<F>`; the members a function needs (`{ values: ValuesApi<any> }`); `Scope<Address, 'error'>` for a sub-object.        | Export an `AnyInstance` alias.                                      | The three patterns are type tests and docs snippets.                                | An alias made of `any` hides errors. That is why it is not added.                                                                         |

## 8. Behavior answers for the test plan

| Question                                                                             | Spike behavior                                                                                                                                                                       | Evidence                                                           | Target                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does `onRun` fire for a discarded run?                                               | No. The run returns before the listeners are called. It resolves the shared tuple `[true, {}]`.                                                                                      | `spike/validation.ts:117`, `:144`                                  | Keep. Change the type comment: `onRun` observes applied runs (`api.ts:643`). See G3.                                                                |
| What does an insertion updater receive?                                              | There is none. `append`, `prepend` and `insert` take an item. `update` takes an updater of the item at the clamped index. `replace` takes an updater of the whole array.             | `api.ts:713-721`, `spike/arrays.ts:145`, `:168`                    | Keep. This removes the 0.x mismatch (`docs/form-core-behaviors.md:247-248`).                                                                        |
| Does a field reset honor `status` or `keep`?                                         | No. `reset.at(path, { value? })` sets the value, drops the field state of the subtree and clears every check there. `status` and `keep` exist on `reset.all` only.                   | `api.ts:763`, `spike/reset.ts:34-39`                               | Keep (YAGNI). The migration guide states it.                                                                                                        |
| Does a non-exclusive check clear an event's entries when the event has no validator? | No. A check is refreshed only for the events that had a validator in the run, and not at all when none had one. An exclusive check replaces every entry in scope when any event ran. | `spike/validation.ts:102-103`, `:125-126`, `spike/check.ts:93-104` | Keep. Document: entries of an event whose validator was removed stay until `clear`.                                                                 |
| What does an extension applied twice do?                                             | With an option: throws at `.extend`. With a state key or api key: throws at `create`, and the message names the extension twice. `slots(...)` twice is legal: later keys replace.    | `spike/form.ts:94-99`, `:123-128`, `spike/context.ts:144-149`      | Keep. Add a clearer message for the same-name case.                                                                                                 |
| Is a scope of the wrong shape rejected?                                              | A non-object path is rejected (`ObjectPath`), which is what the old test checked (`old/type-tests/composition.tsx:122-123`). An object of another shape is accepted.                 | `type-tests/scopes.tsx:62-63`, `api.ts:833`                        | Try an invariant phantom member on `Scope` in a type test. If it causes deep instantiation, keep the limit and correct the comment at `api.ts:817`. |

## 9. Further gaps between `api.ts` and the spike runtime

Each row is decided. The last column is the decision (06, D24, unless the row names another decision). The
work package of the module applies it.

| #   | Gap                                                                                                                                                                                            | Evidence                                                           | Decision                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | `onDestroy` cleanups run on every unmount and stay registered. The adapter never calls `destroy`. The type comment says "destroys".                                                            | `spike/context.ts:104-106`, `:162-169`, `api.ts:251`               | `onDestroy` keeps its name. A cleanup runs at each unmount and at `destroy()`, stays registered, and may run many times. Only the creator of an instance calls `destroy()` (D16). |
| G2  | `ValidatorInput.status` is an empty stand-in.                                                                                                                                                  | `spike/validation.ts:98`, `api.ts:617-620`                         | Remove `status` from the type. `validation` needs only `values`, so it has no status to pass.                                                                                     |
| G3  | A discarded run resolves `[true, {}]`, which is not an `IssuesByCheck`.                                                                                                                        | `spike/validation.ts:48`                                           | Return an empty list per check.                                                                                                                                                   |
| G4  | Check names are `string` outside handles: `form.validation`, `onInvalid` and `submit.onResult` accept any name. The direction limits the settled decision to the field sugar (design item 10). | `api.ts:275`, `spike/validation.ts:180`, `spike/submit.ts:127-130` | Type them from `CheckNamesOf` of the chain. If the depth guard fails, keep `string` and add a row to `limits.mdx` (D21).                                                          |
| G5  | The `check` extension never uses `deps.values`.                                                                                                                                                | `spike/check.ts:41`                                                | Remove the need. `check` needs `validation` only (3.1).                                                                                                                           |
| G6  | Closed. The function behind `status` could not be called by a custom extension. No `createX` function is exported, so nothing calls it from outside.                                           | `spike/status.ts:71`, `:256-258`                                   | Not exported (owner decision 13).                                                                                                                                                 |
| G7  | Lean forms: `rootSlots` needed `reset`, and `fieldSlots` needed the `error` state.                                                                                                             | `spike/slots.ts:53-56`, `:142`                                     | Each group needs exactly what it uses. No need is optional (3.2, owner decisions 14 and 17).                                                                                      |
| G8  | `defaultFieldStatus` is keyed by `string`. The first spike keyed it by `Path<Values>` or `'*'`.                                                                                                | `spike/status.ts:255`, `old/api.ts:837`                            | Key it by path.                                                                                                                                                                   |
| G9  | `scope(prefix)` returns a new object on each call, so an inline `form.scope(...)` gives a part a new `scope` prop value on each render.                                                        | `spike/handles.ts:123`                                             | Cache the scope per prefix.                                                                                                                                                       |
| G10 | `FieldState.id` is the form id plus the raw path. Slot ids use `idPart`. The `field` slot sets no `id`, so `FieldState.id` matches no element.                                                 | `spike/handles.ts:81`, `spike/slots.ts:61-73`                      | One id function. The `field` slot sets `id`.                                                                                                                                      |
| G11 | Option kinds are not read at runtime: the adapter uses the option names only, and of the prop kinds only `'key'`.                                                                              | `create-parts.tsx:210-215`, `api.ts:49`, `:55`                     | No kind had an effect in an adapter, so the kinds are removed: options are a type only (YAGNI, D34).                                                                              |
| G12 | `Root` with `form` ignores its option props without a warning, and ignores a `form` that changes.                                                                                              | `create-parts.tsx:217-222`                                         | Type the two cases apart: with `form`, `options` is a type error. A `form` that changes is a documented limit.                                                                    |
| G13 | `useField` and `useArray` read the state keys `values` and `status` by name.                                                                                                                   | `create-parts.tsx:248`                                             | State the two keys as part of the adapter contract.                                                                                                                               |
| G14 | The instance context is keyed by the form object. `createParts(form.configure(x))` and `usePart(form, ...)` do not meet.                                                                       | `create-parts.tsx:52-57`, `spike/form.ts:189`                      | Document it, and throw a clear error in `usePart`.                                                                                                                                |
| G15 | `ValuesApi.set` takes `Partial<ChangeDetails>` (with `cancel`), `ChangeApi.run` takes three fields. No caller sets `source` or `event`.                                                        | `api.ts:592`, `:604`, `spike/events.ts:51`                         | One details input type. Remove `source` and `event`, and `ChangeSource` with them: no caller sets them (YAGNI).                                                                   |
| G16 | An error in `onSubmit` rejects `submit.run()`, and the `root` slot ignores the promise. A second `run(intent)` during a submit drops its intent.                                               | `spike/submit.ts:79-81`, `:96`, `spike/slots.ts:148`               | State both rules. The `root` slot handles the rejection.                                                                                                                          |
| G17 | A programmatic `focus()` or `blur()` calls the element, whose DOM event calls the slot handler, so status and validation run twice.                                                            | `spike/events.ts:56-65`                                            | Verify in a browser test (P5-02), then guard.                                                                                                                                     |
| G18 | Slot attributes go to React as given. HTML names such as `readonly`, `for`, `class` are not React prop names.                                                                                  | `api.ts:118`, `create-parts.tsx` (`PartView`)                      | `Attributes` uses HTML attribute names. Each adapter maps them.                                                                                                                   |
| G19 | The proposal says a server adapter calls `destroy` after a render. No adapter does.                                                                                                            | `old/proposal.md:277-278`                                          | No adapter calls `destroy`, on the client or the server. A server instance holds no work, because `api` is inert (G1, D16).                                                       |
| G20 | Stale comments in `api.ts`: check names "stated by the kind", and "a scope of the wrong shape is rejected".                                                                                    | `api.ts:636`, `:817`                                               | Do not carry them into the new source.                                                                                                                                            |

## 10. Deviations and decisions

Every item is decided. "Decided by" names the owner or the plan; the register in
[06-roadmap.md](./06-roadmap.md) holds the reason.

| #   | Record                                                                                                                                                                                                                                             | Decided by                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| D1  | `@oxform/core/adapter` is the fourth core entry point (7.2, owner decision 8). `optionKinds` moves from `Form` to it.                                                                                                                              | Owner                           |
| D2  | The direction lists `scope(path)` as an instance member from `handles`. `Form` has no `scope` (`api.ts:367-405`).                                                                                                                                  | Resolved                        |
| D3  | `OptionTypes` is added to `@oxform/core` (D34 replaced `OptionDescriptors` and `OptionsFrom`). `ResolveSelf` and `FormTypes` are not exported (2.2). The direction lists `ElementTag`.                                                             | Plan, by default (06, D14)      |
| D4  | The renames of 7.1 are applied (owner decision 10).                                                                                                                                                                                                | Owner                           |
| D5  | The direction refers to section 5 for the list of internal channels.                                                                                                                                                                               | Resolved                        |
| D6  | Check names outside the field sugar are typed from the chain. If the depth guard fails, they stay `string`, and `limits.mdx` states it (G4, design item 10).                                                                                       | Plan, by default (06, D21)      |
| D7  | `CheckApi.at` and `set` accept `''` for the root (7.7). The core supplies an id when no adapter does, so "the form id comes from the adapter" holds for rendered forms.                                                                            | Plan, by default (06, D15, D22) |
| D8  | No `createX` function is exported (3.1, owner decision 13). G6 is closed.                                                                                                                                                                          | Owner                           |
| D9  | Solid hooks keep the `use*` names, for parity with React.                                                                                                                                                                                          | Plan, by default (06, D33)      |
| D10 | The `scope` prop is the only way to scope a part, and `within(scope)` is removed (owner decision 15). The limit stays: a part without `scope`, whose name is also a path of the form, writes to the form's field (`old/spike-results.md:160-161`). | Owner                           |
| D11 | A form with no `submit` spreads no root group. `Root` renders no element and only provides the instance (3.2, 6.1).                                                                                                                                | Plan, by default (06, D49)      |
| D12 | Every need is required (owner decision 17). The slot groups are split so that each needs what it uses (3.2).                                                                                                                                       | Owner (rule), plan (design)     |
| D13 | The runtime error for a missing need is thrown at `create`, before the extension's `api` runs (3.1).                                                                                                                                               | Plan (06, D52)                  |
| D14 | Built-ins read `validation` through the validation link, so no built-in has an optional need (3.1, section 5).                                                                                                                                     | Plan (06, D53)                  |

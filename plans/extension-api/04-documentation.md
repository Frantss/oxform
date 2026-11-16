# Documentation plan

Status: complete, revision 4. This file owns the public docs site map, the example catalogue, the page
templates, agent-first delivery and the contributor-docs rewrite. It agrees with
[00-direction.md](./00-direction.md) (revision 4) and uses its principles, glossary, entry points and
canonical names without restating them. Signatures are in [01-public-api.md](./01-public-api.md), folders and
build in [02-structure.md](./02-structure.md), tests in [03-testing.md](./03-testing.md), the migration text in
[05-migration-guide.md](./05-migration-guide.md), the order of work in [06-roadmap.md](./06-roadmap.md) and
the comparison with other form libraries in [07-comparison.md](./07-comparison.md).

Revision 2 moves the plan from `explorations/behavior-api/` to `explorations/extension-api/`. In this file,
`readme` is `explorations/extension-api/readme.md`, `EX` is `explorations/extension-api/examples`, `KIT` is
`explorations/extension-api/kit` and `PG` is `explorations/behavior-api/playground/src/examples`.

All documentation is written new. No page of today's site is updated in place.

## 1. Audiences and goals

| Audience                 | Goal                                                                 | Enters at                          |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------- |
| Developer composing lean | Build a form as a short chain of extensions and pay only for them    | Quick start, Compose               |
| Application developer    | Get a complete form with the `standard` preset and render it         | Quick start (last step), Recipes   |
| Extension author         | Add options, state, api, slots or field members and package them     | Extend, Main APIs, Concepts        |
| Coding agent             | Do any task above from text only, with no site and no guessing       | `llms.txt`, page Markdown, package |
| Contributor              | Change the library with the repository rules and the internal design | `AGENTS.md`, `docs/*.md`           |

Site goals, in priority order:

1. Teach the five principles and the UI SDK inspiration (`00-direction.md#Principles`).
2. Put the main APIs first: `defineForm` with `.extend`, `.configure` and `.create`, `defineExtension`,
   `option`, `on`, `slots`, `defineSlots`, `defineScope`, and `scope(path)` on the instance.
3. Teach by representative examples of composing and extending forms (section 4).
4. Give a human and an agent the same fact in the same place.

## 2. Baseline

- Today's site has three framework roots: `core`, `react`, `solid` (`apps/docs/content/docs/meta.json:2`).
  `core` is one page (`apps/docs/content/docs/core/meta.json:4`). Guides, API pages and recipes are repeated
  per framework (`react/meta.json:4`, `solid/meta.json:4`).
- The page route picks the layout from the first URL segment (`apps/docs/src/routes/docs.$.tsx:54`).
- The stack is Fumadocs on TanStack Start: `fumadocs-core` 16.17.8, `fumadocs-mdx` 15.4.10,
  `fumadocs-twoslash` 4.0.4, `fumadocs-typescript` 5.6.0 (`apps/docs/package.json:22-26`). Pages are
  prerendered (`apps/docs/vite.config.ts:20-23`) and also served by srvx (`apps/docs/README.md:82-84`).
- Snippets marked `ts twoslash` are type-checked in `docs:build`, not in `docs:check`
  (`apps/docs/README.md:21-22`).
- The site has no `llms.txt`, no Markdown route and no page actions. Search is the only machine endpoint
  (`apps/docs/src/routes/api/search.ts:9`).
- Known tool faults: `auto-type-table` gives an empty table for a callable export, and its stringified data
  leaks into search results (`reports/fumadocs-typescript.md:3-14`). Recheck both at 5.6.0.
- Package readmes repeat the API reference: core 648 lines, React 437, Solid 218.

## 3. Top-level organisation

### Approach A: by concept and entry point (decided)

One tree and one sidebar. Sections are Start, Main APIs, Concepts, Compose, Extend, Built-in behaviors,
Presets, Adapters, Recipes, Migration. The three reference folders are named after the core entry points:
`core/` is `@oxform/core`, `behaviors/` is `@oxform/core/behaviors`, `presets/` is `@oxform/core/presets`.
The URL of a reference page tells the import line.

- Verification: the root `meta.json` lists the sections in the order above. A check compares the pages of
  `core/`, `behaviors/` and `presets/` with the export inventory in `01-public-api.md`: each exported function
  or value has a page, and each page names an export of its entry point. The pages of form methods
  (`core/extend`, `core/configure`, `core/create`) and `behaviors/scope` (an instance member) are exempt. Each main API is reachable in one
  click from the introduction.
- Risk: a React user finds no "React" root. Mitigation: `adapters/react` is linked from the introduction and
  the quick start, and rendering snippets use framework tabs.
- Risk: every old URL breaks. Mitigation: this is a breaking release. Add one redirect from each old root
  (`/docs/react`, `/docs/solid`, `/docs/core`) to the introduction, and change the health check path
  (`apps/docs/README.md:90`).
- Standards: one fact in one place (no page per framework), and the entry point shows the category
  (`00-direction.md#Packages and entry points`).

### Approach B: core root plus framework roots

Keep sidebar roots as today: `core/` holds concepts, main APIs, behaviors and presets, and each framework root
holds its quick start, rendering guide and recipes. UI SDK uses this shape, with one `llms.txt` per root
(<https://ui-sdk.dev/llms.txt>).

- Verification: each framework root builds, and a check finds no core concept explained inside a framework root.
- Risk: guides and recipes are written three times and drift, as today. Mitigation: shared MDX with
  `<include>`, which adds build complexity.
- Risk: the main APIs sit one root away from the reader who enters at a framework. This conflicts with site
  goal 2.
- It fits UI SDK because it ships components per framework. Oxform adapters share one surface, `createParts`
  and `usePart` (`00-direction.md#Canonical public names`).

### Rejected

- By audience. The same API page would be needed in two places.
- By principle. A task does not map to one principle. Pages carry principle tags instead.

### Decision

Use approach A. Remove `root: true` folders, and write section labels as separators in the root `meta.json`
(`---Main APIs---`; the installed loader parses them, `fumadocs-core/dist/dynamic-CymQi8F2.js:217`).

## 4. Example catalogue

Owner rule: examples are chosen, not copied (`00-direction.md#Documentation direction`). Each feature has one representative
example that solves a real problem in a simplified way. Nothing in an example is there only to exercise the
API. Every guide and reference page points to a row of this catalogue. `examples/*`, the shared example kit
and the migration guide use the same rows.

### 4.1 Domains

Five domains are reused across all pages. A page does not invent a new one.

| Domain         | Form                                                                   | Why it is in the set                                               |
| -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Sign-in        | `email`, `password`                                                    | The smallest real form. Shows what a lean chain needs and no more  |
| Checkout       | `email`, `country`, `region`, `card`, `billing` and `shipping` address | Needs most of the preset. Has a repeated block and formatted input |
| Team invites   | `team`, `seats` (a number), `members[]` of `{ email, role }`           | Arrays, rows, pasted input, a number input, a lookup on the server |
| Article editor | `title`, `body`                                                        | Long-lived editing: drafts, advice, unsaved changes, discard       |
| Member filter  | `query`, `role`                                                        | A form with no validation and no submit                            |

### 4.2 Catalogue

Verdict on the spike example: **keep** (meets the rule), **move** (keep the idea, change the domain) or
**replace** (it only exercises the API).

| Id  | Feature                                          | Real problem                                                                                       | Simplified example                                                                                                                                                                                                                                                                           | Why representative, and the spike example                                                                                                                                         |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E01 | `defineForm`, `.extend`, `.create`: a lean chain | A sign-in form on a public page must load fast and needs no arrays, reset or handles               | Sign-in: `values`, `validation`, `check('error')`, `status`, `events`, `submit`, then `slots(...)` with the built-in groups `rootSlots`, `fieldErrorSlots` and `submitSlots`. Each need of the chain and of the groups is met (`01-public-api.md`, 3.1 and 3.2)                              | Each line of the chain answers a need of the form. **Keep** `login` (`EX/03-validation-and-checks.ts:90`, `KIT/lean-form.ts`). Drop the newsletter copy (`PG/newsletter.tsx`)     |
| E02 | A form with no validation                        | A filter bar changes a list as the user types. It has nothing to validate or submit                | Member filter: `values`, `status`, `events`. "Clear filters" shows while the form is dirty. `fieldSlots` gives the `field` part with no check. The form has no `submit`, so it spreads no root group, and its `Root` renders no element (`01-public-api.md`, 3.2). It writes no slot by hand | Shows that validation is optional for a reason. **Replace** `minimal` (`EX/03-validation-and-checks.ts:110`), which has no use case                                               |
| E03 | The `standard` preset                            | A checkout needs arrays, reset, handles and every part. Writing nine lines per form is noise       | Checkout: `defineForm({...}).extend(standard)`                                                                                                                                                                                                                                               | The form uses what the preset adds. **Replace** `signup` (`EX/02-using-a-form.tsx:18`): three fields do not show why a preset exists                                              |
| E04 | Writing a preset                                 | A team wants every form to have the same banner, submit rule and input clean-up                    | `houseForm`: `standard`, then E08, E12, E13. Checkout and team invites both use it                                                                                                                                                                                                           | A preset that adds, which a house style needs. `KIT/lean-form.ts` is a preset that removes, and it is E01. States the generic signature (`readme:342-343`)                        |
| E05 | `.configure` and `create` options                | Validators and the save function are the same for every editor. The article differs per page       | Article editor: `.configure({ error, saveDraft })` at module scope, `create({ defaultValues })` or `Root` props per article                                                                                                                                                                  | Each source has a reason, and precedence is visible. **Replace** the `configure` calls in `EX/02`, `03`, `05`: they have one source only                                          |
| E06 | `defineExtension`: options, state, api, a slot   | A writer loses a draft when the tab closes                                                         | Article editor: `autosave` with `needs` (`values`, `validation`), `saveDraft`, `autosaveDelay`, state `autosave`, `form.autosave.flush()`, part `autosaveStatus`                                                                                                                             | Uses every key for a reason, and its timer starts on a change, so creation is inert. **Keep** `KIT/autosave.ts`                                                                   |
| E07 | `Self` in an option                              | When the server rejects a draft, the application must show it on the form                          | `autosave` adds `onSaveError(error, form)`. The application sets a warning on `title` through `form`                                                                                                                                                                                         | The callback needs the instance. **Replace** `EX/06-custom-behaviors.ts:46`, where `Self` is declared and the form is not used                                                    |
| E08 | `values.intercept`                               | Emails pasted from a spreadsheet have spaces and capitals, so lookups fail                         | Team invites: `normalizeEmail` trims and lower-cases string values at paths that end in `email`                                                                                                                                                                                              | One hook, one problem, no api added. **Replace** `audit` (`EX/06-custom-behaviors.ts:153`): it joins three unrelated hooks in one toy extension                                   |
| E09 | `validation.onRun`, `submit.onResult`            | The product team must know which checkout fields fail and how many orders complete                 | Checkout: `funnel` reports failing paths and the submit result to an `onTrack` option                                                                                                                                                                                                        | Observation only, which is what these hooks are for. **Replace** the `analytics` line in `audit`                                                                                  |
| E10 | `submit.intercept`                               | An invite to an address outside the company cannot be undone                                       | Team invites: `confirmExternal` cancels the attempt until an `onConfirm` option resolves true                                                                                                                                                                                                | A refusal before validation, with a reason. **Replace** `confirmLeaving` in `audit`                                                                                               |
| E11 | Field members with `on<T>`                       | A card number is shown as `4242 4242 …` and the payment provider needs digits only                 | Checkout: `masks` with a `masks` option, and `field('card.number').unmasked()` on string fields                                                                                                                                                                                              | The guard is needed: a mask has no meaning on a non-string field. **Keep** `KIT/masks.ts`, `PG/payment.tsx`                                                                       |
| E12 | `defineSlots`: a slot group                      | Every form needs the same message after a failed submit                                            | `formErrorSlots`: a `formError` part that is present after an unsuccessful submit. Used by sign-in and by `houseForm`                                                                                                                                                                        | Small, states a state need, and two forms use it. **Keep** `EX/06-custom-behaviors.ts:174`                                                                                        |
| E13 | Replacing a slot with `slots(...)`               | The design system disables the submit button until the form is valid. The built-in part does not   | A `submit` slot with the same key, whose `attrs` set `disabled` while submitting or invalid                                                                                                                                                                                                  | Changes attributes, which a child function cannot do. **Replace** the key test in `spike/src/slots.spec.ts`                                                                       |
| E14 | A second check                                   | A title over 60 characters is cut in search results. The writer must know, and must still publish  | Article editor: `warnings` is `check('warning')` plus a `fieldWarning` part                                                                                                                                                                                                                  | Advice that must not block is the reason for a second check. **Keep** `KIT/warnings.ts`. Drop `risk` in `EX/03-validation-and-checks.ts:69`: it becomes one line under Variations |
| E15 | `defineScope`, placed twice                      | Billing and shipping address are the same block, with the same rules                               | Checkout: `address` at `billing` and `shipping`, one `AddressFields` component that takes a scope, and `copyAddress(from, to)`                                                                                                                                                               | The standard case of a repeated block. **Keep** `EX/08-scopes.tsx`, `PG/checkout.tsx`                                                                                             |
| E16 | `form.scope(path)` on an array item              | A row component must not know its index                                                            | Team invites: `MemberRow` takes `Scope<Member>` from `form.scope('members.0')` and renders `email` and `role`                                                                                                                                                                                | Shows that a scope needs no `defineScope`. New: the spike names it only in prose (`readme:188-190`)                                                                               |
| E17 | `arrays`                                         | The user adds, removes and reorders invitees. Focus and errors must stay with the row              | Team invites: append, remove, move, with item ids as keys                                                                                                                                                                                                                                    | Three operations that a UI has buttons for. **Move** `EX/04-arrays.tsx`: keep `members`, drop `tags` and the list of every mutation (the reference has it)                        |
| E18 | `validation` and `check('error')` by event       | An address that is already a member must be refused before submit, without a request per key press | Team invites: format on `change`, a lookup on `blur`, all on `submit`. A newer run discards a stale result                                                                                                                                                                                   | Each event has a reason. **Move** `PG/async-validation.tsx` (a taken username) to this domain                                                                                     |
| E19 | `submit`                                         | The server refuses a password. The form must show it and stay usable                               | Sign-in: `onSubmit` awaits the request and sets an error on `password`. The button shows `submitting`                                                                                                                                                                                        | The full submit lifecycle in one handler. **Keep** `PG/login.tsx`                                                                                                                 |
| E20 | `handles`                                        | The payment service returns errors as a list of paths                                              | Checkout: `for (const issue of issues) form.field(issue.path).setError([issue])`                                                                                                                                                                                                             | Code outside a component needs a bound field. New: the spike uses handles everywhere and gives no reason for them                                                                 |
| E21 | `values`: read, write, `onChange`                | A change of country makes the region invalid                                                       | Checkout: `values.onChange` on `country` sets `region` to `''`                                                                                                                                                                                                                               | A dependent field is the common reason to write a value from code. New                                                                                                            |
| E22 | `status`                                         | The writer must see unsaved changes, and "Publish" must wait for validation                        | Article editor: an "Unsaved changes" label from `status.form.dirty`, and a button disabled while `validating`                                                                                                                                                                                | Two flags, two visible effects. **Replace** `StatusChips` (`PG/profile.tsx`), which prints flags                                                                                  |
| E23 | `reset`                                          | "Discard" must return to the last saved text, not to the first loaded text                         | Article editor: reset to defaults, and after a save, reset with the saved values as the new baseline                                                                                                                                                                                         | Shows why reset takes values. **Replace** the option list in `EX/05-status-reset-submit.tsx:68`                                                                                   |
| E24 | `events` with a control that has no DOM event    | The role select of the design system reports `onValueChange`, not `input`                          | Team invites: `useField('role')`, then `change(value)` and `blur()`                                                                                                                                                                                                                          | One control is enough. **Move** `PG/third-party.tsx`: drop the star rating and the slider                                                                                         |
| E25 | `createEffect`                                   | The browser must warn before the tab closes with unsaved text                                      | Article editor: an effect on `status.form.dirty` adds and removes a `beforeunload` listener                                                                                                                                                                                                  | Code outside the form and outside a component. New: `EX/06-custom-behaviors.ts:215` only names the function                                                                       |
| E26 | Server rendering                                 | The sign-in page is rendered on the server. Ids and values must match after hydration              | Sign-in: the form at module scope, one instance per render, the id from the adapter                                                                                                                                                                                                          | The smallest form shows the rules without noise. Source of the rules: `explorations/behavior-api/proposal.md:242-279`                                                             |
| E27 | Request handling                                 | The sign-in form must work before JavaScript loads                                                 | Sign-in: a handler calls `create({ defaultValues: body })`, awaits `validation.run()`, and renders the same instance with `<Root form={form}>`                                                                                                                                               | One form serves the browser and the handler. New: the first spike has it as prose only                                                                                            |
| E28 | Testing an extension                             | An extension author must test `autosave` without a preset or a DOM                                 | `defineForm(...).extend(values).extend(validation).extend(autosave).create(...)` with fake timers                                                                                                                                                                                            | The smallest form that meets the needs. **Keep** `EX/07-runtimes-and-testing.tsx:42-58`. Drop the lower-case toy at `:31-40`                                                      |
| E29 | `createParts` and the element map                | Each slot declares its element. The application overrides one only where the design needs another  | Sign-in: `createParts(signIn)`, or `createParts(signIn, { fieldError: 'span' })` to override one element, then `Root`, `Field`, `FieldError`, `Submit`                                                                                                                                       | The first render a reader writes. **Move** `EX/02-using-a-form.tsx:29`                                                                                                            |
| E30 | `usePart`                                        | A country field is a `<select>`, and the `field` part renders an `<input>`                         | Checkout: `CountrySelect` renders the `field` slot in a `select`                                                                                                                                                                                                                             | A different element for an existing slot. **Move** `PlanSelect` (`EX/02-using-a-form.tsx:50-54`)                                                                                  |
| E31 | `useScope` and the `scope` prop                  | A reusable block must render `Field` with names relative to its scope                              | Checkout: `useScope('billing')` gives the scope, and `AddressFields` passes it as `<Field scope={scope}>`                                                                                                                                                                                    | The rendering side of E15 and E16. **Keep** `EX/08-scopes.tsx:68-90`                                                                                                              |
| E32 | `useSelector`                                    | An order summary must update when one value changes, without a render of the whole form            | Checkout: `useSelector(state => state.values.country)` drives the shipping line                                                                                                                                                                                                              | A selector with a visible result. **Replace** `EX/02-using-a-form.tsx:70`, which reads `dirty` and shows nothing                                                                  |
| E33 | `useArray`                                       | A list has no fixed number of parts                                                                | Team invites: the rows of E17 from the hook                                                                                                                                                                                                                                                  | The rendering side of E17. **Keep** the hook use in `EX/04-arrays.tsx`                                                                                                            |

Rules for a new example: it belongs to a domain of 4.1, it states its problem in one sentence, and it does not
add a field or a call that the problem does not need. Toy extensions (`named`, `shout` in
`type-tests/extension-api.ts` and `spike/src/form.spec.ts`) stay in tests and never appear on a page.

## 5. Site map

Root: `apps/docs/content/docs/`. Each folder has a `meta.json` with `title` and an ordered `pages` list.
Principles: C composable, R reusable, E extensible, T type-safe, L lightweight. The "Example" column is a
catalogue row. A page with no example is a table, an index or a concept whose rules cite `readme`.

```
docs/
├── meta.json            index, quick-start, comparison, choose-an-api, limits, then the sections below
├── index.mdx  quick-start.mdx  comparison.mdx  choose-an-api.mdx  limits.mdx
├── core/                Main APIs          (@oxform/core)
├── concepts/            Concepts
├── compose/             Compose guides
├── extend/              Extend guides
├── behaviors/           Built-in behaviors (@oxform/core/behaviors)
├── presets/             Presets            (@oxform/core/presets)
├── adapters/            Adapters           (@oxform/react, @oxform/solid, @oxform/solid/v2)
├── recipes/             Recipes
└── migration/           Migration
```

### Start

| Path                | Title               | Purpose                                                                                                                                           | P     | Example                                                        |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------- |
| `index.mdx`         | Introduction        | What Oxform is, the five principles, the UI SDK inspiration, the entry-point map                                                                  | CRETL | E06 (short form of `00-direction.md#The model in one example`) |
| `quick-start.mdx`   | Quick start         | Install, write the sign-in chain, render it, submit it, then swap the chain for `standard`                                                        | C L T | E01, E29, E19                                                  |
| `comparison.mdx`    | Comparison          | Features and size of Oxform, TanStack Form, React Hook Form and Formisch, with sources. `07-comparison.md` owns the outline and the content rules | L T   | The sign-in and team invites forms (E01, E17 to E19)           |
| `choose-an-api.mdx` | Which API do I need | Decision tables only: task to API, need to extension hook, chain or preset, `slots` or `defineExtension`                                          | CRE   |                                                                |
| `limits.mdx`        | Known limits        | The limits of section 5.2, each with symptom, cause and what to do                                                                                | T L   |                                                                |

### `core/`: Main APIs

| Path                        | Title               | Purpose                                                                                   | P     | Example                    |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------------- | ----- | -------------------------- |
| `core/index.mdx`            | Main APIs           | Export list by group, and form to instance as four lines of code                          | C     | E01                        |
| `core/define-form.mdx`      | `defineForm`        | Fix `Values` from `schema` and `defaultValues`. Also `name`, `id`, `scopes`               | T     | E01                        |
| `core/extend.mdx`           | `form.extend`       | Apply an extension or a preset. Order, needs, duplicates                                  | C T   | E01, E06                   |
| `core/configure.mdx`        | `form.configure`    | Set typed defaults for every instance                                                     | T     | E05                        |
| `core/create.mdx`           | `form.create`       | Create an instance in any runtime: api, `store`, `id`, `destroy()`                        | C     | E05, E28                   |
| `core/define-extension.mdx` | `defineExtension`   | One object: `name`, `options`, `state`, `api`, `slots`, `fields`. `Extendable`, `Needs`   | E R T | E06                        |
| `core/option.mdx`           | `option`            | Option descriptors, their kinds, and `Self`                                               | T E   | E06, E07, E11              |
| `core/on.mdx`               | `on`                | Field members for fields of one value type                                                | E T   | E11                        |
| `core/slots.mdx`            | `slots`             | Add or replace slots on a form with no other declaration                                  | C E   | E13                        |
| `core/define-slots.mdx`     | `defineSlots`       | Package a slot group with stated needs                                                    | R     | E12                        |
| `core/define-scope.mdx`     | `defineScope`       | Describe a sub-object without a path: schema, defaults, validators per check              | R T   | E15                        |
| `core/create-effect.mdx`    | `createEffect`      | Subscribe a selector on an instance                                                       | E     | E25                        |
| `core/types.mdx`            | Types and utilities | Read-back types (`ValuesOf`, `InstanceOf`, …), path types, `get`, `idPart`, `FormContext` | T     | E04 (the preset signature) |

### `concepts/`

| Path                                 | Title                       | Purpose                                                                                                    | P   | Example  |
| ------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------- | --- | -------- |
| `concepts/forms-and-chains.mdx`      | Forms, chains and presets   | A form is immutable. `.extend` runs in order. A preset is a function from form to form. Types are inferred | C T | E01, E03 |
| `concepts/extensions-and-needs.mdx`  | Extensions and needs        | What an extension adds, how needs are stated and checked, duplicate rules                                  | E T | E06      |
| `concepts/options.mdx`               | Options                     | Descriptors, the three sources, precedence, `configure` order                                              | T   | E05      |
| `concepts/changes-and-hooks.mdx`     | Changes and extension hooks | Interceptors, the write, listeners. The order of extension hooks is chain order                            | C E | E08, E21 |
| `concepts/checks-and-validation.mdx` | Checks and validation       | A check, events, `blocking`, `exclusive`, stale runs. The schema validates nothing                         | C T | E18, E14 |
| `concepts/slots-and-parts.mdx`       | Slots and parts             | A slot names no component. The adapter makes parts. Replace by key, no wrapping                            | C R | E29, E13 |
| `concepts/scopes.mdx`                | Scopes                      | Placed scopes, `form.scope(path)`, the six conflict rules                                                  | R T | E15, E16 |
| `concepts/server-rendering.mdx`      | Server rendering rules      | Shared forms, one instance per render, inert `api`, ids from the adapter                                   | C   | E26      |

### `compose/`

| Path                                  | Title                     | Purpose                                                                                                           | P     | Example       |
| ------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----- | ------------- |
| `compose/index.mdx`                   | Compose a form            | The ladder from `values` only to `standard`, with the measured size of each tier (`03-testing.md`, "Size report") | C L   | E02, E01, E03 |
| `compose/lean-form.mdx`               | A lean form               | The sign-in chain, line by line, and what each missing extension removes                                          | C L T | E01           |
| `compose/form-without-validation.mdx` | A form without validation | A filter bar from three extensions                                                                                | C L   | E02           |
| `compose/standard-preset.mdx`         | Use the `standard` preset | When the preset is the right choice, and what it costs                                                            | C L   | E03           |
| `compose/your-own-preset.mdx`         | Your own preset           | Write `houseForm` and use it in two forms                                                                         | R C T | E04           |
| `compose/slot-group.mdx`              | A reusable slot group     | Write a group, state its needs, spread it into two forms                                                          | R     | E12           |
| `compose/repeated-block.mdx`          | A block used twice        | One scope at `billing` and `shipping`, one component                                                              | R T   | E15, E31      |
| `compose/array-rows.mdx`              | Rows of an array          | A row component that takes the scope of its item                                                                  | R T   | E16, E17, E33 |

### `extend/`

| Path                              | Title                               | Purpose                                                                                 | P     | Example |
| --------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- | ----- | ------- |
| `extend/index.mdx`                | Extend a form                       | A decision table: `slots`, a preset, or `defineExtension`. The table of extension hooks | E     |         |
| `extend/write-an-extension.mdx`   | Write an extension                  | `autosave` from an empty object to options, state, api and a slot                       | E R T | E06     |
| `extend/option-with-instance.mdx` | An option that takes the form       | `Self` in an option's parameters                                                        | E T   | E07     |
| `extend/intercept-a-change.mdx`   | Change a value before it is written | `values.intercept`, and `cancel()`                                                      | E     | E08     |
| `extend/observe-runs.mdx`         | Observe validation and submit       | `validation.onRun` and `submit.onResult`                                                | E     | E09     |
| `extend/refuse-a-submit.mdx`      | Refuse a submit                     | `submit.intercept`                                                                      | E     | E10     |
| `extend/field-members.mdx`        | Add members to fields               | `fields` with `on<T>`, on form handles and scoped handles                               | E T   | E11     |
| `extend/second-check.mdx`         | Add a second check                  | `check('warning')` with its option and its part                                         | E T   | E14     |
| `extend/replace-a-slot.mdx`       | Replace a slot                      | A slot with an earlier key replaces it                                                  | E     | E13     |
| `extend/test-and-share.mdx`       | Test and share an extension         | Test on the smallest form. Publish with `@oxform/core` as a peer                        | R E   | E28     |

### `behaviors/`: Built-in behaviors

One reference page per extension. The function behind an extension is internal and has no page.
`behaviors/index.mdx` is one table: extension, needs, api member, state key, options.

| Path                        | Title              | Purpose                                                                                                                                    | P   | Example  |
| --------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --- | -------- |
| `behaviors/index.mdx`       | Built-in behaviors | The table above, in the order `standard` applies them                                                                                      | C L |          |
| `behaviors/values.mdx`      | `values`           | Read, write, intercept and observe values                                                                                                  | C E | E21, E08 |
| `behaviors/validation.mdx`  | `validation`       | Run checks, stale runs, `issues`, `checks`, `onRun`                                                                                        | C   | E18      |
| `behaviors/check.mdx`       | `check`            | One named check: option, state key, api key                                                                                                | C E | E18, E14 |
| `behaviors/status.mdx`      | `status`           | Field and form status. `defaultStatus` options                                                                                             | C   | E22      |
| `behaviors/events.mdx`      | `events`           | `change`, `focus`, `blur` and event validation                                                                                             | C   | E24      |
| `behaviors/arrays.mdx`      | `arrays`           | Array operations and stable item ids                                                                                                       | C   | E17      |
| `behaviors/reset.mdx`       | `reset`            | Reset all or one field, with values and `keep`                                                                                             | C   | E23      |
| `behaviors/submit.mdx`      | `submit`           | The submit lifecycle, `intercept`, `onResult`                                                                                              | C E | E19, E10 |
| `behaviors/handles.mdx`     | `handles`          | `field`, `array`, `scope`, check sugar, field members                                                                                      | C T | E20      |
| `behaviors/scope.mdx`       | `scope(path)`      | View any object path as a `Scope`. An instance member that `handles` adds. A `reference` page. The `core/` list of the sidebar links to it | R T | E16      |
| `behaviors/slot-groups.mdx` | Slot groups        | `rootSlots`, `fieldSlots`, `fieldErrorSlots`, `submitSlots`, `resetSlots`: needs, attributes, state                                        | R   | E01, E12 |

### `presets/`, `adapters/`, `recipes/`, `migration/`

| Path                                  | Title                          | Purpose                                                                                | P   | Example                 |
| ------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------- | --- | ----------------------- |
| `presets/standard.mdx`                | `standard`                     | The chain it applies, its options, state, api and parts, its size                      | C L | E03                     |
| `adapters/index.mdx`                  | Adapters                       | The shared surface and the one import that changes                                     | R   | E29                     |
| `adapters/react.mdx`                  | React                          | `@oxform/react`: `createParts`, parts, adapter hooks, the `scope` prop, `usePart`, ids | T   | E29, E30, E31, E32, E33 |
| `adapters/solid.mdx`                  | Solid 1                        | `@oxform/solid`: the same surface with Solid reactivity                                | T   | E29, E30, E31, E32, E33 |
| `adapters/solid-v2.mdx`               | Solid 2                        | `@oxform/solid/v2`: setup, compiler, differences from Solid 1                          | T   | E29                     |
| `recipes/index.mdx`                   | Recipes                        | A list of the recipes with one line each                                               |     |                         |
| `recipes/lookup-on-blur.mdx`          | Validate on the server on blur | A lookup on blur, and stale results                                                    | T   | E18                     |
| `recipes/server-errors.mdx`           | Errors from the server         | One error from `onSubmit`, and a list of errors by path                                | T   | E19, E20                |
| `recipes/dependent-fields.mdx`        | Dependent fields               | Clear one field when another changes                                                   | C   | E21                     |
| `recipes/unsaved-changes.mdx`         | Unsaved changes                | A label, a disabled button, and a warning before the tab closes                        | C   | E22, E25                |
| `recipes/discard-changes.mdx`         | Discard changes                | Reset to the last saved values                                                         | C   | E23                     |
| `recipes/third-party-controls.mdx`    | Third-party controls           | A control that reports a value and no DOM event                                        | E   | E24                     |
| `recipes/another-element.mdx`         | A part with another element    | `usePart` for a `<select>`                                                             | E   | E30                     |
| `recipes/derived-ui.mdx`              | Read one value                 | `useSelector` for a summary                                                            | T   | E32                     |
| `recipes/form-without-javascript.mdx` | A form without JavaScript      | Validate in a request handler and render the errors                                    | C   | E27                     |
| `migration/index.mdx`                 | Migrate from 0.x               | The agent-focused guide. Text owned by `05-migration-guide.md`                         |     |                         |

Total: 72 pages.

### 5.1 Quick start decision

The quick start shows the lean chain first and has one page. Reasons:

- No hand-written types remain. The sign-in chain is six `.extend` lines and one `slots(...)` call
  (`KIT/lean-form.ts:18-39`). Revision 1 needed a second quick start because a lean form cost about 15 lines of
  kind types. That cost is gone, so the second page is removed.
- The chain is the model. A reader who has written it knows what `standard` is: the last step of the page
  replaces the chain with `.extend(standard)` and states what that adds (arrays, reset, handles, the other
  parts) and the measured size of both chains (`03-testing.md`, "Size report").
- An application developer who wants only the preset reads one step more, not another page.

The lean chain writes no slot by hand. It spreads `rootSlots` (needs `submit`), `fieldErrorSlots` (needs
`events`, `values` and the `error` state) and `submitSlots` (needs the `status` state), and the chain has each
need (`01-public-api.md`, 3.2, direction, owner decisions 14 and 17). The spike's `KIT/lean-form.ts` writes
its `root` slot by hand, because the spike's `rootSlots` needs `reset`. The kit does not copy that.

### 5.2 Known limits that the documentation must state

Each limit is stated on `limits.mdx` and repeated as one "Common mistakes" row on the page where it occurs.

| Limit                                                                                                                                       | Stated on                                                                                  | Evidence                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| A `schema` only types `Values`, on a form and on a scope. Validation needs a check option such as `error: { submit: schema }`               | `quick-start`, `core/define-form`, `concepts/checks-and-validation`, `core/define-scope`   | `readme:202`, `00-direction.md#Settled decisions`      |
| A check extended after `handles` has no sugar (`field.warning()`), in the types and at runtime                                              | `behaviors/handles`, `behaviors/check`, `extend/second-check`, `compose/your-own-preset`   | `readme:418-419`                                       |
| A form without `handles` has no `field(path)`. A form without `validation` has no check sugar                                               | `compose/lean-form`, `behaviors/handles`                                                   | `readme:420-421`, `EX/03-validation-and-checks.ts:104` |
| An option of an extension applied after `.configure` is a type error there. Call `configure` after the last `.extend`                       | `core/configure`, `concepts/options`                                                       | `readme:177-179`, `readme:351-352`                     |
| An unknown option is a type error only. Nothing checks it at runtime                                                                        | `core/configure`, `core/create`                                                            | `readme:358`                                           |
| A duplicate option name throws at `.extend`. A duplicate api key or state key throws at `create`. A base member cannot be replaced          | `core/extend`, `concepts/extensions-and-needs`, `extend/test-and-share`                    | `readme:172-173`                                       |
| Every need is required. A missing need is a type error at `.extend` and throws at `create`, before an instance exists. No need is optional  | `core/extend`, `core/define-extension`, `concepts/extensions-and-needs`, `behaviors/index` | `01-public-api.md`, 3.1                                |
| `fieldSlots` and `fieldErrorSlots` both give the `field` part. Spread one. `fieldSlots` after `fieldErrorSlots` drops `aria-describedby`    | `behaviors/slot-groups`, `compose/lean-form`                                               | `01-public-api.md`, 3.2                                |
| A form with no `submit` spreads no root group. Its `Root` renders no element. Add an element in the component when the page needs one       | `behaviors/slot-groups`, `compose/form-without-validation`                                 | `01-public-api.md`, 3.2                                |
| The six scope conflict rules, with their errors                                                                                             | `concepts/scopes`, `core/define-scope`                                                     | `readme:195-202`                                       |
| A part with no `scope` whose name is also a path of the form writes to the form's field                                                     | `concepts/scopes`, `compose/repeated-block`                                                | `03-testing.md`, "Matrix" (the pinned gap)             |
| A form validator and a scope validator on one path both run. One field can report two issues                                                | `concepts/scopes`, `compose/repeated-block`                                                | `readme:199`                                           |
| A partial default for a scope needs a cast                                                                                                  | `core/define-scope`                                                                        | `readme:204`                                           |
| A preset cannot change the schema. Reuse is `defineForm(init).extend(preset)`                                                               | `compose/your-own-preset`, `concepts/forms-and-chains`                                     | `readme:256-257`                                       |
| When `.extend` rejects an extension, the message reads as a preset mismatch. The line is correct                                            | `core/extend`, `extend/write-an-extension`                                                 | `readme:258-259`                                       |
| `on<T>` cannot express every condition by path. The guard decides at runtime. Field members on a form with no `field` api throw at `create` | `core/on`, `extend/field-members`                                                          | `readme:252`, `readme:363-364`                         |
| `slots(...)` outside `.extend(...)` has no form to read. A reusable piece is a `defineSlots` group                                          | `core/slots`, `core/define-slots`                                                          | `readme:404-406`                                       |
| A slot group states its needs by hand, in the `slot` annotation and in `needs`. A difference between the two is a type error                | `core/define-slots`, `compose/slot-group`                                                  | `EX/readme.md:65-68`, `01-public-api.md`, 7.5          |
| A slot cannot be wrapped. A later slot with the same key replaces it                                                                        | `extend/replace-a-slot`, `concepts/slots-and-parts`                                        | `readme:175`                                           |
| Derived status cost is linear in the number of fields                                                                                       | `behaviors/status`                                                                         | `00-direction.md#Settled decisions`                    |

Authoring frictions found by the examples (`EX/readme.md:59-80`) are limits only if they are still present at
release: three casts in an extension named by a parameter, `change.path` typed as `string`, an assertion for a
state that starts with `null`, and `usePart` not accepting the part's own props. `01-public-api.md`, section
7.5, decides them. Each one that stays gets a "Common mistakes" row on `extend/write-an-extension`,
`extend/intercept-a-change` or `recipes/another-element`.

## 6. Page templates

Frontmatter on every page: `title`, `description` (one sentence that states the task), `type`
(`concept`, `guide`, `reference`, `extension`, `recipe`, `adapter`, `overview`), `entry` (the entry points the page imports
from), `principles` and `examples` (catalogue ids). The collection schema makes them required (`fumadocs-mdx`
accepts a `schema` per collection, `fumadocs-mdx/dist/core-w3CkO8cV.d.ts:112`). The H2 headings below are
fixed text, in this order. A page omits a heading only where the template marks it optional.

| Type      | Used by                                              | Fixed H2 headings, in order                                                                                                          |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Concept   | `concepts/*`                                         | In short · Model · Rules · Example · Common mistakes · Related                                                                       |
| Guide     | `compose/*`, `extend/*`, `quick-start`               | Problem · What you build · Steps · Complete example · Verify · Common mistakes · Related                                             |
| Reference | `core/*`                                             | When to use · Import · Minimal example · Signature · Parameters · Returns · Rules · Common mistakes · Related                        |
| Extension | `behaviors/*`, `presets/standard`                    | When to use · Import · Minimal example · Needs · Adds · Order · Use from an extension (optional) · Rules · Common mistakes · Related |
| Recipe    | `recipes/*`                                          | Problem · Solution · How it works (optional) · Variations (optional) · Related                                                       |
| Adapter   | `adapters/*`                                         | Install · Create the parts · Parts · Hooks · Custom parts · Server rendering · Differences · Common mistakes · Related               |
| Overview  | `comparison`, `limits`, `choose-an-api`, index pages | In short · the page's own headings, each with an explicit id · Related                                                               |

Content rules per heading:

- **Problem**: the "Real problem" sentence of the catalogue row. **In short** and **When to use**: three
  sentences at most. "When to use" also names the API to use instead when this one is wrong.
- **Import**: one code line. It shows the entry point.
- **Minimal example** and **Complete example**: one block, complete, with imports, type-checked, from the
  catalogue row. Example for `core/extend`: the sign-in chain. Example for `behaviors/reset`: "Discard" on the
  article editor.
- **Signature**: the declaration as a code block. **Parameters** and **Returns**: tables with name, type,
  required, meaning. For object types use `auto-type-table`. For functions write the table by hand until the
  fault in `reports/fumadocs-typescript.md:3-8` is rechecked.
- **Needs**: a table of the needs (api names and state keys), each one required, what each is used for, and
  the runtime error at `create` when one is missing. A page that has no need says "None". **Adds**: one table with options, state keys, api
  members, slots and field members. **Order**: what must come before and after in a chain. **Use from an
  extension**: how a custom extension uses this behavior: its name in `Needs`, the api members that the
  extension reads from `deps`, and its extension hooks. The example is a custom extension of the catalogue
  that needs the behavior (E06 and E08 to E10), never a call of an internal function. `presets/standard` omits
  the heading.
- **Rules**: a list. One rule per item, written as a constraint ("`api` must not start a timer at creation").
- **Steps**: numbered H3 headings. Each step has one code block and states what changed in the form's type.
- **Verify**: how the reader confirms the result: the inferred type, the state, or a test.
- **Common mistakes**: a table with three columns: the wrong code, the compiler error or runtime effect, the
  fix. Example row: `defineForm(init).extend(autosave)` · type error, the form lacks `values` and `validation`
  · extend `values` and `validation` first. The error text is produced by Twoslash, not typed by hand.
- **Related**: links only, five at most.

An overview page is tables and links. Only its first and last heading are fixed. `07-comparison.md`,
section 5, owns the headings of `comparison.mdx`.

## 7. Agent-first delivery

### 7.1 What UI SDK does

- A root `llms.txt` that links one `llms.txt` per section (<https://ui-sdk.dev/llms.txt>).
- A Markdown form of each page at the page URL plus `.md`
  (<https://ui-sdk.dev/docs/agents/build-with-an-agent>).
- Docs inside the npm package, for the installed version: `node_modules/@ui-sdk/react/docs/llms.txt`, with
  `core.md` and `rendering.md` (same page).
- A skill, installed with `npx skills add`, also shipped inside `@ui-sdk/core` (same page).

### 7.2 Machine-readable outputs

All are generated from the same MDX as the HTML pages. Nothing is written twice.

| Output              | URL                                         | Generated by                                                                                                                                                                                                                                                                                                   | Contains                                                                                                |
| ------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Index               | `/llms.txt`                                 | Server route calling `llms(source).index()` (`fumadocs-core/dist/index-DNo8LS3A.d.ts:516-541`)                                                                                                                                                                                                                 | Title, a five-line summary, each page as a link to its `.md` URL with its description, in sidebar order |
| Full text           | `/llms-full.txt`                            | Same helper with `renderPage`, then `.full()` (same file, lines 528-537)                                                                                                                                                                                                                                       | Every page as Markdown, in sidebar order                                                                |
| Page Markdown       | `/docs/<slug>.md`                           | Server route that returns `page.data.getText('processed')` (`fumadocs-mdx/dist/types-1n7Fk5Dl.d.ts:44-50`). Needs `includeProcessedMarkdown` in `source.config.ts` (`fumadocs-mdx/dist/core-w3CkO8cV.d.ts:53`). The `.md` suffix is rewritten with `rewritePath` (`fumadocs-core/dist/negotiation/index.d.ts`) | Title, description, the page body with explicit heading ids (`remark-llms`, `headingIds`)               |
| Content negotiation | `/docs/<slug>` with `Accept: text/markdown` | `isMarkdownPreferred(request)` (same file)                                                                                                                                                                                                                                                                     | The same Markdown. Works only on the srvx server, not on static files                                   |
| Page actions        | On each HTML page                           | `MarkdownCopyButton` and `ViewOptionsPopover` (`fumadocs-ui/dist/layouts/shared/page-actions.d.ts`)                                                                                                                                                                                                            | Copy as Markdown, open the `.md` URL                                                                    |

Not built now (YAGNI):

- An MCP server. `fumadocs-core/mcp` has `registerSearchTool` and `registerSourceTools`
  (`fumadocs-core/dist/mcp.d.ts`), but it needs the optional peer `@modelcontextprotocol/server`, which is
  not installed, and a hosted endpoint. Seventy-two pages fit in `llms-full.txt`. Add it when a user asks.
- One `llms.txt` per section. `indexNode(node)` supports it. The site is small enough for one index.
- A skill. Revisit after the in-package docs exist (7.4).

Verification tasks of P8-02, at the installed versions:

1. TanStack Start prerenders the three text routes to static files (`apps/docs/vite.config.ts:20-23`). If
   not, add them to the prerender page list.
2. The processed Markdown of a Twoslash block. `remark-llms` works from the authored source, so notations such
   as `// ^?` and `// @errors: 2345` stay in the text. Rule 3 below depends on this.
3. `auto-type-table` output in processed Markdown. `typeTableToMarkdown` exists
   (`fumadocs-typescript/dist/index.d.ts:39`). Confirm that it is used, or set `mdxAsPlaceholder`.
4. `@frantss/fumadocs-theme` `DocsPage` accepts the page actions (`apps/docs/src/routes/docs.$.tsx:41`).

### 7.3 Rules that make a page usable by an agent

1. **One task per page.** The `description` states it. A page that needs "and" in its description is split.
2. **Self-contained snippets.** Each block has its imports from the public entry points and compiles alone. No
   block depends on an earlier block. In a guide, a step may show part of the file, and the "Complete
   example" block is the full file.
3. **No hidden code.** Do not use `// ---cut---` to hide imports or setup. The Markdown form must be the code
   that compiles.
4. **Type-checked.** Each `ts` and `tsx` block uses `twoslash` and resolves `@oxform/*` to the built packages.
   A block that cannot be checked states the reason in its meta (`no-check="solid 2 types"`).
5. **Explicit negative examples.** Wrong code is shown only in "Common mistakes" or in a block that carries
   `// @errors`, next to the sentence that states the error. An agent must not copy a wrong block by accident.
6. **Stable headings.** Template headings are fixed text. Other headings have an explicit id (`## Title [#id]`)
   that does not change when the title changes. A removed id needs a decision and a redirect note.
7. **Decision tables.** A choice between APIs is a table on `choose-an-api.mdx` or in "When to use", not prose.
8. **Text carries everything.** No fact is only in an image, a diagram or an interactive widget. A playground
   embed follows the source it runs, as text.
9. **Glossary terms only.** Pages use the terms of `00-direction.md#Glossary`. A check fails on "fragment",
   "kind", "field extras", "form definition", "configured form", "pipe", "stage", "kernel", "plugin" and
   "behavior API", and on "primitive" outside the text that describes UI SDK. The check allows "prop kind" and
   code identifiers such as `PropKind`. `check:terms` of `02-structure.md`
   applies the same list to source, tests and contributor documents.
10. **The chain is shown whole.** A snippet that uses a form shows its `defineForm(...)` chain, or imports it
    from a block on the same page. An agent must see the order of the extensions.
11. **Framework tabs are labelled.** A rendering snippet uses code tabs titled `React`, `Solid 1`, `Solid 2`.
    The Markdown form keeps the titles.
12. **Style.** Clear English guided by ASD-STE100, no preamble, short sentences, as in the repository's
    `AGENTS.md` "Communicating" section. State what the reader does and what happens.

### 7.4 What ships in the npm packages

| Approach                                | What                                                                                                                                                                       | Verification                                                                                                                                       | Risks and mitigation                                                                                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Link only                            | Each package readme links the site's `llms.txt`                                                                                                                            | A link check                                                                                                                                       | The site describes the latest version, not the installed one. An agent with no network gets nothing. Mitigation: none without B                                                                       |
| B. Generated `docs/` folder (decided)   | A `docs/` folder in each published package: `llms.txt` with relative links, and the processed Markdown of the pages whose `entry` is that package. The readme points to it | A check that `pnpm pack` contains `docs/llms.txt`, that each link resolves inside the tarball, and that the files equal the site's Markdown output | Build order: packages, then docs, then copy, then publish. Mitigation: the copy is a release step, not part of `build`. Install size grows. Mitigation: Markdown only, and the check reports the size |
| C. Hand-written `AGENTS.md` per package | A usage guide of about 100 lines per package                                                                                                                               | Snippets extracted and compiled                                                                                                                    | A second source of each fact, against the repository rule. It drifts                                                                                                                                  |

Decision: B, in two stages. The 0.7.0 release ships A. A later release adds B, when the site content is stable and the
Markdown route exists. `@oxform/core` gets the pages of `core/`, `behaviors/`, `presets/`, `concepts/`,
`compose/`, `extend/` and `limits`. Each adapter gets its adapter page, the recipes and the quick start.
Rejected: C, and a skill for now (it repeats the "Compose" and "Extend" indexes and needs its own upkeep).
The `files` field and the release step belong to `02-structure.md`.

### 7.5 Verification of agent usability

One command, `docs:check:agents` (wiring in `02-structure.md`), runs after `docs:build`:

| Check                                                                                                                     | Fails when                                     |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Every page of the source has a `.md` output that is not empty                                                             | A page has no Markdown form                    |
| `llms.txt` lists every page once, and each link resolves                                                                  | A page is missing or a link is dead            |
| `llms-full.txt` contains each page title                                                                                  | A page is missing                              |
| Each page has the fixed headings of its `type`, in order                                                                  | A template is broken                           |
| Each `ts` or `tsx` block has `twoslash` or `no-check`, and has an `@oxform/` import                                       | A snippet is unchecked or not self-contained   |
| No `---cut---` in content. No image without the same fact in text (an allowlist names the images)                         | Hidden code or image-only content              |
| No forbidden term (rule 9)                                                                                                | A synonym is used                              |
| Reference folders match the export inventory (section 3)                                                                  | An export has no page, or a page has no export |
| Each guide, reference, extension and recipe page names a catalogue id that exists in the example kit or in an example app | A page has an example outside the catalogue    |
| The set of heading ids did not shrink against the committed list                                                          | An anchor was removed without a decision       |

`docs:build` already fails on a snippet that does not compile (`apps/docs/README.md:21-22`). Once per release,
by hand: give an agent only `llms.txt` and the task "write the sign-in form as a lean chain, then add a
`warning` check", and type-check its output. Record the result in `reports/`. This is not a CI check.

## 8. Snippet and example policy

- **Single source.** Each catalogue row is one set of files, named by its id and domain: the
  framework-neutral code in the shared example kit, and the rendering code in the example apps. The docs, the `examples/*` applications and the tests import or include the same files.
  `02-structure.md` owns the location. `03-testing.md` owns the tests of the kit.
- **Include, do not copy.** A guide's "Complete example" is an `<include>` of the kit file or the example-app file, or of a named
  `// #region` of it (`fumadocs-core/dist/remark-include-*.d.ts`: non-Markdown files become code blocks, and
  `extractCodeRegion` reads regions). Verify that an included block can carry the `twoslash` meta. If not, the
  kit's own type-check is the proof, and the block is marked `no-check="checked in the example kit"`.
- **Inline snippets** are for reference pages and steps: 25 lines at most, Twoslash, complete.
- **Twoslash.** Compiler options stay strict (`apps/docs/source.config.ts:27-31`). Error text in "Common
  mistakes" comes from `// @errors`. Type displays use `// ^?` where the inferred type is the point of the
  step, for example the instance type after each `.extend`. Twoslash reads the built packages, so the docs
  build depends on the package build (`apps/docs/README.md:19-20`).
- **Solid snippets.** The docs app has one `solid-js` version, 1.x (`apps/docs/package.json:30`). Solid 1
  blocks use `// @jsxImportSource solid-js`. Solid 2 blocks cannot be checked in the same app, so they are
  included from the Solid 2 example workspace, which type-checks them.
- **Runnable playground.** Keep the `/playground` route and its iframe builds (`apps/docs/README.md:47-60`).
  It lists the five domain forms, not one form per feature. Each links to the guides that explain it, and
  those pages show the same source as text.
- **`examples/*`** stay runnable applications per adapter and are the browser-test targets. Their content
  comes from the kit.
- **The spike's examples and kit are not published.** A row marked "keep" or "move" is rewritten in the kit
  to production standards. The spike file is its reference only.

## 9. Contributor documentation

| File                                     | Action                  | Reason                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/structure.md`                      | Rewrite                 | Layout, entry points and source folders change (`docs/structure.md:45-68`). Content from `02-structure.md`                                                                                                                                                                    |
| `docs/commands.md`                       | Rewrite                 | New scripts: the tree-shaking check, the size reports, packaging checks, docs agent checks. Confirm each against `package.json`                                                                                                                                               |
| `docs/testing.md`                        | Rewrite                 | New layers and conventions, core tests in Node. Content from `03-testing.md`                                                                                                                                                                                                  |
| `docs/typescript.md`                     | Rewrite                 | The `~` prefix rule (`docs/typescript.md:9`) conflicts with module-private channels. Add the inference rules: an extension's `Extendable` signature, the generic signature of a preset, no hand-written state or api types                                                    |
| `docs/code-style.md`                     | Rewrite                 | The naming table uses `FormApi` and `~mount` (`docs/code-style.md:19-24`). Add the naming rule for an extension, its api type and its internal `createX` function (`01-public-api.md`, section 7.1)                                                                           |
| `docs/checks-and-issues.md`              | Keep as is, then delete | It is a usage reference of the removed `checks` map (`docs/checks-and-issues.md:13-30`). Its subject moves to `concepts/checks-and-validation` and `behaviors/check`. Delete it on the condition of `03-testing.md`, deviation 11: every row that cites it has a passing test |
| `docs/form-core-behaviors.md`            | Keep as is, then delete | It is the scenario source during the rebuild (`00-direction.md#Starting point`). Delete it when `03-testing.md` reports every scenario ported. The tests and the public reference are then the one place                                                                      |
| `docs/architecture.md`                   | New                     | Internal design that no public page holds: the context, state factories, internal channels, the change path, validation runs, derived status, how `.extend` tells a preset from an extension. Source: `readme:261-445`                                                        |
| `docs/adapter-authors.md`                | New                     | The contract of `@oxform/core/adapter` for adapter authors (`01-public-api.md`, section 7.2). No public page holds it                                                                                                                                                         |
| `AGENTS.md` (general sections)           | Keep as is              | Not specific to the API                                                                                                                                                                                                                                                       |
| `AGENTS.md` ("Oxform-specific guidance") | Rewrite                 | The guide list names two files that go. Add the glossary link, the entry-point rule, the example rule and `docs:check:agents` to "Validation"                                                                                                                                 |
| `readme.md` (root)                       | Rewrite                 | New pitch: five principles, UI SDK inspiration, the sign-in chain, package table, links. No API detail. Keep the `oxform-*` deprecation notice (`readme.md:3-8`) as one line (D48)                                                                                            |
| `packages/core/readme.md`                | Rewrite, short          | Today it repeats the reference. New: purpose, install, entry-point table, one example, link to site and to `docs/` in the package                                                                                                                                             |
| `packages/react/readme.md`               | Rewrite, short          | Same shape. No "Re-exports from `@oxform/core`" (`packages/react/readme.md:411`): adapters do not re-export core, and core is a peer (`00-direction.md#Packages and entry points`)                                                                                            |
| `packages/solid/readme.md`               | Rewrite, short          | Same shape, with the Solid 1 and Solid 2 install lines                                                                                                                                                                                                                        |
| `apps/docs/README.md`                    | Rewrite                 | Holds the authoring rules: frontmatter, templates, the catalogue rule, snippet policy, agent checks, the new health check path. It is the one place for them                                                                                                                  |
| `examples/*/readme.md`                   | Rewrite                 | Run command and one line of purpose. Folder names from `02-structure.md`                                                                                                                                                                                                      |
| `explorations/**`                        | Keep as is              | Reference only (`00-direction.md#Starting point`)                                                                                                                                                                                                                             |
| `reports/*.md`                           | Keep as is              | Findings log. New findings are appended                                                                                                                                                                                                                                       |

One-place rule, applied: usage facts live on the site. Package readmes link to it. Contributor rules live in
`docs/*.md`. `AGENTS.md` links to them. Docs authoring rules live in `apps/docs/README.md`. Plan files in
`plans/extension-api/` are not documentation and are not linked from the readmes.

## 10. Writing order and dependencies

The steps map to [06-roadmap.md](./06-roadmap.md), which owns the schedule.

| Step | Work                                                                                                                                                     | Needs                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1    | Site skeleton: folders, `meta.json`, frontmatter schema, empty templates, single-tree layout, redirects                                                  | Nothing. Can start now                                                                 |
| 2    | Agent outputs and `docs:check:agents`: `llms.txt`, `llms-full.txt`, `.md` route, page actions                                                            | Step 1. The four checks in 7.2                                                         |
| 3    | The five domain schemas are fixed. The catalogue of section 4 is final (06, D36)                                                                         | Nothing                                                                                |
| 4    | Prose with no code dependency: `index`, `choose-an-api`, `limits`, each concept page's "In short", "Model" and "Rules", the `docs/architecture.md` draft | `00-direction.md`, the names of `01-public-api.md`                                     |
| 5    | `migration/index.mdx`                                                                                                                                    | `05-migration-guide.md`, final names                                                   |
| 6    | The core rows of the catalogue in the example kit (E01 to E28, without rendering), with their tests                                                      | Built `@oxform/core`, step 3                                                           |
| 7    | `core/*`, `behaviors/*`, `presets/standard`, concept examples, the core part of `compose/*` and `extend/*`                                               | Step 6 (Twoslash and type tables read the built package)                               |
| 8    | Rendering rows (E29 to E33), `quick-start`, `adapters/react`, `recipes/*`, the rendering part of the guides, the playground                              | Built `@oxform/react`                                                                  |
| 9    | `adapters/solid`, `adapters/solid-v2`, framework tabs                                                                                                    | Built Solid adapters                                                                   |
| 10   | `comparison.mdx`, with its tables generated from the result files of the comparison workspace                                                            | Built `@oxform/core` and `@oxform/react`, the comparison workspace, `07-comparison.md` |
| 11   | Root and package readmes, `docs/*.md` rewrites, the `AGENTS.md` section, `apps/docs/README.md`                                                           | Final structure and commands                                                           |
| 12   | In-package `docs/` folders (7.4, stage B)                                                                                                                | Steps 2 and 7 to 10, the release step in `02`                                          |

Rules:

- A reference page is written in the same change as its export. The inventory check (section 3) enforces it
  from step 7.
- A page is written after its catalogue rows pass their tests in the kit. No page is written from a spike file.
- Pages written in step 4 keep "Example" empty and are hidden from the sidebar until step 7.
- Today's `content/docs/react`, `solid` and `core` folders are deleted in step 1 on the rebuild branch. The
  published site keeps serving 0.6 until the release of 0.7.0.

## 11. Deviations and decisions

Every item is decided or is a verification task of a work package. `06-roadmap.md` records who decided.

Deviations from `00-direction.md`:

1. **Lean first, one quick start.** The direction does not state an order. This plan keeps the lean chain
   first and removes the preset quick start of revision 1 (5.1).
2. **Machine-readable indexes.** `00-direction.md#Documentation direction` asks for "machine-readable indexes". This plan
   builds one `llms.txt` and one `llms-full.txt`, and defers per-section indexes and an MCP server (YAGNI).
3. **In-package docs** are an addition. They add a `docs` entry to `files` and a release step, which
   `02-structure.md` accepts (its deviation 6 and "Release").
4. **`docs/architecture.md` and `docs/adapter-authors.md`** are new contributor files that
   `00-direction.md#Documentation direction` does not list.
5. **A template type**, "extension", for the built-in behavior pages. Each built-in behavior ships as an
   extension with needs, additions and an order (`00-direction.md#Packages and entry points`), and a reference
   template has no heading for them.
6. **Sixteen spike examples are replaced or moved, and seven rows are new** (4.2). `examples/*`, the example kit and
   `05-migration-guide.md` must use the catalogue's domains and names (`houseForm`, `normalizeEmail`,
   `funnel`, `confirmExternal`, `formErrorSlots`), not the spike's (`signup`, `audit`, `profile`).
7. **The comparison page** (`comparison.mdx`) is in the site map, the page total and the writing order. This
   file does not design it: `07-comparison.md` owns its method and content rules (direction, owner decision 16).
   Its full reference form is Team invites, because the catalogue's checkout has no array.
8. **A seventh template type**, "overview", for `comparison`, `limits`, `choose-an-api` and the index pages.
   The frontmatter requires a `type`, and no other type fits them.

Decisions:

1. **Slot groups on a lean chain.** Decided (direction, owner decisions 14 and 17). E01, E02 and the quick
   start use the built-in groups, and each group needs what it uses. E02 has no `submit`, so it spreads no
   root group, and its `Root` renders no element (`01-public-api.md`, 3.2, D11).
2. **Calling a behavior function directly.** Decided (direction, owner decision 13). No behavior function is
   public. A page that teaches the use of a behavior shows a custom extension that needs it (the "Use from an
   extension" heading).
3. **Slot group state needs.** Closed. A group's needs are checked where it is spread (`01-public-api.md`,
   section 3.2).
4. **A part with no `scope`.** Closed. The limit still applies (`03-testing.md`, "Matrix"). It is a row of
   5.2. The `scope` prop is the only way to scope a part (direction, owner decision 15).
5. **`<Root form={instance}>`.** Closed. `03-testing.md` plans the evidence: I6 (the request-handler flow) and
   P14 (an existing instance given to `Root`). The recipe is written after they pass.
6. **E07 and E20 api shapes.** Closed. `CheckApi.set` and the `setError` sugar are in `01-public-api.md`,
   section 3.3.
7. **Renames** (`00-direction.md#Design items`, item 1). Decided and applied (direction, owner decision 10).
   Page slugs in `behaviors/` use the extension name, and no rename changes a slug.
8. **Solid adapters are not built** (`00-direction.md#Design items`, item 4). `usePart` and the adapter hooks are confirmed
   in React only. The Solid pages are written in step 9.
9. **Solid 2 snippets** cannot be Twoslash-checked in the docs app beside Solid 1. Decided: include them from
   the Solid 2 example workspace, which type-checks them (section 8).
10. **Tool behavior to verify**: Twoslash on `<include>` blocks, Twoslash notations in processed Markdown,
    type tables in Markdown, prerender of the text routes (7.2, section 8). Verification task of P8-02: a
    short test of each, with the fallback of 7.2 and section 8 when one fails.
11. **`docs/form-core-behaviors.md` end state.** Closed. Delete on the condition of `03-testing.md`,
    deviation 11.
12. **Docs versioning.** Decided (D47): the site serves one version, with no versioned site (YAGNI).
    In-package docs cover the installed version.
13. **Copied example extensions.** `autosave`, `masks` and `warnings` are guides, not exports
    (`00-direction.md#Packages and entry points`). Readers will copy them, so each guide must hold the complete file.
14. **The deprecation notice** for `oxform-react` and `oxform-core` in the root readme. Decided (D48): keep it
    as one line. The old package names are still on npm and still deprecated.

# Comparison with other form libraries

Status: complete, revision 4. This file owns the comparison page of the public documentation: its purpose,
the research behind it, the feature matrix, the size method, the page outline and its maintenance. It agrees
with [00-direction.md](./00-direction.md) and uses its glossary. The site map and the page templates are in
[04-documentation.md](./04-documentation.md), the workspace and scripts in [02-structure.md](./02-structure.md),
the tiers of Oxform's own size check in [03-testing.md](./03-testing.md) and the order of work in
[06-roadmap.md](./06-roadmap.md).

Nothing is built. Every statement about Oxform is a plan. Every statement about another library was read on
2026-11-15 and read again on 2026-11-16 (P7-08) at the source that the row names. `examples/comparison/features.json`
holds each cell of 3.3 with its source, version and date.

## 1. Purpose and reader

The owner requires a comparison with **TanStack Form**, **React Hook Form** and **Formisch**, in features and
in size. The page is `comparison.mdx` in the "Start" section (`04#5`, "Start").

| Reader                                | Question the page answers                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| Developer who chooses a library       | "Which of these four fits my form, my framework and my size limit?"                  |
| Developer who uses one of the others  | "What does Oxform do differently, and what do I lose if I change?"                   |
| Coding agent that must pick a library | The same questions, from a table and a JSON file, with a version and a date per fact |
| Maintainer of one of the other three  | "Is my library described correctly, and how do I get an error corrected?"            |

What the page must not be:

- Marketing. It has no adjectives about any library, no "winner" and no row that exists to make Oxform look
  good.
- A benchmark of speed. Render counts and timings are out of scope until a method exists (section 8).
- A copy of another project's comparison table. Each cell is filled from that library's own primary source.

## 2. Research findings

Read on 2026-11-15, and read again on 2026-11-16. No fact is left unverified.

### 2.1 Sources

| Id  | Source                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------- |
| T1  | <https://tanstack.com/form/latest/docs/overview>                                                                  |
| T2  | <https://tanstack.com/form/latest/docs/philosophy>                                                                |
| T3  | <https://tanstack.com/form/latest/docs/framework/react/guides/validation>                                         |
| T4  | <https://tanstack.com/form/latest/docs/framework/react/guides/arrays> and `/docs/reference/classes/FieldApi`      |
| T5  | <https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling>                                |
| T6  | <https://tanstack.com/form/latest/docs/framework/react/guides/ssr>                                                |
| T7  | <https://tanstack.com/form/latest/docs/framework/react/guides/devtools>                                           |
| T8  | <https://tanstack.com/form/latest/docs/framework/react/guides/form-composition>                                   |
| T9  | <https://tanstack.com/form/latest/docs/comparison>                                                                |
| T10 | npm registry: `https://registry.npmjs.org/@tanstack%2fform-core` and the adapter packages                         |
| T11 | <https://tanstack.com/form/latest/llms.txt>                                                                       |
| T12 | <https://tanstack.com/form/latest/docs/framework/react/guides/custom-errors> and `/guides/listeners`              |
| R1  | <https://react-hook-form.com/>                                                                                    |
| R2  | <https://github.com/react-hook-form/react-hook-form> (readme)                                                     |
| R3  | <https://react-hook-form.com/docs/useform>                                                                        |
| R4  | <https://react-hook-form.com/docs/useform/register>                                                               |
| R5  | <https://react-hook-form.com/docs/usefieldarray>                                                                  |
| R6  | <https://react-hook-form.com/docs/useform/form>                                                                   |
| R7  | <https://github.com/react-hook-form/resolvers> (readme, `master`)                                                 |
| R8  | npm registry: `react-hook-form`, `@hookform/resolvers`, `@hookform/devtools`                                      |
| R9  | <https://react-hook-form.com/llms.txt>, `/docs/useform.md`, `/docs/formprovider.md` and `/advanced-usage`         |
| F1  | <https://github.com/open-circle/formisch> (readme, `main`)                                                        |
| F2  | <https://formisch.dev/react/guides/comparison/>                                                                   |
| F3  | <https://formisch.dev/react/guides/validation.md>                                                                 |
| F4  | <https://formisch.dev/react/guides/field-arrays.md>                                                               |
| F5  | <https://formisch.dev/react/guides/handle-submission.md>                                                          |
| F6  | <https://formisch.dev/react/guides/architecture.md>                                                               |
| F7  | <https://formisch.dev/solid/guides/migrate-from-modular-forms.md>                                                 |
| F8  | <https://formisch.dev/blog/formisch-v1.md> (2026-08-20) and `/blog/react-form-library-comparison.md` (2026-04-09) |
| F9  | <https://formisch.dev/llms.txt>                                                                                   |
| F10 | npm registry: the nine packages of `https://registry.npmjs.org/-/org/formisch/package`                            |
| F11 | <https://formisch.dev/react/guides/controlled-fields.md> and `/guides/typescript.md`                              |
| F12 | <https://formisch.dev/react/guides/migrate-from-tanstack-form.md>                                                 |
| G   | GitHub API: `https://api.github.com/repos/<owner>/<repo>` for the three repositories                              |
| N   | npm downloads API: `https://api.npmjs.org/downloads/point/last-week/<package>`, week 2026-11-09 to 2026-11-15     |

### 2.2 Identity and maturity

| Fact                    | TanStack Form                                                                                                                              | React Hook Form                                                          | Formisch                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version read            | `@tanstack/form-core` and `@tanstack/react-form` 1.33.5 (T10)                                                                              | `react-hook-form` 7.92.0 (R8)                                            | `@formisch/react` 1.2.0, `@formisch/solid` 1.3.0 (F10)                                                                                                     |
| Published               | 2026-08-11 (T10)                                                                                                                           | 2026-11-11 (R8)                                                          | 2026-10-31 (F10)                                                                                                                                           |
| Prerelease line         | `alpha`: 2.0.0-alpha.3 (T10)                                                                                                               | `beta`: 8.0.0-beta.0 (R8)                                                | None. `rc` tag is the old 1.0.0-rc.0 (F10)                                                                                                                 |
| First publish on npm    | 2023-04-25 (T10)                                                                                                                           | 2019-03-20 (R8)                                                          | `@formisch/solid` 2025-07-15, `@formisch/react` 2025-12-04 (F10)                                                                                           |
| First stable major      | 1.0.0 on 2025-03-02 (T10)                                                                                                                  | 1.0.0 on 2019-03-27. Current major 7.0.0 on 2021-04-02 (R8)              | 1.0.0 on 2026-08-20. "Stable and ready for usage in production" (F8, F10)                                                                                  |
| Maker                   | The TanStack organisation (G)                                                                                                              | The `react-hook-form` organisation (G)                                   | Fabian Hiller: npm author and maintainer (F10). Repository in `open-circle`, which also holds Valibot (npm `valibot` repository field)                     |
| Lineage                 | The `react-form` repository of Tanner Linsley, now `TanStack/form` (G, npm `react-form`)                                                   | No predecessor stated (R8)                                               | "The official successor of Modular Forms, built by the same author". Modular Forms is "in maintenance mode" (F7)                                           |
| Licence                 | MIT (T10)                                                                                                                                  | MIT (R8)                                                                 | MIT (F1, F10)                                                                                                                                              |
| GitHub stars            | 6,769 (G)                                                                                                                                  | 44,919 (G)                                                               | 1,226 (G)                                                                                                                                                  |
| npm downloads, one week | `@tanstack/react-form`: 7,175,402 (N)                                                                                                      | 63,860,985 (N)                                                           | `@formisch/react`: 15,131 (N)                                                                                                                              |
| Runtime dependencies    | `@tanstack/store`, `@tanstack/pacer-lite`, `@tanstack/devtools-event-client` in core. The React adapter adds `@tanstack/react-store` (T10) | None. Peer: `react` (R8). "A tiny library without any dependencies" (R1) | None listed. Peers: the framework and `valibot >=1.4.1 <2` (F10). `@formisch/core` is not on npm: each framework package is "a self-contained bundle" (F6) |
| Size stated by project  | No figure in the text of T1 or T9. T9 shows a badge image                                                                                  | No figure. "Small size and no dependencies" (R2)                         | "Small bundle size starting at 2.5 kB" (F1). "min+gzip", with no version or date (F2)                                                                      |

Formisch also states sizes for the other two: "~12 kB" for React Hook Form and "~15 kB" for TanStack Form,
minified and gzipped, with no version or date (F2). The Oxform page does not reuse these figures.

### 2.3 Model and features

| Topic                    | TanStack Form                                                                                                                              | React Hook Form                                                                                                                                                                                            | Formisch                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Model                    | Headless, "framework-agnostic design" (T1). "Firmly in the controlled camp" (T2)                                                           | `register` returns `ref`, `onChange`, `onBlur`, `name`. The value is read through the ref (R4). The home page labels it "uncontrolled" (R1). `useController` for controlled components (R4)                | "A schema-based, headless form library for JS frameworks" (F1). The core is built once per framework with that framework's reactivity (F6) |
| Frameworks               | React, Preact, Vue, Angular, Solid, Lit, Svelte (T11). One npm package each (T10)                                                          | React. Peer `react ^16.8 \|\| ^17 \|\| ^18 \|\| ^19` (R8). The repository names React Native (G)                                                                                                           | Angular, HonoX, Preact, Qwik, React, React Native, SolidJS, Svelte, Vue (F1). One npm package each. `@formisch/honox` is 0.2.0 (F10)       |
| Schema and validation    | Validators per event, on a field or on the form. "Natively supports all libraries following the Standard Schema specification" (T3)        | Built-in rules (`required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `validate`) (R4), or a `resolver` (R3). `@hookform/resolvers` 7.0.6 lists 20 resolvers, Standard Schema among them (R7, R8) | The Valibot schema is the only place. "Currently supports only Valibot" (F2). Standard Schema is on the roadmap (F8)                       |
| Validation timing        | Per validator: `onChange`, `onBlur`, `onSubmit` and their `Async` forms (T3)                                                               | One form-wide `mode`: `onSubmit`, `onBlur`, `onChange`, `onTouched`, `all`. `reValidateMode` (R3)                                                                                                          | Form-wide `validate` and `revalidate`: `initial`, `touch`, `input`, `change`, `blur`, `submit`. The whole schema runs each time (F3)       |
| Type inference           | "Infer everything from runtime defaults". "You should never need to pass a generic" (T2)                                                   | A generic on `useForm<FormValues>` (R3), or "most of the resolvers can infer the output type from the schema" (R7)                                                                                         | Inferred from the schema (F1, F2). Paths are typed arrays (F7)                                                                             |
| Array fields             | `mode="array"` and `pushValue`, `insertValue`, `replaceValue`, `removeValue`, `swapValues`, `moveValue`, `clearValues` (T4)                | `useFieldArray`: `append`, `prepend`, `insert`, `swap`, `move`, `update`, `replace`, `remove`. "Does not support flat field arrays" (R5)                                                                   | `FieldArray` and the methods `insert`, `move`, `remove`, `replace`, `swap`. Nesting is supported (F4)                                      |
| Async validation         | `onChangeAsync`, `onBlurAsync`. The async validator runs only if the sync one succeeds. `asyncDebounceMs` (T3)                             | An async `validate` function (R4). Resolvers run in `async` mode by default (R7). No debounce option. Cancellation is not documented (R9)                                                                  | Through Valibot's async API (`objectAsync`, `pipeAsync`, `checkAsync`). `isValidating` (F3). No debounce option (F12)                      |
| Submission               | `onSubmit` option and `form.handleSubmit()`. `onSubmitMeta`. `onSubmit` "will always be the input data" of a schema (T5). `canSubmit` (T3) | `handleSubmit`. The `Form` component posts `FormData` to a URL or a Server Action. It is "currently in BETA" (R6)                                                                                          | `Form` with `onSubmit` receives "the validated form values". `handleSubmit`, `submit`, `isSubmitting` (F5)                                 |
| Server rendering         | TanStack Start, Next.js App Router and Remix, through `@tanstack/react-form-start`, `-nextjs` and `-remix` (T6)                            | `progressive: true` on `Form` renders `action`, `method` and native rules. "Only applicable to SSR frameworks" (R6)                                                                                        | None. "Meta-framework support" is planned after v1 (F8)                                                                                    |
| Devtools                 | `@tanstack/react-form-devtools` 0.2.34 as a plugin of `@tanstack/react-devtools` (T7, T10). T9 still says "planned"                        | `@hookform/devtools` 4.4.0, published 2025-04-06 (R8)                                                                                                                                                      | None. The npm organisation has no devtools package, and F9 names none (F10, F9)                                                            |
| Extension mechanism      | No plugin API. Side effects through listeners, components through `createFormHook` (T12, T8)                                               | No plugin API. Resolvers are the documented extension point, for validation only (R3, R7, R9)                                                                                                              | No plugin system. `@formisch/react/internals` gives the core for custom methods (F6)                                                       |
| Composition and reuse    | `createFormHook`, `createFormHookContexts`, `useAppForm`, `withForm`, `withFieldGroup`, `formOptions`, `extendForm` (T8)                   | `FormProvider` and `useFormContext` share the methods of `useForm`. No field-group API (R9)                                                                                                                | Methods are standalone, tree-shakeable functions (F6). No field-group API. For `createFormHook`: "No equivalent needed" (F11, F12)         |
| Documentation for agents | `llms.txt` and a Markdown form of each page (T11)                                                                                          | `llms.txt`, `llms-full.txt` and a Markdown form of each page (R9)                                                                                                                                          | `llms.txt`, a Markdown form of each page, one full-text file per framework, an MCP server (F9)                                             |

Notes for the page author:

- TanStack's own comparison page says that it "is still not completely accurate" (T9). Do not cite it for
  facts about React Hook Form.
- The npm description of TanStack Form omits Svelte, and `@tanstack/lit-form` is at 1.25.5, not 1.33.5 (G,
  T10). State the framework list from T1 and T10.

## 3. Feature matrix

### 3.1 Vocabulary

Each cell holds one value from this list, and nothing else.

| Value         | Meaning                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| Built-in      | In the main package or its framework adapter, with no extra install                          |
| Add-on        | In a separate package that the same project publishes                                        |
| User code     | Possible with documented APIs, but the application writes the logic                          |
| Not available | The project's documentation states that it is absent, or the model excludes it               |
| Unverified    | No primary source was read. The page never shows this value: the row is resolved or left out |

Rules:

- An Oxform cell adds "(planned)" until the package that provides it is published. After the release the
  suffix is removed in the same pull request as the proof.
- Each cell that is not "Built-in" for an obvious reason has a footnote with a source link, the version and
  the date read.
- Rows that are facts and not capabilities (frameworks, licence, first stable release, downloads) hold the
  fact, with its source.
- A row is in the matrix only if it has a value for all four libraries.

### 3.2 Rows

The rows are chosen so that each library has rows where it is the strongest. In rows 1, 2, 4, 9, 14,
15, 16, 18 and 19 another library is ahead of Oxform.

### 3.3 First draft

`00`, `01` and `04` are the plan files. Oxform cells are plans. The other cells cite section 2.1.

| #   | Row                                          | Oxform (planned)                                                                 | TanStack Form                           | React Hook Form                      | Formisch                           |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------ | ---------------------------------- |
| 1   | Frameworks                                   | React, Solid 1, Solid 2 (`00#Packages and entry points`)                         | Seven, with Preact (T11)                | React, React Native (R8, G)          | Nine (F1). See 2.3                 |
| 2   | Uncontrolled inputs                          | Not available. Values live in the store (`01#3.1`, `values`)                     | Not available (T2)                      | Built-in (R1, R4)                    | Built-in (F11)                     |
| 3   | Types without a hand-written generic         | Built-in, from the schema and the chain (`00#Principles` 4)                      | Built-in, from `defaultValues` (T2)     | Add-on, from a resolver schema (R7)  | Built-in, from the schema (F2)     |
| 4   | The schema validates without more setup      | Not available. A schema only types `Values` (`04#5.2`, row 1)                    | User code: pass it to `validators` (T3) | Add-on: `resolver` (R3, R7)          | Built-in (F3)                      |
| 5   | Schema libraries                             | Standard Schema (`02#Package manifest`)                                          | Standard Schema (T3)                    | 20 resolvers (R7)                    | Valibot only (F2)                  |
| 6   | Validation without a schema library          | Built-in: validator functions per check (`01#3.1`, `check`)                      | Built-in (T3)                           | Built-in (R4)                        | Not available (F2, F3)             |
| 7   | Validation timing per validator              | Built-in: per event in each check (`04#4.2`, E18)                                | Built-in (T3)                           | Not available: form-wide `mode` (R3) | Not available: form-wide (F3)      |
| 8   | Async validation                             | Built-in. A newer run discards a stale one (`03#Integration layer`, I2)          | Built-in (T3)                           | Built-in (R4, R7)                    | Built-in, in the schema (F3)       |
| 9   | Debounce of async validation                 | User code (no option in `01#3.1`)                                                | Built-in: `asyncDebounceMs` (T3)        | User code (R9)                       | User code (F12)                    |
| 10  | More than one named set of issues (warnings) | Built-in: `check(name)` (`01#3.1`)                                               | Not available: one set (T12)            | Not available: one set (R4)          | Not available: one set (F3)        |
| 11  | Array fields                                 | Built-in: `arrays` (`01#3.1`)                                                    | Built-in (T4)                           | Built-in (R5)                        | Built-in (F4)                      |
| 12  | Reusable field group at more than one path   | Built-in: `defineScope` (`04#4.2`, E15)                                          | Built-in: `withFieldGroup` (T8)         | User code (R9)                       | User code (F11)                    |
| 13  | Shared form set-up for a team                | Built-in: a preset (`04#4.2`, E04)                                               | Built-in: `createFormHook` (T8)         | User code (R9)                       | User code (F12)                    |
| 14  | Server rendering with a meta-framework       | User code. The rules are documented (`04#4.2`, E26, E27). No integration package | Add-on: Start, Next.js, Remix (T6)      | Built-in, beta: `Form` (R6)          | Not available (F8)                 |
| 15  | Devtools                                     | Not available (not in the plan)                                                  | Add-on (T7)                             | Add-on (R8)                          | Not available (F10)                |
| 16  | Runtime dependencies                         | `@tanstack/store` (`02#Package manifest`)                                        | Three in core (T10)                     | None (R8)                            | None (F10)                         |
| 17  | Extension mechanism for new behavior         | Built-in: `defineExtension` (`01#2.1`)                                           | User code: listeners (T12)              | User code: resolvers (R9)            | User code through `internals` (F6) |
| 18  | First stable major release                   | None. 0.7.0 is a breaking 0.x release (`00#Owner decisions` 2)                   | 2025-03-02. 1.33.5 today (T10)          | 2019-03-27. 7.92.0 today (R8)        | 2026-08-20 (F8)                    |
| 19  | npm downloads in one week                    | To be read at release                                                            | 7,175,402 (N)                           | 63,860,985 (N)                       | 15,131 (N)                         |
| 20  | Documentation for coding agents              | Built-in (planned): `llms.txt`, page Markdown (`04#7.2`)                         | Built-in (T11)                          | Built-in (R9)                        | Built-in (F9)                      |
| 21  | Licence                                      | MIT (`packages/core/package.json`)                                               | MIT (T10)                               | MIT (R8)                             | MIT (F10)                          |

Oxform's own limits that the page repeats from `04#5.2`: row 4 (the schema is type-only), a form without
`handles` has no `field(path)`, a slot cannot be wrapped, and the cost of derived status is linear in the
number of fields. The page links `limits.mdx` and does not restate the rest.

P7-08 resolved each "Unverified" cell. It removed the row "A form pays only for the features it imports": TanStack
Form and React Hook Form state nothing about it at a primary source, and the size table measures it. Row 15 for
Formisch rests on the absence of a package (F10), because the documentation does not mention devtools.

## 4. Size comparison method

### 4.1 Approaches

| Approach                                                                                                    | Verification                                                                                                       | Risks and mitigation                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A (decided).** The same reference forms, written with each library, built and measured in this repository | `compare:size` twice gives the same bytes. Each form passes one shared browser test, so no version lacks a feature | The other libraries are used badly. Mitigation: the fairness rules of 4.6. Cost: four versions of each form. Mitigation: two forms only                   |
| B. One build per package: import the whole public entry point of each library, pinned, and measure it       | The script is repeatable. No form code to review                                                                   | It punishes libraries whose size depends on what is imported: Oxform and Formisch (F6). It answers "how big is the package", not "what does my form cost" |
| C. Quote figures: Bundlephobia, or each project's own statement                                             | A link per number                                                                                                  | Methods differ and are often not stated (F2). Versions and dates differ. A project's figure for a competitor is not neutral                               |

Decision: A. B is not built (YAGNI): its result would mislead for two of the four libraries. C is rejected for
the size table. A project's own statement can appear in a footnote, quoted, with its source and "method not
stated".

Check against the coding standards: A adds one private workspace and one script. It reuses the build and
measure method of `report:size` (`03#Choice: how to measure`), so there is one way to measure a bundle in the
repository (DIE).

### 4.2 Reference forms

Two forms, from the domains of `04#4.1`. Each has a written specification (fields, rules, behavior) that all
four versions implement.

| Form         | Domain       | Specification                                                                                                                                                           | Why                                              |
| ------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Sign-in      | Sign-in      | `email`, `password`. Validation on submit, then on change. A server error is set on `password`. The button is disabled while the form submits (E01, E19)                | The smallest real form. The lower bound          |
| Team invites | Team invites | `team`, `seats`, `members[]` of `{ email, role }`. Add, remove and move a row. Format on change, an async lookup on blur, all on submit. Reset (E18 and the array rows) | Arrays, async validation, reset: the upper bound |

One schema library for all four: Valibot, with one shared schema module per form. Formisch supports no other
(F2). TanStack Form and Oxform take it through Standard Schema (T3). React Hook Form takes it through
`@hookform/resolvers` (R7).

### 4.3 What is measured

One React application entry per library and form. React Hook Form supports React only, so React is the one
framework that all four share.

| Figure                | Contents                                                                                                           | Use                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Form with library** | The form component, the library, its adapter and its dependencies. `react`, `react-dom` and `valibot` are external | The headline number of the table                                      |
| Form code only        | The same entry with the library external too                                                                       | Shows how much of the headline is the application's own code          |
| With schema library   | The headline build with `valibot` bundled                                                                          | Shows the real cost when the schema library is new to the application |

- Each figure is reported minified, gzip (level 9) and brotli (quality 11), from `node:zlib`.
- One build per entry with one output chunk, so no shared chunk hides bytes (`03#Bundle content and size`).
- Production mode, no source maps, the same target and minifier for every entry. The bundler is the one that
  `report:size` uses. Its version is recorded.
- Oxform is resolved to the built `dist` of the workspace, not to source (`03#Bundle content and size`).
- No figure is a gate. The gate of the bundle content is `check:tree-shaking`, which measures no size.
- Tree-shaking is on for all. The page says so, and says that an application with other settings gets other
  numbers.

### 4.4 Oxform's tiers

Oxform has two rows for each form, because the chain decides the size:

| Row                | Sign-in                                                                                  | Team invites                                   |
| ------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Oxform, lean chain | The chain of E01: `values`, `validation`, `check('error')`, `status`, `events`, `submit` | The shortest chain that passes the shared test |
| Oxform, `standard` | `defineForm(...).extend(standard)`                                                       | `defineForm(...).extend(standard)`             |

Both rows appear next to the other libraries, in the same table, with equal weight. The page does not show
only the lean row. Formisch is also modular: its version imports only the methods that the form needs, as its
documentation teaches (F6). TanStack Form and React Hook Form have one row each.

### 4.5 Versions and re-measurement

- `examples/comparison/package.json` pins an exact version of each library, of `valibot`, of
  `@hookform/resolvers` and of React. The lockfile fixes the rest.
- The result file is `examples/comparison/results/size.json`, committed. Fields: `measuredAt`, `method`
  (a version number of this section), `bundler`, `node`, and one record per row with `library`, `version`,
  `publishedAt`, `form`, `variant`, and bytes for the three figures in three encodings.
- `compare:size` runs, and the file is committed, when: a file in `examples/comparison` changes, a pinned
  version changes, the bundler version changes, or an Oxform release is prepared.
- `compare:check` reads the registry and reports a pinned version that is behind `latest`. It runs in
  `prepublish` and can run on a schedule.
- The page prints, directly under each size table: the date, the version of every library, the bundler and
  its version, and a link to this method and to the source folder. The same values are columns of the Markdown
  table, so a number is never read without them.

### 4.6 Fairness rules

1. Each version is idiomatic for its library. A reviewer checks it against that library's current
   documentation and records the pages used in a `readme.md` beside the code.
2. Every version passes the same browser test of the form's specification. No version leaves a feature out.
3. No version adds a feature that the specification does not have.
4. The source of all versions is public, in `examples/comparison`, and the page links it.
5. Numbers are published as measured. A row is not removed, and a form is not changed, because Oxform is
   larger.
6. Correction path: the page links an issue template "Comparison correction". A maintainer of another library
   can open an issue or a pull request against `examples/comparison`. A valid correction is merged and the
   table is measured again before the next release.
7. The page states what the numbers do not show: runtime speed, render counts, and forms that differ from the
   two measured.

## 5. Page outline for `comparison.mdx`

Row for the "Start" table of `04#5` (for `04` to adopt):

| Path             | Title      | Purpose                                                                                | P   | Example                            |
| ---------------- | ---------- | -------------------------------------------------------------------------------------- | --- | ---------------------------------- |
| `comparison.mdx` | Comparison | Features and size of Oxform, TanStack Form, React Hook Form and Formisch, with sources | L T | The sign-in and team invites forms |

Like `choose-an-api.mdx` and `limits.mdx`, the page has the `overview` type of `04#6`: tables and links, with
a fixed first and last heading. It keeps the required frontmatter (`type: overview`), "In short" of three
sentences at most, and "Related" with five links at most. This section owns the headings between them.

| H2                             | Content                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| In short                       | What is compared, for which versions, on which date. One sentence on what the page does not show              |
| Features                       | The matrix of 3.3, with the vocabulary of 3.1 as a legend and footnotes with source links                     |
| Size                           | One table per reference form: library, variant, version, minified, gzip, brotli. Then the stamp line of 4.5   |
| How the sizes are measured     | The three figures of 4.3 in one table, the fairness rules, a link to `examples/comparison` and to `size.json` |
| When to choose another library | One short list per library, from section 2. Draft below                                                       |
| When to choose Oxform          | A lean chain for a small form, custom extensions, scopes, named checks. Each item links its guide             |
| Report an error                | The correction path of 4.6                                                                                    |
| Related                        | `limits`, `compose/lean-form`, `presets/standard`, `quick-start`                                              |

Draft of "When to choose another library" (each line cites a row of section 2 on the page):

- **React Hook Form**: the application is React only, wants inputs that are not driven by state, wants no
  runtime dependency, or needs the largest user base and the longest history.
- **TanStack Form**: the application needs Vue, Angular, Svelte or Lit, uses TanStack Start, Next.js or Remix
  and wants an integration package for server validation, or wants devtools.
- **Formisch**: the application already uses Valibot and wants the schema to be the single place for types and
  validation, or needs Preact, Qwik, Vue, Svelte or Angular.

Agent-first form of the data (`04#7`):

| Output                                  | Content                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `examples/comparison/results/size.json` | The size records of 4.5                                                                      |
| `examples/comparison/features.json`     | One record per matrix cell: `row`, `library`, `value`, `note`, `source`, `version`, `readAt` |
| `/docs/comparison.md`                   | The plain-Markdown route. Both tables are Markdown tables, with version and date columns     |
| `/comparison.json`                      | Both JSON files as one static file of the site, linked from the page and from `llms.txt`     |

The tables in the page are generated from the two JSON files by a script, as Markdown, so that the Markdown
route contains them. A component that renders the JSON in the browser would leave the Markdown route empty.
Decided: the script rewrites a block between two markers in `comparison.mdx`, because that needs no Fumadocs
feature. Verification task of P8-11: if Fumadocs includes a generated Markdown file in the page and in the
Markdown route, P8-11 uses the include and removes the markers.

## 6. Maintenance

### 6.1 Who and when

| Event                                          | Action                                                                     | Who                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------- |
| An Oxform release is prepared                  | `compare:check`, update pins, `compare:size`, review the matrix            | The person who releases                       |
| A change in `examples/comparison` or a pin     | `compare:size`, commit `size.json`                                         | The author of the change                      |
| A major version of another library is released | Update that library's forms and matrix cells against its new documentation | The owner, from the report of `compare:check` |
| A correction arrives                           | Check it at the primary source, merge, measure again                       | The owner                                     |

### 6.2 Staleness rule

| Approach                                                       | Verification                                                                              | Risks and mitigation                                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **A (decided).** A warning on the page, and a block on release | Set `measuredAt` to an old date: the docs build shows the warning, and `prepublish` fails | The site can show a warning between releases. That is honest and accepted                                         |
| B. The docs build fails when the data is stale                 | The same, on `docs:build`                                                                 | A pull request that does not touch the comparison fails because time passed or another project released. Rejected |

Rule for A: the data is stale when `measuredAt` or any `readAt` is more than 90 days old, or when a pinned
version is behind a major version of `latest`. The docs build prints a warning block at the top of the page
with the date. `compare:check` fails `prepublish` on the same condition. The docs build does not call the
network: only `compare:check` reads the registry.

### 6.3 Work packages

`06-roadmap.md` owns the ids, the order and the exit criteria. This table gives the comparison scope of each.

| Id    | Title                | Scope                                                                                                             | Depends on                   | Verification                                                               |
| ----- | -------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| P7-07 | Form specifications  | The written specification and the shared Valibot schema of the two forms, and one shared browser test per form    | P1-07                        | The test runs against a stub and fails                                     |
| P7-08 | Research closure     | Resolve each "Unverified" cell of 2.2, 2.3 and 3.3 at a primary source, or remove the row. Write `features.json`  | None                         | No "Unverified" value in `features.json`. Each record has a source         |
| P7-09 | Comparison workspace | `examples/comparison`: four versions of each form, pinned versions, the review `readme.md`                        | P7-07, P5-07, P7-03          | The shared test passes for every version. `check:types` passes             |
| P7-10 | Measurement          | `compare:size`, `compare:check`, `size.json`, the root scripts                                                    | P7-09, `report:size` (P4-04) | Two runs give the same bytes. An old date makes `compare:check` fail       |
| P8-11 | The page             | `comparison.mdx`, the generated tables, `/comparison.json`, the warning block, the issue template, the `04#5` row | P7-08, P7-10, P8-01, P8-02   | `docs:build` and `docs:check:agents` pass. The `.md` route has both tables |
| P9-06 | Release gate         | `compare:check` in `prepublish`. A line in the definition of done                                                 | P7-10                        | `prepublish` fails with stale data                                         |

## 7. Risks

| #   | Risk                                                                                           | Mitigation                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The data goes stale. Three of the four libraries published in the last 100 days (T10, R8, F10) | The stamp beside every number, the warning, the release gate (6.2)                                                                                                                                                                                                                                                                                                                     |
| 2   | A maintainer says the comparison is unfair                                                     | Public source, the shared test, the review record, the correction path (4.6)                                                                                                                                                                                                                                                                                                           |
| 3   | Another library's API is misused, so its number is too high                                    | Fairness rule 1. A second reviewer for each version. Corrections are merged before the next release                                                                                                                                                                                                                                                                                    |
| 4   | The numbers make Oxform look worse                                                             | They are published as measured (fairness rule 5). The spike's full preset is 8.59 kB gzip without an adapter, and the lean sign-in chain is 6.43 kB without slots (`explorations/extension-api/readme.md`, "Bundle sizes"). Formisch states "starting at 2.5 kB" (F1). Oxform can be the largest row for sign-in. The page then says so, and "When to choose another library" names it |
| 5   | A matrix cell is wrong about another library                                                   | A source, version and date per cell. No cell from memory. P7-08 before publication                                                                                                                                                                                                                                                                                                     |
| 6   | The reference forms favour Oxform's design                                                     | They come from the catalogue, which was chosen before this plan. A form is corrected if a maintainer shows a bias (4.6, rule 6)                                                                                                                                                                                                                                                        |
| 7   | Four versions of two forms are a maintenance cost at each major release of another library     | Two forms only. If a version cannot be kept current, its row is removed with a dated note, not left stale                                                                                                                                                                                                                                                                              |
| 8   | The "planned" cells are read as shipped features                                               | The suffix on every Oxform cell, and one sentence in "In short", until the release                                                                                                                                                                                                                                                                                                     |
| 9   | Download and star counts change every week                                                     | They are dated facts in `features.json`, updated only at a release. The page shows the date                                                                                                                                                                                                                                                                                            |

## 8. Deviations and decisions

Every item is decided or is a verification task of a work package. `06-roadmap.md` records who decided.

1. **Two reference forms: Sign-in and Team invites.** Decided (owner, D50). The catalogue's checkout has no
   array (`04#4.1`). Team invites has the array and the server lookup, and "a page does not invent a new"
   domain. No third form is measured.
2. **No size gate.** Decided (owner decision 12). Size is measured and published only. `00#Principles` 5 and
   `03#Bundle content and size` say the same. The only gate here is on staleness.
3. **Page type.** Decided: `overview` (`04#6`, section 5).
4. **React only for size.** Decided (owner, D50). No Solid table.
5. **Performance is not compared.** Decided (owner, D50). React Hook Form states fewer re-renders as a main
   feature (R1). The page has no render-count row and states the omission (4.6, rule 7).
6. **The location of the result files.** Decided by `02#Comparison workspace`: `examples/comparison/results/`,
   next to its source.
7. **Unverified facts.** Resolved by P7-08 (2026-11-16), in 2.2, 2.3 and 3.3. TanStack Form: date of 1.0.0, a plugin mechanism, named sets of
   issues, agent documentation. React Hook Form: date of the first stable major, debounce and cancellation of
   async validation, `FormProvider` as a reuse API, agent documentation. Formisch: server rendering, devtools,
   uncontrolled inputs, debounce and cancellation, npm package names for Angular, HonoX and React Native, how
   "2.5 kB" is measured.
8. **Renames and public `createX`.** This file names no `createX` function and no adapter hook, so the
   decisions on renames and on non-public behavior functions do not change it.

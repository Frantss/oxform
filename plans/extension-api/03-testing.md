# Testing: layers, coverage, type tests, bundle checks and inventory

Status: complete, revision 4. This file agrees with [00-direction.md](./00-direction.md) (revision 4). It uses
the glossary, entry points and canonical names from that file. Signatures are in
[01-public-api.md](./01-public-api.md). Folders, scripts and CI jobs are in [02-structure.md](./02-structure.md).
Phases and risks are in [06-roadmap.md](./06-roadmap.md).

All tests are written new. The spike is the scenario inventory, not a source of test files.

Citation prefixes: `X/` is `explorations/extension-api/spike/src/`, `XT/` is
`explorations/extension-api/type-tests/`, `XR:` is `explorations/extension-api/readme.md:`, `B:` is
`docs/form-core-behaviors.md:` and `C:` is `docs/checks-and-issues.md:`. `B` and `C` describe today's behavior,
the "before" reference.

## Test layers

| Layer       | Proves                                                                   | Tool and environment                                   | Location and name                            |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------- |
| Unit        | One module does what its contract says, with only its stated needs       | `vp test`, Vitest 5.0.5, Node, browser mode off        | Beside the module: `src/**/<module>.spec.ts` |
| Integration | A critical flow works across modules, entry points or runtimes           | `vp test`, Node for core; Chromium for adapters        | `packages/<name>/tests/**/*.spec.ts(x)`      |
| Type        | Every public export infers and rejects                                   | `tsc --noEmit`, on source and on `dist` declarations   | `packages/<name>/tests/types/*.test-d.ts(x)` |
| Bundle      | A chain does not contain the extensions that it does not import          | `vp pack` of tier fixtures against `dist`, Node script | `packages/core/tests/bundle/tier-*.ts`       |
| Packaging   | The published package resolves, shares modules, and has no private doors | `publint --strict`, `attw`, Node specs on `dist`       | `packages/<name>/tests/package/*.spec.ts`    |

Evidence for the tools: `vitest` 5.0.5, `@vitest/coverage-v8` 5.0.5, `@vitest/browser-playwright` 5.0.5,
`playwright` 1.64.1, `typescript` ^7.0.2 and `vite-plus` ^1.4.0 (`package.json:34-40`). `vp test --help` lists
`--project`, `--coverage`, `--typecheck` and `--environment`.

Rules for all layers:

- Import test functions from `vite-plus/test` (`docs/testing.md:19`). The spike imports from `vitest`.
- Assert observable results: values, issues, status, DOM output, callbacks. Do not assert private state.
- A test cleans up the instances, subscriptions and owners that it creates (`docs/testing.md:39`).
- Shared helpers live in one module per package: a pass-through schema, a failing schema, a deferred schema
  and a fake element (the set in `X/test-helpers.ts`).

### Unit layer

- The root config turns browser mode on for every package (`vite.config.ts:42-49`), and core spreads it
  (`packages/core/vite.config.ts:6-7`). So today's core tests run in Chromium. The unit project sets
  `environment: 'node'` and `browser.enabled: false`, as the Solid server configs do
  (`packages/solid-v2/vite.ssr.config.ts:8-9`).
- One spec asserts that `window` and `document` are `undefined` (`X/smoke.spec.ts`). It fails if the project
  is moved back to the browser.
- A unit spec for a behavior function calls the internal `createX(ctx, deps)` with the dependencies it states,
  and imports it from its module, because no entry point exports it. A unit spec
  for a built-in extension builds the shortest chain that meets its needs, for example
  `defineForm(...).extend(values).extend(status)`. Neither uses `standard`. The spike tests status, events,
  reset and handles through the preset (`X/standard-form.spec.ts:5-273`); the new unit specs do not.
- "Unit" means Node only. The specs of an adapter that run in a browser are adapter tests, not unit specs.
- Each module with runtime code has a sibling spec. `check:test-structure` fails when `src/**/<module>.ts` has no
  `<module>.spec.ts` and is not excluded in [Coverage](#coverage).

### Integration layer

Rule for "critical": a flow gets an integration test only when it crosses an entry point, a runtime boundary
(server to browser) or an async order between two or more extensions, **and** a unit spec cannot fail for it.
Everything else is a unit test.

| #   | Critical flow                                    | Runs in             | Minimum scenarios                                                                                                                                                                                                                      | Spike reference                                                                        |
| --- | ------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| I1  | The `standard` preset end to end                 | Node, from `dist`   | Define, extend, configure, create, change, blur, validate, submit valid and invalid, reset, destroy, through the main, behaviors and presets entry points                                                                              | `X/standard-form.spec.ts`, `X/form.spec.ts:96-105`                                     |
| I2  | Validation lanes and races                       | Node                | Change during a run, newer run, reset during a run, change during submit, reset during submit, two checks pending                                                                                                                      | `X/validation-lanes.spec.ts:43-108`, `X/submit.spec.ts:78-109`                         |
| I3  | Custom extensions on a form                      | Node                | A test-local extension with an option, state, api, slot, field members and extension hooks; two extensions in both orders; destroy cleans up                                                                                           | `X/extension.spec.ts:56-160`, `X/extension-hooks.spec.ts:68-77`, `X/kit.spec.ts:16-36` |
| I4  | Scopes                                           | Node                | One scope definition at two paths and in two forms, field members on nested scopes, independent validation and reset                                                                                                                   | `X/scopes.spec.ts:24-142`, `X/field-extras.spec.ts:104-171`                            |
| I5  | Server rendering and hydration                   | Node, then Chromium | See the [parity suite](#adapter-tests-the-parity-suite), P10 to P13                                                                                                                                                                    | `explorations/behavior-api/proposal.md:281-289`                                        |
| I6  | Request-handler flow                             | Node                | Validate a body, render the errors from the same instance, two concurrent requests share nothing                                                                                                                                       | `X/inert-api.spec.ts:51-69`                                                            |
| I7  | Each adapter in a real browser                   | Chromium            | The parity suite                                                                                                                                                                                                                       | `X/react/parts.spec.tsx`, `X/react/parts-core.spec.tsx`                                |
| I8  | Examples                                         | Chromium            | One flow per example: validate, submit, reorder an array, reset                                                                                                                                                                        | `examples/react/src/tests/checks.spec.tsx:27-102`                                      |
| I9  | A lean chain equals the same steps of the preset | Node                | The I1 scenarios are tagged with the extensions they need. A lean chain (`values`, `validation`, `check('error')`, `status`, `events`, `submit`) runs every scenario whose tags it meets, with the same expected results as `standard` | `XR:166`, `explorations/extension-api/kit/lean-form.ts`                                |

I9 replaces the "built-in extensions equal the preset" test of revision 1. `standard` is the chain of the
built-in extensions (`XR:342`), so that test would compare a thing with itself.

Browser tests keep today's setup: headless Chromium at 1280 × 720 (`vite.config.ts:43-48`), `userEvent` and
page locators from `vite-plus/test/browser`, and `expect.element` for retried assertions
(`docs/testing.md:24-27`). Solid 2 keeps its 390 × 844 instance (`packages/solid-v2/vite.config.ts:19-22`).

### Packaging layer

| Check                            | What it does                                                                                                                                                                                           | Fails when                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `publint`, `attw`                | As today (`packages/core/package.json:36`), for every entry point. `attw` runs with `--profile esm-only`; the installed CLI has this profile                                                           | Either tool reports a problem                                                      |
| Preset uses only public exports  | A spec writes the `standard` chain again from the built entry points and passes I1. This is the direction's test. The static gate is the lint override of [02-structure.md](./02-structure.md)         | The chain cannot be written from the public exports                                |
| Adapter uses only public exports | A static check: every import of core in an adapter resolves to `@oxform/core` or `@oxform/core/adapter`                                                                                                | A deep import of core, or an import of another core entry point at runtime, exists |
| Adapter bundles no core          | A spec reads the adapter's `dist` and finds no marker of a core module                                                                                                                                 | A copy of core is in the adapter                                                   |
| Entry-point module sharing       | A spec imports the four built core entry points and creates one instance from a chain that mixes them. A second spec checks that no source module is emitted in two chunks. Both run in `test:package` | An internal channel rejects an object, or a module is duplicated                   |
| Consumer install                 | `check:consumers`: pack the tarballs, install them in an empty ESM project, and type-check a consumer file with `nodenext` resolution (today: `packages/solid/scripts/check-consumers.ts:15-58`)       | The consumer file does not compile                                                 |

The packages are ESM only (direction, owner decision 1). No check covers `require`.

## Coverage

"Full unit test coverage" means:

| Package                   | Measured from                          | Statements | Branches | Functions | Lines | Per file |
| ------------------------- | -------------------------------------- | ---------- | -------- | --------- | ----- | -------- |
| `@oxform/core`            | Unit specs only (Node)                 | 100        | 100      | 100       | 100   | Yes      |
| `@oxform/react`           | The adapter's browser and server tests | 100        | 95       | 100       | 100   | Yes      |
| `@oxform/solid` (1 and 2) | The adapter's browser and server tests | 100        | 95       | 100       | 100   | Yes      |

- Core already declares 100 on the four metrics (`packages/core/vite.config.ts:26-31`), but coverage is off by
  default (`:10`), and CI does not run `test:coverage` (`.github/workflows/ci.yml:44-45`). The new setup runs
  `test:coverage` in CI.
- Provider: `@vitest/coverage-v8` 5.0.5, with `thresholds: { 100: true, perFile: true }` for core. `perFile`
  stops one well-tested module from hiding another. Both options exist in the installed types.
- Untested files must count. In Vitest 5, `coverage.include` lists the files to report, tested or not. The
  `all: true` option in `packages/core/vite.config.ts:13` is not in the installed coverage option types; do not
  carry it over.
- An adapter has no Node-only unit surface, so its coverage comes from its own tests. The branch threshold is
  95 because framework-compiled JSX adds branches that a test cannot reach.
- Excluded: test code (`*.spec.ts(x)`, `*.test-d.ts(x)`, `tests/**`), entry-point barrels (re-exports only),
  type-only modules (type tests cover them), and `dist`, configuration and scripts.
- An inline `/* v8 ignore */` comment needs a reason on the same line. No source file is excluded by name.
  Today's list of five excluded runtime files (`packages/core/vite.config.ts:20-24`) is not carried over.

### Choice: keep integration tests out of unit coverage

| Approach                                                                                                 | Verification                                                                       | Risk and mitigation                                                                                                                            |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **A (decided).** Two Vitest projects, `unit` and `integration`. Coverage runs with `--project unit` only | Delete one unit spec: the coverage run fails although integration tests still pass | A unit spec can still use the preset. Mitigation: a lint rule bans the presets entry point in `src/**/*.spec.ts`, except the preset's own spec |
| B. One project, coverage `include` on `src`, tests filtered by a path argument                           | The same deletion test                                                             | The filter is in a script, not in the configuration, and is easy to drop                                                                       |

Rejected: one coverage number over all tests. It lets a browser flow satisfy a threshold that is about units.

## Unit test inventory

One table per module. "Spike" says whether the spike proves the group: **Yes**, **Preset** (proved only through
`standard`, so the unit spec is new), **Partly** or **No**. Rows are scenario groups, not cases.

### `defineForm` and `form.create`

| Scenario group                                                                     | Source                                           | Spike  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------ | ------ |
| An instance takes its values from `defaultValues`; each instance has its own state | `X/form.spec.ts:13`, `X/form.spec.ts:36`, `B:27` | Yes    |
| Options: `create` over `configure` over `defineForm`                               | `X/form.spec.ts:44`, `X/form.spec.ts:135`        | Yes    |
| The form has a name and lists the kind of every option                             | `X/form.spec.ts:51`, `X/form.spec.ts:187`        | Yes    |
| Creation is inert: no `window`, no timer, no request, no validation                | `X/inert-api.spec.ts:22-41`                      | Yes    |
| `destroy()` runs every cleanup once; the form `id` when no adapter gives one       | `X/form.spec.ts:294`, direction design item 7    | Partly |
| An unknown option at runtime is not an error                                       | `XR:358`                                         | No     |

### `form.extend`

| Scenario group                                                                                                                                 | Source                                             | Spike |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----- |
| Merges the api with the api before it; runs in call order; each step sees the earlier ones                                                     | `X/form.spec.ts:67`, `X/form.spec.ts:83`           | Yes   |
| Returns a new form and leaves the base unchanged                                                                                               | `X/form.spec.ts:75`                                | Yes   |
| Applies a preset, also on a form that has extensions, and an extension after it                                                                | `X/form.spec.ts:96-105`                            | Yes   |
| A duplicate option name throws at `extend` and names both extensions                                                                           | `X/form.spec.ts:203-211`                           | Yes   |
| A duplicate api key, a key the instance owns, or a duplicate state key throws at `create`                                                      | `X/form.spec.ts:215-228`, `X/context.spec.ts:24`   | Yes   |
| A missing need (api or state) throws at `create` before that extension's `api` runs, names the extension and the need, and returns no instance | [01-public-api.md](./01-public-api.md) section 3.1 | No    |
| A need that an earlier extension provides passes; a need that only a later extension provides throws                                           | [01-public-api.md](./01-public-api.md) section 3.1 | No    |
| Extension hooks of several extensions run in the order applied; an earlier interceptor feeds a later one                                       | `X/extension-hooks.spec.ts:68-77`                  | Yes   |

### `form.configure`

| Scenario group                                                              | Source                                     | Spike |
| --------------------------------------------------------------------------- | ------------------------------------------ | ----- |
| Every instance gets the configured options, also the ones of `defineForm`   | `X/form.spec.ts:129`, `X/form.spec.ts:151` | Yes   |
| Successive calls merge and a later call wins; `create` wins over both       | `X/form.spec.ts:135-144`                   | Yes   |
| Returns a new form; a later `extend` or preset keeps the configured options | `X/form.spec.ts:157-165`                   | Yes   |

### `defineExtension`

| Scenario group                                                                                   | Source                                            | Spike |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ----- |
| Adds an api, an option and a state slice; the state factory gets the merged options              | `X/extension.spec.ts:56-67`, `X/form.spec.ts:255` | Yes   |
| Is inert at creation, starts work on a change, cleans up on destroy                              | `X/extension.spec.ts:73-107`                      | Yes   |
| Adds a slot, keeps earlier slots, replaces a slot with an earlier key                            | `X/extension.spec.ts:118-129`                     | Yes   |
| Applies in any order that gives its needs                                                        | `X/extension.spec.ts:137`                         | Yes   |
| Extension hooks: `values.intercept` with `cancel()`, `values.onChange`; two instances stay apart | `X/extension-hooks.spec.ts:31-56`                 | Yes   |

### `option`

| Scenario group                                                                | Source                             | Spike  |
| ----------------------------------------------------------------------------- | ---------------------------------- | ------ |
| Each descriptor (`action`, `number`, `value`) records its runtime kind        | `X/form.spec.ts:238`, `XR:68`      | Yes    |
| `Self` in an option callback resolves to the instance                         | `X/form.spec.ts:273`, `XR:367-368` | Yes    |
| How an adapter treats each kind (an action stays current, a value is applied) | `X/adapter-controls.spec.ts:29-51` | Partly |

### `on` and field members

| Scenario group                                                                         | Source                                                                           | Spike |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----- |
| Members are added to every field handle and read the live value; base members stay     | `X/field-extras.spec.ts:44`, `X/field-extras.spec.ts:64`, `X/context.spec.ts:75` | Yes   |
| The guard decides at runtime; a rejected value gets no member                          | `X/context.spec.ts:88`, `XR:363-364`                                             | Yes   |
| Members of several extensions combine, in any order                                    | `X/field-extras.spec.ts:76`                                                      | Yes   |
| A member that redefines a handle member, or that two extensions add, throws with names | `X/context.spec.ts:99-107`, `X/field-extras.spec.ts:89`                          | Yes   |
| Scoped handles carry the members at any depth; the builder gets the relative path      | `X/field-extras.spec.ts:104-171`                                                 | Yes   |
| Field members on a form with no `field` api fail at `create`                           | `X/field-extras.spec.ts:189`                                                     | Yes   |

### `slots`, `defineSlots` and the slot groups

| Scenario group                                                                                                                                       | Source                                             | Spike  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------ |
| Each group resolves one key per part and declares its default element                                                                                | `X/slots.spec.ts:56-60`                            | Yes    |
| `fieldSlots`: state to attributes, element events to the events api, element registration                                                            | `X/slots.spec.ts:67-79`                            | Yes    |
| `fieldErrorSlots`: the `fieldError` part is present only with errors and exposes the messages                                                        | `X/slots.spec.ts:96`                               | Yes    |
| `submitSlots`: form status and button type                                                                                                           | `X/slots.spec.ts:105-115`                          | Yes    |
| `rootSlots` on a chain with `submit` and no `reset`: prevents the default of `submit` and `reset`, and calls `submit.run` with the submitter's value | [01-public-api.md](./01-public-api.md) section 3.2 | Partly |
| `resetSlots`: a `click` prevents the default and calls `reset.all()`                                                                                 | [01-public-api.md](./01-public-api.md) section 3.2 | No     |
| `fieldSlots` on a chain with no check: the attributes, `aria-invalid` from `status`, no `aria-describedby`                                           | [01-public-api.md](./01-public-api.md) section 3.2 | No     |
| `fieldErrorSlots`: its `field` part has the attributes of `fieldSlots`, plus `aria-describedby` while the path has errors                            | [01-public-api.md](./01-public-api.md) section 3.2 | Partly |
| A group with a missing need (api or state) throws at `create`, and names the group and the need                                                      | [01-public-api.md](./01-public-api.md) section 2.3 | No     |
| A group spreads into any form; the form keeps only the groups it spreads                                                                             | `X/slots.spec.ts:130`                              | Yes    |
| Slots resolve in extension order; a later key replaces an earlier one                                                                                | `X/slots.spec.ts:142-160`                          | Yes    |
| `slots(build)` adds slots only, merges across `extend` calls, reads the form's state                                                                 | `X/slots.spec.ts:172-199`                          | Yes    |
| Slots read the real store of a chain (valid until a check holds an issue)                                                                            | `X/slots.spec.ts:216-227`                          | Preset |

### Context

| Scenario group                                                                          | Source                                                 | Spike |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----- |
| State slices start in the store; each extension sees only its own, over one store       | `X/context.spec.ts:5-14`                               | Yes   |
| Option listeners fire; cleanups run on destroy                                          | `X/context.spec.ts:33`                                 | Yes   |
| A derived slice keeps its reference while nothing changes, also across subscribe cycles | `X/context.spec.ts:49`, `X/derived-status.spec.ts:163` | Yes   |
| An object that did not come from the context factory is refused                         | `X/context.spec.ts:62`, `X/public-surface.spec.ts:87`  | Yes   |

### Scopes (`defineScope`, `form.scope`)

| Scenario group                                                                                   | Source                                                             | Spike |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ----- |
| Defaults are placed at each path; an instance overrides a scope default                          | `X/scopes.spec.ts:24-37`, `X/form.spec.ts:306`                     | Yes   |
| Validators run at the path, get the values there, and their issue paths are prefixed             | `X/scopes.spec.ts:46`, `X/scopes.spec.ts:72`                       | Yes   |
| Paths are independent for validation, change and reset; one definition in two forms              | `X/scopes.spec.ts:57`, `X/scopes.spec.ts:95`                       | Yes   |
| The view: same type at a placed scope, a plain object path and an array item; no instance member | `X/scopes.spec.ts:111-142`                                         | Yes   |
| Rule 1 and rule 5: an own key or a dotted key throws at `create` and names the scope             | `X/scopes.spec.ts:157`, `X/scopes.spec.ts:237`, `XR:197`, `XR:201` | Yes   |
| Rule 2: defaults deep-merge in priority order; arrays replace                                    | `X/scopes.spec.ts:167-189`, `XR:198`                               | Yes   |
| Rule 3 and rule 4: both validators run and merge; an unknown check throws                        | `X/scopes.spec.ts:198-231`, `XR:199-200`                           | Yes   |
| Rule 6: a `schema` validates nothing, on the form and on a scope                                 | `X/scopes.spec.ts:247`, `XR:202`                                   | Yes   |

### `createEffect`

| Scenario group                                                                      | Source                               | Spike |
| ----------------------------------------------------------------------------------- | ------------------------------------ | ----- |
| Not called for the first selection; called for each change that is not deeply equal | `X/effect.spec.ts:6-18`, `B:292-293` | Yes   |
| Stops after unsubscribe; async callbacks may overlap                                | `X/effect.spec.ts:31-42`, `B:294`    | Yes   |

### Path helpers (`get`, `idPart`, internal path functions)

The spike has no spec for `X/paths.ts`. Every row is new.

| Scenario group                                                                    | Source                                                                        | Spike |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----- |
| `get`: nested keys, array indices, the empty path, a missing segment              | `X/paths.ts:4`                                                                | No    |
| Immutable write: only the path's ancestors get new references                     | `X/paths.ts:11`, `X/values.spec.ts:21`                                        | No    |
| Overlap: ancestor, descendant, sibling, and a key that is a prefix of another key | `X/paths.ts:38`, `X/validation-lanes.spec.ts:79`                              | No    |
| Deep equality: objects, arrays, dates, files, `undefined` against missing         | `X/paths.ts:26`                                                               | No    |
| `idPart`: a stable, valid id part for every path                                  | `00-direction.md#Canonical public names`, `00-direction.md#Settled decisions` | No    |

### Built-in extensions: rows that every one has

Each built-in extension has one spec for its internal behavior function and its wrapper. The headings below
name the internal functions. The tables after this one list
the behavior scenarios. These wrapper rows apply to each of the nine extensions.

| Scenario group                                                                                          | Source                                                                     | Spike  |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| Applies where its needs are met, and adds exactly its options, state slice, api and slots               | `XR:285-294`, `X/validation.spec.ts:143`                                   | Partly |
| Is rejected by the types where a need is missing                                                        | `X/validation.spec.ts:132`, `XT/kernel-extensions.ts:64-72`                | Yes    |
| Throws at `create` for each missing need of 01, 3.1, and names itself and the need                      | [01-public-api.md](./01-public-api.md) section 3.1                         | No     |
| On a chain with no `validation` (status, events, arrays, reset, submit, handles): acts as with no check | [01-public-api.md](./01-public-api.md) section 3.1, `X/submit.spec.ts:191` | Partly |
| Is inert at creation; internal channels refuse an api that the behavior did not create                  | `X/inert-api.spec.ts:29`, `X/public-surface.spec.ts:87`                    | Yes    |

### `values` (`createValues`, `createChange`)

| Scenario group                                                                                                   | Source                            | Spike |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----- |
| Change pipeline: write, notify, return `true`; rewrite; cancel; no notify without a change; details; unsubscribe | `X/change.spec.ts:13-61`          | Yes   |
| Read the whole object and a path; write one path by value or updater, siblings kept                              | `X/values.spec.ts:13-38`, `B:365` | Yes   |
| An equal value returns `false` and does not notify; interceptors run before the write                            | `X/values.spec.ts:45-54`          | Yes   |
| The store starts from `defaultValues`; a later `defaultValues` option changes later resets, not the values       | `X/values.spec.ts:67`, `B:27-28`  | Yes   |
| Schema output transformations do not replace values                                                              | `B:28-29`                         | No    |

### `validation` (`createValidation`)

| Scenario group                                                                                                                      | Source                                                                    | Spike  |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| No check is valid; result grouped by check name; run validity covers this run only                                                  | `X/validation.spec.ts:32-43`, `X/validation-lanes.spec.ts:207`, `B:58-60` | Yes    |
| Targets: none, a path, a list, an empty list; descendants in, ancestors and siblings out; pathless issues only for a whole-form run | `X/validation-lanes.spec.ts:146-181`, `B:62-65`                           | Yes    |
| `{ key }` segments and numeric indices give the same dotted path                                                                    | `X/validation-lanes.spec.ts:164`, `B:67-68`                               | Yes    |
| Event selection: an untyped run uses every event; a typed run uses only that event                                                  | `X/validation-lanes.spec.ts:191`, `C:194-198`                             | Partly |
| Stale results: overlapping change, any change for a whole-form run, newer run, unrelated change kept, side-by-side lanes            | `X/validation-lanes.spec.ts:43-108`, `B:81-84`                            | Yes    |
| Rejection rejects the run and clears its lane                                                                                       | `X/validation-lanes.spec.ts:122`, `B:84-85`                               | Yes    |
| `validating` while one run is pending, and until the last of two runs settles                                                       | `X/public-surface.spec.ts:25`, `B:375`                                    | Partly |
| `onRun`: every completed run, not a rejected run, and the rule for a discarded run                                                  | `X/validation.spec.ts:118`, `X/validation-lanes.spec.ts:131`              | Partly |
| A validator function receives the full values, also for a targeted run. Its input has no `status` (G2)                              | `X/validation.spec.ts:109`, `B:63-64`                                     | Partly |
| The validation link: registered when `validation` runs; a stand-in with no check on a form without it                               | [01-public-api.md](./01-public-api.md) section 3.1                        | No     |
| Read path: `checks` in registration order, `issues(path?)` without validating                                                       | `X/public-surface.spec.ts:8-15`                                           | Yes    |

### `check(name, options)` (`createCheck`)

| Scenario group                                                                                                    | Source                                                        | Spike  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| The name comes from the argument, in the api and in the options; two checks with one name throw                   | `X/validation.spec.ts:143-158`                                | Yes    |
| An exclusive check replaces every entry in scope, manual ones too; with no validator for the event it leaves them | `X/validation.spec.ts:59-68`, `B:76-77`                       | Yes    |
| A non-exclusive check refreshes the selected event; other events and untyped entries stay                         | `X/warning-check.spec.ts:57`, `C:176-179`                     | Yes    |
| A non-exclusive check, event with no validator: that event's entries stay until `clear` (a change from 0.x)       | `C:359-361`, [01-public-api.md](./01-public-api.md) section 8 | No     |
| Entries outside the run scope stay; descendants are included; nested read                                         | `X/validation.spec.ts:77-86`                                  | Yes    |
| `set` with replace, append and keep; the payload path does not redirect                                           | `X/validation.spec.ts:95`, `C:329-345`                        | Partly |
| Blocking: `error` always; another check only when it says so; two checks do not clear each other                  | `X/warning-check.spec.ts:39-81`, `C:388-410`                  | Partly |
| `validates(event)`; `clear(path?)` for one subtree or everything                                                  | `X/public-surface.spec.ts:39-46`                              | Yes    |
| Form-level (pathless) issues: set, read, replaced by a whole-form run, kept by a targeted run                     | `C:316-327`, direction design item 7                          | No     |
| Entries follow array items on swap, move, prepend, insert and remove                                              | `X/arrays.spec.ts:140-172`                                    | Yes    |

### `status` (`createStatus`)

| Scenario group                                                                                        | Source                                                                   | Spike  |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| A change marks the field and its ancestors, no sibling and no descendant                              | `X/standard-form.spec.ts:6`, `B:159`, `B:172`                            | Preset |
| `should.dirty` and `should.touch` off; a refused change marks nothing                                 | `X/standard-form.spec.ts:17-26`, `B:171`                                 | Preset |
| `default` follows the values; `dirty` stays after a return to the default                             | `X/standard-form.spec.ts:50`, `X/derived-status.spec.ts:61`, `B:277-278` | Preset |
| Field `valid` reads its own path; form `valid` reads every path                                       | `X/standard-form.spec.ts:75`, `X/derived-status.spec.ts:48`, `B:279`     | Preset |
| `defaultStatus` and `defaultFieldStatus`: wildcard, and a path override over it                       | `X/standard-form.spec.ts:84`, `XR:441`                                   | Preset |
| Form `pristine` stays true when submit sets form `dirty`                                              | `B:280-281`                                                              | No     |
| Derived shape: an entry per node, no raw flags, `form` and `at()` read it, entries follow array items | `X/derived-status.spec.ts:6-72`                                          | Yes    |
| Memoization per path; selectors do not fire for an unrelated field                                    | `X/derived-status.spec.ts:113-152`                                       | Yes    |
| `validating`, reset state and submit state appear; status writes are not on `StatusApi`               | `X/derived-status.spec.ts:87-99`, `X/public-surface.spec.ts:61`          | Yes    |

### `events` (`createEvents`)

| Scenario group                                                                                                   | Source                                    | Spike  |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------ |
| `change`, `focus` and `blur` update status and drive the registered element                                      | `X/standard-form.spec.ts:35`, `B:159-161` | Preset |
| Validation is requested only when a validator exists; `should.validate` decides; the same for `blur` and `focus` | `X/standard-form.spec.ts:60`, `C:214-228` | Partly |
| An operation returns before async validation completes                                                           | `B:173-174`                               | No     |
| Register and unregister: `null` is a no-op; unregister keeps the value                                           | `B:162-163`                               | No     |
| `ref` and `clearRefs` are not on `EventsApi`; the handle still exposes the ref                                   | `X/public-surface.spec.ts:70-78`          | Yes    |

### `arrays` (`createArrays`)

| Scenario group                                                                                                | Source                                                    | Spike  |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| Append, prepend, insert: negative index, padding, absent array, an insertion takes an item and not an updater | `X/arrays.spec.ts:12-27`, `B:237-239`, `B:247-249`        | Partly |
| Swap and move: same index, order of the others, a no-op move, positive out-of-range indices                   | `X/arrays.spec.ts:36-50`, `B:240-241`, `B:246`            | Partly |
| Update: value or updater, clamped index, item state reset, empty array                                        | `X/arrays.spec.ts:59`, `B:242`, `B:247`                   | Partly |
| Remove: clamped index, state shift, validation always skipped                                                 | `X/arrays.spec.ts:73`, `B:243`                            | Yes    |
| Replace: array or updater, state reset, shorter replacement drops trailing state                              | `X/arrays.spec.ts:89`, `B:244`                            | Partly |
| Dirty, touched and change validation apply to the array and its ancestors                                     | `X/arrays.spec.ts:100`, `B:232-233`                       | Partly |
| Item ids: stable on read, follow items, new for new items and after replace; `ids` is not on `ArraysApi`      | `X/arrays.spec.ts:111-126`, `X/public-surface.spec.ts:70` | Yes    |

### `reset` (`createReset`)

| Scenario group                                                        | Source                                                                    | Spike  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| Restores default values, field state, issues and form status          | `X/standard-form.spec.ts:110`, `B:126-127`                                | Preset |
| Given values do not change the defaults; a status override applies    | `X/standard-form.spec.ts:124`, `B:128-129`                                | Preset |
| `keep`: selected checks, refs, and `fields` over both                 | `X/standard-form.spec.ts:135`, `X/public-surface.spec.ts:95`, `B:129-131` | Preset |
| One path: default or given value, with its subtree, siblings kept     | `X/standard-form.spec.ts:150`, `B:166`, `B:180-182`                       | Preset |
| A pending validation run is discarded; reset itself does not validate | `X/standard-form.spec.ts:168`, `C:200`                                    | Partly |
| `reset.all` clears the element refs of `events` unless `keep.refs`    | `X/public-surface.spec.ts:95`                                             | Preset |

### `submit` (`createSubmit`)

| Scenario group                                                                                                                 | Source                                                | Spike  |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ------ |
| Sets `submitting` and form `dirty` synchronously, validates, calls `onSubmit` with values and the instance, records the result | `X/submit.spec.ts:27`, `B:97-102`                     | Partly |
| `onInvalid` gets every current issue; the intent reaches both callbacks                                                        | `X/submit.spec.ts:41-54`, `C:247`                     | Yes    |
| A preserved blocking issue fails a valid run; a non-blocking issue does not                                                    | `X/submit.spec.ts:66`, `C:238-260`                    | Partly |
| Concurrent calls share one attempt; a new attempt is possible after it settles                                                 | `X/submit.spec.ts:78`, `X/submit.spec.ts:168`, `B:99` | Yes    |
| Abort without callbacks on a value change, a superseding run or a reset; still settles                                         | `X/submit.spec.ts:93-109`, `B:104-107`                | Partly |
| Rejection of the callback or of validation; `successful` stays false                                                           | `X/submit.spec.ts:123-131`, `B:109-110`               | Yes    |
| `intercept` (sync and async, cancel) and `onResult`; submit with no `validation`                                               | `X/submit.spec.ts:140-154`, `X/submit.spec.ts:191`    | Yes    |

### `handles` (`createHandles`)

| Scenario group                                                                                           | Source                                                                    | Spike  |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| Field handle: live `state` and operations bound to a path; array handle with ids                         | `X/standard-form.spec.ts:183`, `X/standard-form.spec.ts:273`, `B:152-166` | Preset |
| Check sugar for the checks before `handles` in the chain; none for a later check or without `validation` | `X/standard-form.spec.ts:196`, `XR:417-421`                               | Partly |
| `setError` life: removed on change of the field or an ancestor, on reset; removes only what it set       | `X/standard-form.spec.ts:206-247`                                         | Preset |
| `scope(path)` at any depth and on an array item path                                                     | `X/standard-form.spec.ts:263`, `X/scopes.spec.ts:142`                     | Yes    |

### The `standard` preset

Unit scope is the composition only. Behavior detail stays in the specs above.

| Scenario group                                                              | Source                                                 | Spike  |
| --------------------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| Applies the nine extensions in the documented order, with `handles` last    | `00-direction.md#Canonical public names`, `XR:431-433` | Partly |
| Applies to a form that already has extensions, and keeps configured options | `X/form.spec.ts:105`, `X/form.spec.ts:165`             | Yes    |
| Resolves one slot per part (five parts) of its four slot groups             | `X/slots.spec.ts:212`, `01-public-api.md` section 3.2  | Partly |
| Needs nothing: applies to `defineForm(...)` alone, and creates an instance  | `01-public-api.md` section 4                           | Yes    |

### Adapter controls

Their public home is `@oxform/core/adapter` (direction, owner decision 8).

| Scenario group                                                                             | Source                             | Spike |
| ------------------------------------------------------------------------------------------ | ---------------------------------- | ----- |
| New options on a live instance merge like the ones at creation; configured options survive | `X/adapter-controls.spec.ts:29-51` | Yes   |
| Unmount stops the work in progress and leaves the instance usable for a new mount          | `X/adapter-controls.spec.ts:64`    | Yes   |
| An object that is not an instance is refused                                               | `X/adapter-controls.spec.ts:83`    | Yes   |

## Type tests

### Rule that makes coverage "full"

1. `check:type-coverage` reads the exported names of every entry point from the built declarations (`dist/**/*.d.ts`).
2. Each name must be imported, from its entry point, in at least one `*.test-d.ts(x)` file of that package.
3. Each name needs one positive case and one `@ts-expect-error` case in a block that names it. A name that
   cannot have a negative case (for example `Unsubscribe`) is on an exemption list with a reason.
4. Type tests import by package name. One `tsconfig` maps the names to the source. A second one resolves them
   through the package `exports` to `dist` (`check:types:dist`). Both runs must pass.

The script fails the build when a rule is broken. It also fails when an export is not in the inventory of
[01-public-api.md](./01-public-api.md), so the published surface cannot grow unseen.

### Choice: the type-test runner

| Approach                                                                                             | Verification                                                            | Risk and mitigation                                                                                            |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **A (decided).** Plain `tsc --noEmit -p` on two projects, with `expectTypeOf` and `@ts-expect-error` | Remove a negative case's error cause: `tsc` reports an unused directive | No per-test report. Mitigation: one file per export group, so the file name locates a failure                  |
| B. Vitest typecheck (`vp test --typecheck`, default include `**/*.{test,spec}-d.*`)                  | The same                                                                | It parses `tsc` output; not verified with TypeScript 7.0.2. A second run against `dist` needs a second project |

A is the spike's technique: its type tests were checked with `tsc` 7.0.2 (`XR:239`). It is also today's
`check:types` (`packages/core/package.json:35`). The `*.test-d.ts` name matches B's default pattern, so B can be
added later with no rename. Rejected: `tsd` or `dtslint` (a new dependency for what `tsc` does), and type
assertions inside runtime specs only (`docs/testing.md:58-62`; they cannot run against `dist`).

### Matrix

There is no kind to conform to. Types are inferred from the chain, so the tests are inference tests.

| Export (or group)                                                                                                          | Positive inference                                                                                                                                                         | Negative (`@ts-expect-error`)                                                                                                                                                                                                                                  | Spike source                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `defineForm`, `Form`, `AnyForm`, `BaseOptions`                                                                             | `Values` from the schema; `name`, `id`, `scopes`                                                                                                                           | Wrong default shape; an option that no extension declares                                                                                                                                                                                                      | `XT/extension-api.ts:153-159`, `XT/consumer.tsx`                                        |
| `form.extend`, `Extendable`, `Needs`, `BuiltInApis`                                                                        | A chain accumulates options, state, api, slots and fields; any order that gives the needs                                                                                  | A missing need; a need applied after its user; one case per need of a built-in extension (the 17 needs of 01, 3.1)                                                                                                                                             | `XT/extension-api.ts:200-208`, `XT/kernel-extensions.ts:64-72`, `XT/reuse.ts:20-24`     |
| `form.configure`                                                                                                           | Typed by the extensions so far; calls merge to the same form type; `create` types every option                                                                             | An option of an extension applied later; wrong value types                                                                                                                                                                                                     | `XT/extension-api.ts:173-195`                                                           |
| `form.create`, `Instance`, `InstanceOf`                                                                                    | The instance has the api of every step                                                                                                                                     | A member of an extension that is not in the chain                                                                                                                                                                                                              | `XT/extension-api.ts:211-213`                                                           |
| `defineExtension`, `Extension`, `FormContext`, `StateSlice`                                                                | `ctx` is typed by `options` and `state` of the same object; `needs` lists the names of the `Extendable` parameter                                                          | A wrong state type; an unknown state key; a missing `api`; a `needs` list with a missing or an extra name                                                                                                                                                      | `XT/extension-api.ts:55-65`, `XT/extension-api.ts:291-297`                              |
| `option`, `OptionDescriptor`, `OptionKind`, `Self`                                                                         | Each descriptor's type; `Self` resolves to the instance in `configure` and `create`                                                                                        | A callback argument that the values do not have                                                                                                                                                                                                                | `XT/extension-api.ts:95-121`, `XT/form-argument.ts`                                     |
| `on`, `FieldMembers`, `FieldOf`, `FieldsOf`                                                                                | Members only on fields whose value fits; an upper bound; on scoped handles                                                                                                 | A member on a non-string field; a path beyond a leaf                                                                                                                                                                                                           | `XT/extension-api.ts:107-149`                                                           |
| Duplicate names                                                                                                            | A duplicate-free chain compiles                                                                                                                                            | A scope key that the form's values own, or with a dot (the other duplicates are runtime errors)                                                                                                                                                                | `XT/scopes.tsx:82`, `X/form.spec.ts:203-228`                                            |
| Presets as a function from form to form                                                                                    | A generic preset with nine extensions, on a form that has extensions                                                                                                       | An extension that the preset did not add                                                                                                                                                                                                                       | `XT/extension-api.ts:258-283`                                                           |
| `ValuesOf`, `ApiOf`, `StateOf`, `OptionsOf`, `PartsOf`                                                                     | Each read-back type of a lean chain and of `standard`                                                                                                                      | A read-back of a member that the chain lacks                                                                                                                                                                                                                   | `XT/extension-parts.tsx:20-50`, `XR:369-371`                                            |
| `defineScope`, `Scope`, `ScopeDefinition`, `ScopedValues`, `form.scope`                                                    | Each scope adds to `Values`; one function fits a placed scope, a plain path, an array item and another form                                                                | A path that holds no object; a scope as an instance member                                                                                                                                                                                                     | `XT/scopes.tsx:27-101`                                                                  |
| `defineSlots`, `slots`, `Slot`, `SlotFactory`, `SlotDefinition`, `SlotRecord`                                              | State, props and element per slot; an inline slot reads typed state                                                                                                        | A missing api need, a missing state need, both, inside `defineExtension` too; a `needs` list that differs from the `slot` annotation                                                                                                                           | `XT/part-scope.tsx:96-165`, `XT/extension-parts.tsx:104`                                |
| `PartSpec`, `PartHandle`, `PartEventContext`, `PartDomProps`, `PropKind`, `PropsOf`, `KeyProp`, `Attributes`, `ElementTag` | Parts come from the slot declarations; a `KeyProp` resolves to the paths                                                                                                   | A name that is not a path; a wrong element                                                                                                                                                                                                                     | `XT/extension-parts.tsx:50-79`                                                          |
| `createEffect`, `get`, `idPart`                                                                                            | The callback gets the selected type; `get` returns `PathValue`                                                                                                             | An unknown state key; an unknown path                                                                                                                                                                                                                          | none                                                                                    |
| `Path`, `PathValue`, `ObjectPath`, `ArrayPath`, `ArrayItem`, `ArrayValue`                                                  | Nested keys, indices, optional arrays, unions                                                                                                                              | An unknown path, a non-array path, a wrong item type                                                                                                                                                                                                           | `XT/consumer.tsx`                                                                       |
| `Updater`, `MaybePromise`, `Unsubscribe`, `DeepPartial`                                                                    | One positive case each                                                                                                                                                     | `Updater` and `DeepPartial` only; the others are exempt                                                                                                                                                                                                        | none                                                                                    |
| Each built-in extension and its `*Api` type (one row per extension)                                                        | On the shortest chain, the instance gains the api, options and state; the derived status is the public state                                                               | A missing need; a wrong path or value                                                                                                                                                                                                                          | `XT/kernel-extensions.ts:16-72`, `X/validation.spec.ts:132-143`, `X/submit.spec.ts:181` |
| `handles` and the check-name sugar                                                                                         | Sugar for each check before `handles`; `check('warning')` gives `warning()` and `setWarning()`                                                                             | No sugar without `validation`; none for a check after `handles`; an unknown check                                                                                                                                                                              | `XT/kernel-extensions.ts:16-55`                                                         |
| Behavior support types (`FieldHandle`, `ArrayHandle`, `FieldState`, `CheckEntry`, ...)                                     | Reached through the owning api                                                                                                                                             | One case per type that takes `Values` or a check name                                                                                                                                                                                                          | `XT/consumer.tsx`                                                                       |
| `rootSlots`, `fieldSlots`, `fieldErrorSlots`, `submitSlots`, `resetSlots`                                                  | Part names and elements per group, on the chains of 01, 3.2: `standard`, the lean sign-in (`rootSlots` with no `reset`) and the member filter (`fieldSlots` with no check) | One case per need of 01, 3.2 (12): `rootSlots` without `submit`; `resetSlots` without `reset`; `submitSlots` without `status`; `fieldSlots` without `events`, `values` (api), `values` or `status` (state); `fieldErrorSlots` without each of these or `error` | `XT/part-scope.tsx:96-121`                                                              |
| `standard`                                                                                                                 | The full consumer flow; an extension after the preset                                                                                                                      | Only `error` exists; no member of an extension that was not applied                                                                                                                                                                                            | `XT/consumer.tsx`, `XT/composition.tsx`                                                 |
| `onSubmit` and `onInvalid` instance argument                                                                               | Carries the api and field members of the whole chain                                                                                                                       | A member on the wrong path                                                                                                                                                                                                                                     | `XT/form-argument.ts`                                                                   |
| Adapter `createParts`: parts, `Root`, element map                                                                          | Element per slot, typed names, options as `Root` props; `Root` of a form with no `root` slot                                                                               | A wrong name; an element for a part the form lacks; an option prop beside `form` (G12)                                                                                                                                                                         | `XT/extension-parts.tsx:50-79`, `XT/consumer.tsx`                                       |
| Adapter `scope` prop, `useScope`                                                                                           | Names are paths of the scope's values, nested too                                                                                                                          | A form path inside a scope                                                                                                                                                                                                                                     | `XT/part-scope.tsx:48-76`, `XT/extension-parts.tsx:68`                                  |
| Adapter `useForm`, `useSelector`, `useField`, `useArray`, `usePart`                                                        | Selected type; handle with field members                                                                                                                                   | An unknown name; a non-array path                                                                                                                                                                                                                              | `XT/extension-parts.tsx:83-104`, `XT/composition.tsx`                                   |

Two known gaps get a test that pins the current result: a forgotten `scope` compiles when the name is also a
form path (`XT/part-scope.tsx:48`), and a scope of another shape is accepted (`XT/scopes.tsx:62-63`).

### Depth guard

`X/api.ts:823` and `X/api.ts:911` record shapes that fail with "Type instantiation is excessively deep". One
file, `depth.test-d.tsx`, must compile under both `tsconfig` projects with no `@ts-expect-error`:

- A duplicate-free chain of nine extensions, and a preset that applies nine inside a chain
  (`XT/extension-api.ts:229-283`).
- `standard` plus three extensions with field members, then `scope(a).scope(b).scope(c).field(...)`.
- A `Values` type of 60 fields with nested objects and arrays, used with `Path`, `PathValue` and every part.

No instantiation-count budget is set. Add one only when a real form hits the limit (YAGNI).

## Adapter tests: the parity suite

React, Solid 1 and Solid 2 must each pass every scenario. The spike has only the React adapter.

| #   | Scenario                                                                                                                                                  | Runs in  | Spike reference                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| P1  | Parts render in the declared element; typing writes to the form; option props reach the instance; `Root` of a form with no `root` slot renders no element | Chromium | `X/react/parts.spec.tsx:22`, `X/react/parts-core.spec.tsx:50-79`                                |
| P2  | Submit through the root: issues in the error part, `onSubmit` with values, the pressed button                                                             | Chromium | `X/react/parts.spec.tsx:36-58`, `:654`                                                          |
| P3  | Adapter hooks read state; a part re-renders only when what it shows changes                                                                               | Chromium | `X/react/parts.spec.tsx:75`, `:244`                                                             |
| P4  | Author props and handlers merge with the slot's; the element registers and unregisters                                                                    | Chromium | `X/react/parts.spec.tsx:143-197`                                                                |
| P5  | A part renders as another element, and through `usePart`                                                                                                  | Chromium | `X/react/parts.spec.tsx:228`, `X/react/parts-core.spec.tsx:92`                                  |
| P6  | Scopes: the `scope` prop, nested scopes, a placed scope, and adapter hooks with `{ scope }`                                                               | Chromium | `X/react/parts.spec.tsx:274-359`, `:710`                                                        |
| P7  | Arrays: a swap keeps the input element and its focus                                                                                                      | Chromium | `X/react/parts.spec.tsx:333`                                                                    |
| P8  | Input types: checkbox, radio, select, multiple select, number, file, and file reset                                                                       | Chromium | `X/react/parts.spec.tsx:425-562`                                                                |
| P9  | Ids: stable and unique for two forms on one page; label, control and error are linked                                                                     | Chromium | `00-direction.md#Settled decisions`                                                             |
| P10 | Server HTML of the quick start matches a stored snapshot (values, `aria-*`, `disabled`)                                                                   | Node     | `explorations/behavior-api/proposal.md:283-284`, `X/react/parts.spec.tsx:126`                   |
| P11 | Hydration of P10's HTML: no warning or error in the console, controls are not replaced                                                                    | Chromium | `explorations/behavior-api/proposal.md:285`, `packages/solid-v2/src/tests/hydration.spec.tsx:8` |
| P12 | Two concurrent server renders of one form share no state                                                                                                  | Node     | `explorations/behavior-api/proposal.md:286`, `packages/solid-v2/src/server-tests/ssr.spec.ts:9` |
| P13 | A server render starts no subscription, validation, timer or effect                                                                                       | Node     | `packages/solid-v2/src/server-tests/ssr.spec.ts:24`                                             |
| P14 | An existing instance given to `Root`; unmount stops the work; a double mount still works                                                                  | Chromium | `X/react/parts.spec.tsx:94-112`, `X/react/parts-core.spec.tsx:112`                              |

P14's double mount is React strict mode; Solid runs the same scenario as mount, dispose, mount.

### Choice: share the list without sharing framework code

| Approach                                                                                                                                                                                                                                                                                                                                                    | Verification                                                                  | Risk and mitigation                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **A (decided).** The private `adapter-parity` package holds the fixture forms and one function per scenario. A scenario takes a driver: `mount(fixture)`, `renderToString(fixture)`, `hydrate(html, fixture)`, `unmount()`. It asserts on the DOM, the HTML and the core instance only. Each adapter writes the driver and the fixture views in its own JSX | Break one adapter on purpose: the same scenario id fails in that adapter only | A scenario may need a framework detail. Mitigation: it stays adapter-local and is listed as an addition to the suite |
| B. The shared package holds only scenario ids and titles. Each adapter writes its own tests, and a script checks that every id has a test                                                                                                                                                                                                                   | The script fails when an id is missing                                        | The tests can drift in what they assert                                                                              |

Rejected: end-to-end tests on the example apps only. They cannot cover server HTML per adapter, and a failure
does not name the adapter contract that broke.

The shared package has no framework dependency; a lint rule fails if it imports `react`, `solid-js` or an
adapter. `check:parity` compares the exported names of the three adapters. The P10 snapshot is one file per fixture, shared by the three adapters after id normalization.

## Bundle content and size

No size budget exists (direction, owner decision 12). This section has a check that blocks a merge and a
report that does not.

### Tree-shaking content check

The check proves the Lightweight principle without a size number: a chain does not contain the extensions that
it does not import. The tiers come from the extension API spike (`XR:447-467`). Each tier is a real form built
with `defineForm(...).extend(...)`.

| Tier                                                                                   | Must not contain                                                                       | Spike gzip, for reference |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------- |
| Values only                                                                            | Validation, status, arrays, slots                                                      | 3.54 kB                   |
| Values, status, events                                                                 | Validation, arrays, reset (`XR:473`)                                                   | 4.99 kB                   |
| Values, status, events, plus `fieldSlots` (the member filter, E02)                     | Validation, check, arrays, reset, submit, the `root` and `fieldError` slots            | not measured              |
| Values, validation, one check                                                          | Scope hooks, status                                                                    | 4.80 kB                   |
| The same, plus a placed scope                                                          | Status                                                                                 | 5.38 kB                   |
| Lean sign-in (values, validation, check, status, events, submit)                       | Arrays, reset, handles, scope prefix, field slots (`XR:472-473`)                       | 6.43 kB                   |
| Lean sign-in with slots (the same, plus `rootSlots`, `fieldErrorSlots`, `submitSlots`) | Arrays, reset, handles, scope prefix, the `reset` slot                                 | not measured              |
| Full `standard` preset with its four slot groups                                       | —                                                                                      | 8.59 kB                   |
| Builder only, no extension                                                             | Every extension. It is the dependency backstop of [02-structure.md](./02-structure.md) | 3.12 kB                   |

- Each tier fixture imports only from `@oxform/core`, `@oxform/core/behaviors` and `@oxform/core/presets`,
  resolved to the built `dist`. The spike imports source files, which does not prove that the published entry
  points tree-shake.
- One build per tier, so no shared chunk hides content (`XR:449-450`).
- "Must not contain" is checked by a marker string per extension in the output, as the spike did by hand
  (`XR:471-475`).
- The two tiers with slot groups prove owner decisions 14 and 17 of the direction: each group brings only
  what it needs. `rootSlots` does not bring `reset`, and `fieldSlots` does not bring a check or `submit`.
- Fail conditions: a forbidden marker present; a marker that is absent from the full preset tier (so a marker
  cannot go stale); a tier fixture that imports outside those three entry points; a missing tier. A size never
  fails the check.

### Size report

- `report:size` measures the same tier outputs: minified and gzipped, with dependencies bundled. It prints one
  line per tier and exits 0 for every size.
- The spike sizes in the table are the reference until the first complete build. The spike's path helpers are
  simpler than today's (`XR:492-493`), so the first real numbers can be higher.
- The documentation publishes the measured sizes ([04-documentation.md](./04-documentation.md)).
- The comparison with other form libraries is measured in `examples/comparison` by `compare:size`.
  [07-comparison.md](./07-comparison.md) owns its method.
- Both measurements are reports, not a test layer: nothing asserts on a size, neither is part of `check:all`,
  and neither blocks a merge.
- The shared browser test of each comparison form is part of the comparison workspace
  ([07-comparison.md](./07-comparison.md), section 4.6). It proves that every version meets the form's
  specification. It is not a test layer of the packages, it is not one of the I8 example flows, and it does
  not count toward coverage.

### Choice: how to measure

- **A (decided).** Keep the spike's method: `vp pack` per tier, then a Node script per job: one that reads
  the markers, one that gzips and prints. Verification: import an extension that a tier must not contain, and
  the check fails. Risk: a bundler update changes the output, and a marker disappears. Mitigation: each marker
  must be present in the full preset tier.
- B. `size-limit` with a bundler plugin. Risk: a new dependency and a second bundler, with sizes that differ
  from what `vp pack` ships, and a budget model that the plan does not use.

## Performance

The first spike measured derived status once: 0.03 ms, 0.19 ms and 1.09 ms per change at 20, 200 and 1000
fields (`explorations/behavior-api/spike-results.md:122-123`). The direction accepts the linear cost.

- **A (decided).** One benchmark file that repeats that measurement (the `bench` script). It is run by hand and before a
  release, and does not gate CI. Verification: the numbers are in the notes of each release. Risk: it can
  rot. Mitigation: it is type-checked with the package.
- B. No benchmark. Risk: "revisit if a measured form needs it" has no tool.

Rejected: a time threshold in CI. Shared runners make it flaky. The correctness side (stable references, no
update for an unrelated field) is a unit group under `status`. Verification task of P4-06: confirm that the
installed Vite+ exposes Vitest's bench mode before the file is written; if not, use a plain Node script.

## CI mapping

Requirements only. [02-structure.md](./02-structure.md) owns the script names and the job layout. The names
this file uses are `test:coverage`, `check:test-structure`, `check:types:dist`, `check:type-coverage`,
`test:package`, `check:consumers`, `check:parity`, `check:tree-shaking`, `report:size`, `compare:size` and `bench`.

| Requirement                                                              | Layer                                                 | Needs a build | Blocks a merge |
| ------------------------------------------------------------------------ | ----------------------------------------------------- | ------------- | -------------- |
| Unit specs with coverage thresholds, core                                | Unit                                                  | No            | Yes            |
| "Every module has a spec", duplicate titles, one assertion per unit case | Unit structure                                        | No            | Yes            |
| Integration specs in Node, core (I2 to I4, I6, I9; I1 from `dist`)       | Integration                                           | I1 only       | Yes            |
| Parity suite and adapter coverage, per adapter (I5, I7)                  | Integration                                           | Core `dist`   | Yes            |
| Example tests (I8)                                                       | Integration                                           | All packages  | Yes            |
| Type tests on source                                                     | Type                                                  | No            | Yes            |
| Type tests on `dist`, and `check:type-coverage`                          | Type                                                  | Yes           | Yes            |
| Tree-shaking content check                                               | Bundle                                                | Yes           | Yes            |
| Size report and comparison measurement                                   | Report, not a layer                                   | Yes           | No             |
| `publint`, `attw`, module sharing, public exports only, consumer install | Packaging                                             | Yes           | Yes            |
| Documentation snippets compile (`docs:check:agents`, Twoslash)           | Owned by [04-documentation.md](./04-documentation.md) | Yes           | Yes            |
| Benchmark                                                                | Performance                                           | No            | No             |

Build runs before every row that needs it, as today (`.github/workflows/ci.yml:35-45`). Playwright stays cached
by version (`:21-33`). No layer is skipped when an earlier one fails, so one run shows all failures.

## Deviations and decisions

Every item is decided or is a verification task of a work package. `06-roadmap.md` records who decided.

1. **Spike sizes in the readme disagree by 0.03 kB.** The table has 6.43 and 8.59 kB (`XR:460-461`); the
   findings say 6.40 and 8.56 kB (`XR:476-477`). This file uses the table. The sizes are a reference only: no
   budget exists (direction, owner decision 12).
2. **Adapter-facing core surface** (direction design item 2). Decided. `@oxform/core/adapter` is the fourth
   core entry point (direction, owner decision 8), and [01-public-api.md](./01-public-api.md), section 7.2,
   lists its contents.
3. **Test conventions differ from today's.** `docs/testing.md:8-11` puts core tests in `src/tests/` and type
   contracts in `*.spec.ts` (`:58-62`). The two scripts scan only `src` for `.spec.ts(x)`
   (`packages/core/scripts/check-test-structure.ts:11`, `:24`; `check-test-duplicates.ts:10`, `:22`).
   Decided (D07): keep both rules, give the scripts the roots `src` and `tests`, and apply the one-assertion
   rule to unit specs only. An integration flow needs several assertions by nature.
4. **Adapter coverage numbers.** Decided (D29): 100, with 95 for branches. The direction asks for enforced
   coverage on core only. Verification task of P1-06 and P5-07: V8 coverage in 5.0.5 merges a browser project
   and a Node project into one report. Fallback: thresholds per project.
5. **Vitest typecheck with TypeScript 7 is not verified.** That is why approach B is not used (D11).
6. **Behavior decisions that tests need.** Closed. [01-public-api.md](./01-public-api.md), sections 7.7 and 8,
   gives the answer for each, and the rows above follow them.
7. **Most duplicate names are runtime errors, not type errors** (`XR:172-173`). The type matrix can test only
   the scope-key cases. The other duplicates are unit rows under `form.extend`.
8. **Slot-group needs.** Closed. A group's needs, state needs too, are checked where it is spread and at
   `create` ([01-public-api.md](./01-public-api.md), section 3.2). Every need is required (direction, owner
   decision 17). The type matrix has one negative case per need of each group and of each built-in
   extension, and the unit rows test the runtime error (`XT/part-scope.tsx:96-165`).
9. **The kit is not shipped** (direction, entry-point rules). I3 uses test-local extensions, not `kit/`. The kit's
   own specs (`X/kit.spec.ts`) move with the example kit, which [02-structure.md](./02-structure.md) places.
10. **Not built in the spike:** the Solid adapters and a replacement for `useFormEffect` (direction design
    item 4). The parity list comes from React only. A row that Solid needs is added in phase 6 (R17).
11. **End state of the two behavior documents.** Delete both, and do not rewrite
    `docs/form-core-behaviors.md` as a new specification. The unit specs are the specification, and the public
    reference explains it. Condition for both files: every row above that cites `B:` or `C:` has a passing
    test. Until then both files stay unchanged. [04-documentation.md](./04-documentation.md), section 9, follows
    this condition.
12. **Documentation snippets are not a test layer here.** Twoslash snippets and `docs:check:agents` stay owned
    by [04-documentation.md](./04-documentation.md). They do not count toward type coverage: the
    `check:type-coverage` script reads only `*.test-d.ts(x)` files. This file only requires that the check blocks a
    merge.
13. **Negative type cases have an exemption list.** The direction asks for a positive and a negative case for
    every export. A type that accepts every input (for example `Unsubscribe` and `MaybePromise`) cannot have a
    negative case. Rule: the exemption list is one file in `tests/types/`, each entry has a reason, and
    `check:type-coverage` fails for an exempt name with no reason.

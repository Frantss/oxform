# Structure: workspace, packages, build, tooling and CI

Status: complete, revision 4. This file agrees with [00-direction.md](./00-direction.md), revision 4, and its
owner decisions. It owns the workspace layout, the source layout of each package, the build, the package
manifests, the tooling and CI. It describes the target state. Nothing is moved: every file is written new.
Differences from other plan files are in [Deviations and decisions](#deviations-and-decisions).

Related files: export inventory in [01-public-api.md](./01-public-api.md), tests in
[03-testing.md](./03-testing.md), documentation in [04-documentation.md](./04-documentation.md), order of
work in [06-roadmap.md](./06-roadmap.md).

Citations: `X/` is `explorations/extension-api/`. Installed versions used as evidence: `vite-plus` 1.4.0
(`pnpm-workspace.yaml` `catalogs.oxform`), which bundles tsdown 0.23.1
(`@voidzero-dev/vite-plus-core/package.json`), Oxlint 1.89.0, `@changesets/cli` 3.0.3 with
`@changesets/config` 4.0.1, `@arethetypeswrong/cli` 0.18.5, `publint` 0.3.25.

## Target workspace

```
/
├── apps/
│   └── docs/            # @oxform/docs. Public documentation site (04-documentation.md)
├── packages/
│   ├── core/            # @oxform/core. Entry points ".", "./behaviors", "./presets", "./adapter"
│   ├── react/           # @oxform/react. React adapter, one entry point
│   ├── solid/           # @oxform/solid. Published. Assembles "." (Solid 1) and "./v2" (Solid 2)
│   ├── solid-v1/        # Private. Solid 1 adapter source and tests
│   ├── solid-v2/        # Private. Solid 2 adapter source and tests
│   └── adapter-parity/  # Private. The parity scenarios that every adapter must pass (03-testing.md)
├── examples/
│   ├── kit/             # Private. Framework-neutral code of the example catalogue. Core only
│   ├── react/           # Private. The catalogue rendered with React, with browser tests
│   ├── solid/           # Private. The catalogue rendered with Solid 1
│   ├── solid-v2/        # Private. The catalogue rendered with Solid 2
│   └── comparison/      # Private. The reference forms written with each form library (07-comparison.md)
├── docs/                # Contributor guides
├── plans/               # Plans. This folder stays until the roadmap is complete
├── reports/             # Findings, one file per topic (AGENTS.md "Findings")
├── scripts/             # check-terms.ts, the glossary check for source, tests and contributor guides
├── .changeset/          # Changesets configuration and pending changesets
├── .github/workflows/   # CI
├── pnpm-workspace.yaml  # Globs `apps/*`, `packages/*`, `examples/*` (unchanged)
├── tsconfig.json        # Base compiler options (unchanged)
└── vite.config.ts       # Shared lint, format and test configuration, plus the new lint overrides
```

What is deleted:

| Path                                  | What happens                                                             |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `packages/*/src`, `export`, `scripts` | Deleted. New files are written in the same package folders.              |
| `examples/*/src`                      | Deleted. New examples are written from the example catalogue of 04.      |
| `explorations/`                       | Deleted in the last phase of [06-roadmap.md](./06-roadmap.md).           |
| `packages/*/CHANGELOG.md`             | Kept. Changesets appends to them.                                        |
| `examples/react/CHANGELOG.md`         | Deleted. Private workspaces are not versioned (see [Release](#release)). |

`explorations/` is a hazard while it stays. The spike's types import today's core source
(`X/spike/src/api.ts` imports `packages/core/src/types/deep`), its build resolves dependencies from
`packages/*/node_modules`, and its size baseline reads `packages/core/dist/index.js`
(`X/spike/vite.config.ts`). The spike stops building when the new `packages/core` lands. Mitigation: tag the
last commit where the spike builds, and record the baseline size in `03-testing.md` first.

## `@oxform/core`

### Areas and dependency direction

The package has three public areas and one private area. Each public area is one folder and one barrel. A
fourth barrel, `export/adapter.ts`, has no folder: it exports adapter-facing functions of `main/` and
`internal/`. So the package has four core entry points.

| Area      | Folder           | Barrel                | Entry point              | May import at runtime from   |
| --------- | ---------------- | --------------------- | ------------------------ | ---------------------------- |
| Main      | `src/main/`      | `export/index.ts`     | `@oxform/core`           | `src/internal/`              |
| Behaviors | `src/behaviors/` | `export/behaviors.ts` | `@oxform/core/behaviors` | `src/main/`, `src/internal/` |
| Presets   | `src/presets/`   | `export/presets.ts`   | `@oxform/core/presets`   | The two public barrels only  |
| Internal  | `src/internal/`  | none                  | none                     | Nothing in the package       |

Type-only imports may cross areas, as the direction states (`Needs` and `BuiltInApis` name behavior api
types). The spike already has this direction at runtime: `form.ts` imports only `context.ts`, each behavior
imports `form.ts`, and `standard.ts` imports behaviors, `form.ts` and `slots.ts` (import lines of
`X/spike/src/*.ts`). A preset imports from `#core` and `#core/behaviors` (the barrels), so it cannot use a
private member by construction.

### Source tree

```
packages/core/
├── export/
│   ├── index.ts              # @oxform/core
│   ├── behaviors.ts          # @oxform/core/behaviors
│   ├── presets.ts            # @oxform/core/presets
│   └── adapter.ts            # @oxform/core/adapter
├── src/
│   ├── main/
│   │   ├── form.ts           # defineForm, defineExtension, optionTypes, on, defineSlots, slots, the needs check at create.
│   │   │                     #   Also the adapter-facing slotsOf, adapterControlsOf and prefixOf, with the scope prefix key
│   │   ├── context.ts        # The form context: state slices, derived state, field members. Owns contextInternals
│   │   │                     #   and the validation link with its stand-in (01-public-api.md, 3.1 and section 5)
│   │   ├── scopes.ts         # defineScope. Carries its mount and verify hooks, so form.ts never imports it
│   │   ├── effect.ts         # createEffect
│   │   ├── path.ts           # get, idPart
│   │   ├── types.ts          # Form, Instance, Extension, Extendable, Needs, option, slot, part and scope types
│   │   └── path-types.ts     # Path, PathValue, ObjectPath, ArrayPath, ArrayItem, ArrayValue, utility types
│   ├── behaviors/            # One module per behavior: the internal `createX(ctx, deps)` function, its
│   │   │                     #   extension wrapper and its api types. Only the extension and the types are exported
│   │   ├── change.ts         # createChange (no extension)
│   │   ├── values.ts         # createValues, values
│   │   ├── validation.ts     # createValidation, validation. Owns the check registry. Registers the validation link
│   │   ├── check.ts          # createCheck, check. Owns checkInternals
│   │   ├── status.ts         # createStatus, status. Owns statusInternals
│   │   ├── events.ts         # createEvents, events. Owns eventsInternals
│   │   ├── arrays.ts         # createArrays, arrays. Owns arraysInternals
│   │   ├── reset.ts          # createReset, reset
│   │   ├── submit.ts         # createSubmit, submit
│   │   ├── handles.ts        # createHandles, handles, FieldHandle, ArrayHandle. Reads the scope prefix key of main/form.ts
│   │   └── slots.ts          # rootSlots, fieldSlots, fieldErrorSlots, submitSlots, resetSlots. One internal
│   │                         #   function builds the `field` slot of fieldSlots and of fieldErrorSlots
│   ├── presets/
│   │   └── standard.ts       # standard
│   └── internal/
│       └── paths.ts          # segments, getAt, setAt, joinPath, ancestorsOf, isWithin, isDeepEqual
├── tests/
│   ├── *.spec.ts             # Integration flows. Import only through the #core* barrels
│   ├── helpers.ts            # Shared fixtures (03-testing.md)
│   ├── types/                # *.test-d.ts
│   ├── bundle/               # tier-*.ts fixtures, markers.ts, and the vite.config.ts that packs the tiers
│   └── package/              # *.spec.ts. Node specs on `dist`: module sharing, no private access
├── scripts/
│   ├── check-tree-shaking.ts # Reads tests/bundle/dist, exits 1 when a tier holds a marker it must not
│   ├── measure-bundles.ts    # Reads tests/bundle/dist, reports the gzip size of each tier. Never fails on a size
│   ├── check-test-duplicates.ts
│   ├── check-test-structure.ts # Also fails when a runtime module has no sibling spec
│   ├── check-type-coverage.ts  # The export-coverage rule of 03-testing.md, "Type tests"
│   └── check-consumers.ts      # Packs, installs in an empty ESM project, type-checks a consumer file
├── package.json, readme.md, tsconfig.json, vite.config.ts, CHANGELOG.md
```

Rules for the tree:

- The module list follows the spike (`X/spike/src/`). A behavior file has the name of its extension, so the
  approved renames (owner decision 10) change no file name. They change three internal functions:
  `createStatus`, `createEvents` and `createArrays`.
- A `createX` function is internal (owner decision 13). `export/behaviors.ts` exports the extension and the
  api types of each module, and no `createX`. A unit spec imports the function from its module.
- An extension wrapper is a function of the form (`X/spike/src/values.ts:40`), not a module-level call. So
  one module can hold the behavior and its wrapper.
- Types live with the code that implements them. Behavior api types are in the behavior module. There is no
  single `api.ts`: the spike kept all types in one 1011-line file (`X/spike/src/api.ts`) that imports React.
- A unit spec is beside its module: `src/behaviors/values.ts` and `src/behaviors/values.spec.ts`.
- An internal channel is exported by the module that owns its `WeakMap`, and by no barrel
  (`X/spike/src/context.ts:42-44`, `status.ts:48-50`, `check.ts:30-32`, `events.ts:22-24`, `arrays.ts:20-22`).
- `get` and `idPart` are main APIs, but the spike defines them in `slots.ts` (`X/spike/src/slots.ts:15-16`),
  which is a behaviors module. In the target they are in `main/path.ts`.
- `form.ts` reaches a scope only through the symbol keys that the scope definition carries
  (`X/spike/src/form.ts:67-69`, `scopes.ts:5-7`). A form without scopes does not load `scopes.ts`.
- The validation link and its stand-in live in `main/context.ts`. `status`, `events`, `reset` and `handles`
  reach `validation` only through it and import nothing from `validation.ts` at runtime, as in the spike
  (`X/spike/src/status.ts:15-17`, `events.ts:13-14`, `reset.ts:1-5`). `submit` and `arrays` keep their spike
  channel imports (`isDiscarded`, `checkInternals`). These are internal channels, not needs.
- No module is added for the hard needs: the split of the built-in pieces (`01-public-api.md`, 3.1 and 3.2)
  changes module contents only.

### Enforcement of the dependency direction

Verified in Oxlint 1.89.0: `no-restricted-imports` (with `patterns` and `allowTypeImports`), `import/no-cycle`
and `import/no-relative-parent-imports` exist. `import/no-restricted-paths` does not exist. The root
`vite.config.ts` already uses `lint.overrides` with `files` globs (`vite.config.ts:14`).

| Approach                          | How                                                                                             | Verification                                                        | Risks and mitigation                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A. Lint overrides (decided, D10)  | `lint.overrides` per area with `no-restricted-imports` patterns, plus `import/no-cycle`         | A deliberate wrong import in each area fails `pnpm run check:rules` | `allowTypeImports` inside `patterns` is not yet used in this repository. Mitigation: prove it in the first work package, else B. |
| B. Spec on the source             | A Node spec in `tests/package/` reads the `from '#…'` lines of `src/**` and applies the table   | The same wrong imports fail `test:package`                          | A hand-written import parser. Mitigation: the alias rule makes every internal specifier start with `#`.                          |
| C. Tree-shaking check (always on) | The builder-only tier (`X/spike/src/bundle/tier-builder-only.ts`) must hold no extension marker | The check fails when main imports a behavior at runtime             | It detects, but does not name the import. It is a backstop, not the gate.                                                        |

Overrides for approach A:

| Files                                                     | Restricted specifiers                                                             | Type imports |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------ |
| `packages/core/src/internal/**`                           | `#main/*`, `#behaviors/*`, `#presets/*`, `#core*`                                 | Restricted   |
| `packages/core/src/main/**`                               | `#behaviors/*`, `#presets/*`, `#core*`                                            | Allowed      |
| `packages/core/src/behaviors/**`                          | `#presets/*`, `#core*`                                                            | Allowed      |
| `packages/core/src/presets/**`                            | `#main/*`, `#behaviors/*`, `#internal/*`, `#core/adapter`, relative paths         | Restricted   |
| `packages/core/tests/**`                                  | `#main/*`, `#behaviors/*`, `#presets/*`, `#internal/*`                            | Restricted   |
| `packages/{react,solid-v*}/src/**`                        | `@oxform/core/presets`, `@oxform/core/behaviors`                                  | Allowed      |
| `packages/core/src/**/*.spec.ts`, except `src/presets/**` | `#core/presets`, `#presets/*`                                                     | Restricted   |
| `packages/adapter-parity/**`                              | `react`, `react-dom`, `solid-js`, `@solidjs/*`, `@oxform/react`, `@oxform/solid*` | Restricted   |

Rejected: a custom Oxlint JS plugin (`lint.jsPlugins`, `node_modules/vite-plus/docs/guide/lint.md:86-93`). It
is more code to own than a built-in rule.

### Package manifest

ESM only (owner decision 1). Fields not listed stay as today (`packages/core/package.json`). `main`,
`module` and the top-level `types` are deleted: the `exports` map is the only resolution path.

```json
{
  "name": "@oxform/core",
  "version": "0.7.0",
  "type": "module",
  "sideEffects": false,
  "files": ["dist"],
  "imports": {
    "#core": "./export/index.ts",
    "#core/behaviors": "./export/behaviors.ts",
    "#core/presets": "./export/presets.ts",
    "#core/adapter": "./export/adapter.ts",
    "#*": "./src/*.ts"
  },
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./behaviors": { "types": "./dist/behaviors.d.ts", "default": "./dist/behaviors.js" },
    "./presets": { "types": "./dist/presets.d.ts", "default": "./dist/presets.js" },
    "./adapter": { "types": "./dist/adapter.d.ts", "default": "./dist/adapter.js" },
    "./package.json": "./package.json"
  }
}
```

- `#core*` aliases let presets and integration tests import the barrels from source. Exact keys come before
  `#*`, as `@oxform/react` does today (`packages/react/package.json` `imports`).
- No `typesVersions`. Today's `@oxform/solid` has it for a subpath under CJS-era resolution
  (`packages/solid/package.json:15`). The ESM-only profile of `attw` does not check that resolution.
- Package validation: `publint --strict` and `attw --pack --no-emoji --profile esm-only`. The profile exists
  in the installed CLI 0.18.5.
- Stage B of the in-package documentation adds `"docs"` to `files` (see [Release](#release)).

Dependencies:

| Package                 | Decision | Evidence                                                                                                                                                                                                        |
| ----------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/store`       | Keep     | The context and `createEffect` use it (`X/spike/src/context.ts`, `effect.ts`). About 1.7 kB gzip of every tier (`X/readme.md`, "Findings").                                                                     |
| `@standard-schema/spec` | Keep     | Types only (`X/spike/src/validation.ts`, `api.ts`).                                                                                                                                                             |
| `remeda`                | Remove   | The spike imports it nowhere. `X/spike/src/paths.ts` (39 lines) replaces `isDeepEqual`, `setPath` and `stringToPath`, today's runtime uses. The spike sizes assume its absence (`X/readme.md`, "Not measured"). |
| `type-fest`             | Remove   | Today's source uses `Simplify` and `PartialDeep` only (four imports in `packages/*/src`). `DeepPartial` is a canonical core type. A types-only dependency also reaches the `.d.ts` files of every consumer.     |

Risk of removing `remeda`: the new `isDeepEqual` and path parser must match the behavior that users rely
on (dates, maps, sets, bracket paths). Mitigation: unit specs of `internal/paths.ts` in `03-testing.md`. The
sizes can be above the spike's, and the size report shows them. The path types are also written new in
`main/path-types.ts`: the spike borrows them from today's `packages/core/src/types/deep.ts`.

### Adapter-facing exports

The spike's React adapter imports `adapterControlsOf` and `slotsOf` from `form.ts`, `prefixOf` from
`handles.ts`, and `getAt`, `isDeepEqual` and `joinPath` from `paths.ts` (`X/spike/src/react/create-parts.tsx:23-25`).
It reads `form.optionKinds` as a member of the form (`create-parts.tsx:29`), which the target removes
(`01-public-api.md`, D34). With core as a peer dependency, an adapter
needs a public home for them (design item 2). That home is `@oxform/core/adapter` (owner decision 8).
`01-public-api.md`, section 7.2, owns the list: `slotsOf`,
`adapterControlsOf`, `prefixOf`, `joinPath` and `isDeepEqual`. `getAt` is not in the list:
an adapter uses the public `get`. The packaging consequence of each choice that was considered:

| Approach                                            | Packaging consequence                                                                                                                                                                                   | Verification                                                                                                                | Risks and mitigation                                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Entry point `@oxform/core/adapter` (decided)     | One more barrel (`export/adapter.ts`), `exports` key, `#core/adapter` alias and pack entry. No new source module and no new chunk content: the functions are in `main/form.ts` and `internal/paths.ts`. | `attw` and type tests cover four entries. A `tests/package/` spec checks that an instance from `.` is known to `./adapter`. | A fourth public contract under semver. The scope prefix key and `prefixOf` are in `main/form.ts`, so this barrel imports no behaviors module. |
| B. No extra entry point: export from `@oxform/core` | No packaging change.                                                                                                                                                                                    | Type tests of the main entry                                                                                                | Adapter plumbing shows in every application's completion list, against design item 2.                                                         |
| C. No export: symbol keys on the objects            | No packaging change. Each adapter copies the three path helpers.                                                                                                                                        | A parity scenario per key                                                                                                   | No types across the boundary, and three copies of the helpers (against DIE). The spike uses this only for the scope prefix (`handles.ts:25`). |

Decided: A. The shared-chunk rule below makes it safe: `adapterControlsOf` reads a `WeakMap` in
`form.ts` (`X/spike/src/form.ts:81-82`), and all entries must reach the same copy. The lint table then
restricts adapters to `@oxform/core` and `@oxform/core/adapter`.

## Build

Each library package builds with `vp pack` (tsdown 0.23.1). Options checked in
`@voidzero-dev/vite-plus-core/dist/tsdown/index-types.d.ts`: `entry`, `format`, `platform`, `dts`,
`sourcemap`, `minify`, `clean`, `hash`, `unbundle`, `treeshake`, `outputOptions`, `deps.alwaysBundle`,
`deps.neverBundle`. `vp pack` has no `--config` flag (`vp pack --help`), so the tier fixtures have their own
folder with its own `vite.config.ts` (`tests/bundle/`), as the spike has.

### Entry points and shared chunks

The core `pack` configuration is one object with one entry per barrel (`index`, `behaviors`, `presets`, and
`adapter`) and `format: ['esm']`. The other keys stay as today (`packages/core/vite.config.ts`
`pack`): `platform: 'browser'`, `dts: true`, `sourcemap: true`, `minify: false`, `clean: true`,
`deps.alwaysBundle: [/#.*/]`.

Why this shares modules: the entries of one configuration are one Rolldown build, and a module that two
entries reach is emitted once, in a shared chunk. Separate configurations are separate builds and copy shared
code. The spike uses that on purpose for its tiers (`X/spike/vite.config.ts`: "One build per tier, so shared
code is not split into chunks"). The rule: **never one pack configuration per core entry point**.

| Approach                                        | Output                                   | Verification                                      | Risks and mitigation                                                                                                                    |
| ----------------------------------------------- | ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A. Bundled entries with shared chunks (decided) | The entry files and hashed shared chunks | `tests/package/` specs and the tree-shaking check | A consumer's bundler sees large chunks, so unused code leaves only by statement-level tree-shaking. Mitigation: the purity rules below. |
| B. `unbundle: true`                             | One output file per source module        | The same                                          | More files in `dist`, and internal module paths show in stack traces. `exports` still blocks deep imports.                              |

Decided: A (D05). It is today's output shape plus the new entries. P1-03 moves to B if a module is duplicated,
or P4-04 moves to B if the tree-shaking check fails because a chunk boundary keeps code alive. Rejected: hand-written `advancedChunks` (not needed here).

Module format: with ESM only, a process has one instance of each core module, whatever mix of `import` and
`require` its packages use. So the dual-package hazard (two sets of channel `WeakMap`s, and an instance that
one copy does not know) cannot occur. What remains is duplication inside one build, which the shared chunks
prevent, and two installed copies of core, which the peer dependency of the adapters prevents.

`tests/package/` (content owned by `03-testing.md`) must prove after each build that a form built through
all built entries works (a duplicated channel breaks it), and that no built `.d.ts` entry exports an
`*Internals` name.

### Tree-shaking

- `sideEffects: false` stays in every published manifest.
- The spike measured that a chain keeps only the extensions it imports (`X/readme.md`, "Findings"). That
  measurement bundled source modules, where an unused module is dropped as a whole. Bundled chunks do not
  give that, so each module-level statement must be removable alone.
- Module-level calls in the spike: five `defineSlots(...)` calls (`X/spike/src/slots.ts:51,105,117,134,142`)
  and `option = Object.fromEntries(...)` (`X/spike/src/form.ts:33`). Rule: each module-level `defineSlots`
  call in `src/` carries `/* @__PURE__ */`, `option` is an object literal, and no other module-level call
  exists in `src/`. The extension wrappers and `standard` are functions and need nothing.
- Not verified here (no build was run): that tsdown keeps the annotation in non-minified output. The tier
  fixtures import the built entries, so the tree-shaking check verifies it. If it fails, split `slots.ts`
  into one module per group and use approach B above.

## Adapters

### `@oxform/react`

```
packages/react/
├── export/index.ts           # createParts, usePart and their types. No re-export of core
├── src/
│   ├── create-parts.tsx      # createParts: Root, the part components, the `scope` prop
│   ├── hooks.ts              # useForm, useSelector, useField, useArray, useScope
│   ├── use-part.ts           # usePart
│   └── *.spec.tsx            # Adapter tests in the browser, beside the modules
├── tests/
│   ├── parity.spec.tsx       # Runs the scenarios of adapter-parity in Chromium
│   ├── server/               # Server rendering in Node (*.spec.tsx)
│   ├── types/                # *.test-d.tsx
│   └── package/              # Node specs on `dist`
├── package.json, readme.md, tsconfig.json, vite.config.ts, vite.ssr.config.ts, CHANGELOG.md
```

| Manifest field     | Target                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `exports`          | `.` only: `{ "types": "./dist/index.d.ts", "default": "./dist/index.js" }`, plus `./package.json`              |
| `peerDependencies` | `@oxform/core` (`workspace:^`), `react`                                                                        |
| `dependencies`     | `@tanstack/react-store` (`X/spike/src/react/create-parts.tsx:3`)                                               |
| `devDependencies`  | `@oxform/core` (`workspace:*`), `@oxform/adapter-parity`, `react`, `react-dom`, the type, test and check tools |
| `pack`             | As today with `format: ['esm']`, plus `deps.neverBundle: ['@oxform/core', /^@oxform\/core\//]`                 |

Today `@oxform/core` is a `dependency` of every adapter (`packages/react/package.json`,
`packages/solid/package.json`). It becomes a peer dependency. The spike has the adapter in one 287-line file
(`X/spike/src/react/create-parts.tsx`). The split above is a starting point: `01-public-api.md` owns the names.

### Solid

Owner decision 5 fixes the entry points: `@oxform/solid` and `@oxform/solid/v2`. This section decides how the
workspace produces them (D06). Neither Solid adapter exists in the spike (design item 4).

| Approach                             | Shape                                                                                      | Verification                                                                               | Risks and mitigation                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Keep three workspaces (decided)   | Private `solid-v1` and `solid-v2`, and the published `solid` that assembles `.` and `./v2` | `check-consumers.ts`: packs core and solid, installs each entry in an isolated application | An assemble script and three manifests to keep in step. Mitigation: the script is 28 lines today (`packages/solid/scripts/assemble.ts`).              |
| B. One workspace, two source folders | `packages/solid/src/v1` and `src/v2`, one pack configuration with two entries              | The same consumer check                                                                    | One workspace cannot install `solid-js` 1 and 2 under one name. It needs an npm alias, two tsconfigs with `paths`, and two compiler plugins together. |

Decided: A. The two runtimes differ in imports and compiler (`solid-js/web` against `@solidjs/web`,
`vite-plugin-solid` against `@solidjs/vite-plugin`, and every source file differs between
`packages/solid-v1/src` and `packages/solid-v2/src` today). Separate workspaces isolate that with no alias.
Rejected: two published packages (against owner decision 5), and Solid 2 only (`2.0.0-rc.19` is a release
candidate).

```
packages/solid-v1/  (the same tree in packages/solid-v2/)
├── export/index.ts           # createParts, usePart and their types
├── src/                      # create-parts.ts, hooks.ts, use-part.ts, and *.spec.tsx beside them
├── tests/
│   ├── parity.spec.tsx       # The scenarios of adapter-parity. Solid 2 also runs a mobile viewport, as today
│   ├── server/               # Server rendering, and hydration for Solid 2, in Node
│   └── types/                # *.test-d.tsx
├── package.json (private), tsconfig.json, vite.config.ts, vite.ssr.config.ts

packages/solid/
├── export/index.ts, export/v2.ts   # Re-export the private workspaces, for the type check only
├── scripts/assemble.ts             # Copies solid-v1/dist to dist/ and solid-v2/dist to dist/v2/
├── scripts/check-consumers.ts      # Isolated consumer check for both entries, ESM only
├── package.json, readme.md, tsconfig.json, CHANGELOG.md

packages/adapter-parity/
├── src/                      # Scenario definitions and the forms they use. Imports @oxform/core only
└── package.json              # Private, no build: exports "./*" → "./src/*.ts". Peer: @oxform/core
```

Manifest changes for `@oxform/solid`: `@oxform/core` becomes a peer dependency, and `remeda`, every
`require` condition and `typesVersions` are removed. Each adapter passes its own render and query functions
to the parity scenarios, so `adapter-parity` has no framework dependency.

## Examples

`examples/*` is the home of the code of the "Example catalogue" that [04-documentation.md](./04-documentation.md)
owns: one representative example per feature. The spike's sketches, kit and playground forms are evidence
that the API works. They are not the target content (direction, "Examples are chosen, not copied").

```
examples/
├── kit/                      # example-oxform-kit, private, no build
│   ├── src/                  # One module per catalogue example: the framework-neutral part
│   │                         #   (forms, custom extensions, presets, scopes, schemas), with *.spec.ts
│   └── package.json          # exports "./*" → "./src/*.ts". Peer: @oxform/core
├── react/                    # example-oxform-react
│   ├── src/examples/         # One module per catalogue example: the React rendering
│   ├── src/main.tsx, src/playground.tsx, index.html, playground.html
│   └── tests/                # One browser flow per example (03-testing.md)
├── solid/                    # example-oxform-solid. Same layout, Solid 1
├── solid-v2/                 # example-oxform-solid-v2. Same layout, Solid 2
└── comparison/               # example-oxform-comparison, private. See "Comparison workspace"
```

- The kit imports only `@oxform/core` entry points. The spike kit proves that this split works: it imports
  no adapter (`X/kit/*.ts` import lines). So one kit serves all three example apps, the docs and the tests.
- The docs `<include>` a kit file for framework-neutral code and an example-app file for rendering code.
  Solid 2 snippets come from `examples/solid-v2`, which type-checks them (04, section 8).
- Each example app still builds a `playground.html` entry that the docs app embeds
  (`apps/docs/package.json` `playground:build`).

| Approach for the kit                          | Verification                                              | Risks and mitigation                                                                        |
| --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| A. Private workspace `examples/kit` (decided) | `check:types` and `test` in the kit, and in each consumer | A source-only package: each consumer compiles it. Mitigation: plain TypeScript with no JSX. |
| B. A folder inside `apps/docs`                | The docs type check                                       | Examples would depend on the docs app, which reverses today's direction.                    |

Rejected: a copy of the kit per example workspace.

### Comparison workspace

`examples/comparison` serves the comparison page of the documentation (owner decision 16).
[07-comparison.md](./07-comparison.md) owns its design: the form specifications, the libraries, the fairness
rules, the measurement method and the staleness rule. This file owns only its place in the workspace.

| Item            | Target                                                                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content         | The two reference forms of `07-comparison.md`, section 4.2 (Sign-in and Team invites), written with each library in React                                                                                   |
| Shared          | One Valibot schema module per form, and one browser test per form that every version passes                                                                                                                 |
| Versions        | `package.json` pins an exact version of each library. The other libraries reach no other workspace                                                                                                          |
| Workspace       | `example-oxform-comparison`. Private, not versioned, not published                                                                                                                                          |
| `compare:size`  | Builds and measures every version, and writes `examples/comparison/results/size.json`, which is committed. It uses the bundler settings of `report:size`, so the repository has one way to measure a bundle |
| `compare:check` | The staleness check of `07-comparison.md`, section 6.2. It runs in `prepublish`                                                                                                                             |
| Gate            | No size gate. Neither script is part of `check:all` or a CI step                                                                                                                                            |

The result files stay in `examples/comparison/results/`, next to their source (`07-comparison.md`, section 8,
item 6). The docs page reads them (`04-documentation.md`, section 5).

## Tooling and scripts

Root scripts (`package.json`). The names stay as today unless stated.

| Script                                                | Target                                                                                                                                                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`, `build:dev`                                  | Unchanged: `vp run -r build`. It builds the libraries, the examples and the docs app                                                                                                                      |
| `test`                                                | Today's explicit chain, with the kit and the comparison workspace added. Each package `test` includes its Node and server runs                                                                            |
| `check`, `check:rules`, `check:format`, `check:types` | Unchanged. The lint overrides of this plan run in `check:rules`                                                                                                                                           |
| `check:package`                                       | Unchanged chain: core, react, solid                                                                                                                                                                       |
| `check:tree-shaking` (new)                            | `vp run @oxform/core#check:tree-shaking`. Fails when a tier contains an extension that its chain does not import                                                                                          |
| `report:size` (new)                                   | `vp run @oxform/core#report:size`. Reports the size of each tier. It has no budget and is not part of `check:all`                                                                                         |
| `compare:size` (new)                                  | `vp run example-oxform-comparison#compare:size`. Writes `results/size.json` for the comparison page. Not part of `check:all`                                                                              |
| `compare:check` (new)                                 | `vp run example-oxform-comparison#compare:check`. The staleness check of the comparison data. Runs in `prepublish`. Not part of `check:all`                                                               |
| `check:terms` (new)                                   | `scripts/check-terms.ts` at the root. The glossary check for `packages/*/src`, `packages/*/tests`, `examples/*` and `docs/*.md`. It uses the term list of `docs:check:agents` and allows code identifiers |
| `check:parity` (new)                                  | `vp run @oxform/adapter-parity#check:parity`                                                                                                                                                              |
| `test:coverage` (new)                                 | The `test:coverage` script of `@oxform/core`, `@oxform/react` and `@oxform/solid`                                                                                                                         |
| `docs:check:agents` (new)                             | `vp run @oxform/docs#check:agents`. It reads the output of `docs:build`                                                                                                                                   |
| `check:all`                                           | `check`, then `check:terms`, `check:package`, `check:parity`, `check:tree-shaking`                                                                                                                        |
| `docs:package` (new, stage B)                         | Copies the generated Markdown of the docs build into `packages/<name>/docs/`                                                                                                                              |
| `prepublish`                                          | `build`, `check:all`, `docs:check:agents`, `compare:check`, and `docs:package` in stage B                                                                                                                 |
| `postbuild`                                           | Deleted (deviation 2)                                                                                                                                                                                     |
| `fix:*`, other `docs:*`, `version:*`, `publish`       | Unchanged                                                                                                                                                                                                 |

Package scripts:

| Package                | Scripts                                                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@oxform/core`         | `build`, `test` (Node: `src/**/*.spec.ts`, `tests/*.spec.ts`), `test:coverage`, `test:dev`, `test:package` (Node, on `dist`), `check:types` (source and `tests/types/`), `check:types:dist`, `check:type-coverage`, `check:test-duplicates`, `check:test-structure`, `check:consumers`, `check:tree-shaking`, `report:size`, `check:package`, `bench` |
| `@oxform/react`        | `build`, `test` (browser, then `test:ssr`), `test:ssr` (Node), `test:coverage`, `test:dev`, `test:package`, `check:types`, `check:types:dist`, `check:type-coverage`, `check:consumers`, `check:package`                                                                                                                                              |
| `solid-v1`, `solid-v2` | `build`, `test` (browser), `test:ssr`, `test:coverage`, `test:dev`, `check:types`                                                                                                                                                                                                                                                                     |
| `@oxform/solid`        | `build` (both, then assemble), `test`, `test:ssr`, `test:coverage`, `check:types`, `check:types:dist`, `check:type-coverage`, `check:consumers`, `check:package`                                                                                                                                                                                      |
| `@oxform/docs`         | Today's scripts, plus `check:agents` (`apps/docs/scripts/check-agents.ts`) and, in stage B, `package`                                                                                                                                                                                                                                                 |
| `examples/*`           | `dev`, `build`, `test`, `check:types`. The kit and `adapter-parity` have `test` and `check:types` only, and `adapter-parity` also has `check:parity`. `examples/comparison` has `build`, `test`, `check:types`, `compare:size` and `compare:check`                                                                                                    |

- `check:package` in core is `check:test-duplicates`, `check:test-structure`, `publint --strict`,
  `attw --pack --no-emoji --profile esm-only`, `test:package`, `check:types:dist`, `check:type-coverage`, then
  `check:consumers`. React and Solid run the same chain without the two test-check scripts.
- `check:test-structure` also fails when a runtime module in `src/` has no sibling spec.
- `check:types:dist` runs `tsc` on the second type-test project, which resolves the package names through
  `exports` to `dist`. `check:type-coverage` runs `scripts/check-type-coverage.ts`, the export-coverage rule of
  `03-testing.md`.
- `test:package` holds the module-sharing specs, with the spec that no source module is emitted in two chunks.
- `check:consumers` packs the tarballs, installs them in an empty ESM project and type-checks a consumer file,
  as `@oxform/solid` does today.
- `test:coverage` in core runs the `unit` project with the thresholds of `03-testing.md`. In an adapter it
  runs the browser and server tests with the adapter thresholds.
- `check:parity` runs `packages/adapter-parity/scripts/check-parity.ts`. It reads the built declarations of
  the three adapters and compares the exported value and type names (`01-public-api.md`, 6.4, item 1). Items 2
  and 4 of that list are scenarios of the parity suite.
- `bench` runs the benchmark of `03-testing.md`. It is run by hand and is not a CI step.
- The migration guide has no script. Its check is a trial by hand, recorded in `reports/`
  (`05-migration-guide.md`, Part A).
- `check:tree-shaking` in core runs `vp pack` in `tests/bundle/` and then `scripts/check-tree-shaking.ts`.
  The tiers are those of the spike (`X/spike/src/bundle/tier-*.ts`), written as real forms that import the
  built entries. `03-testing.md` owns the tiers and what each must not contain.
- `report:size` in core runs the same pack and then `scripts/measure-bundles.ts`. It prints the gzip size of
  each tier and exits 0 for every size. No budget exists (owner decision 12). The documentation publishes
  the numbers (`04-documentation.md`), and `07-comparison.md` owns how the comparison page uses them.
- `compare:size` and `compare:check` are described in [Comparison workspace](#comparison-workspace).
- File locations agree with `03-testing.md`. The base `test.include` (`vite.config.ts:56`) matches every spec
  location. Each package narrows it to separate the browser, Node and `dist` runs. Core unit and integration
  specs run in Node with browser mode off, which is a change from today's base configuration.
- The two test-check scripts scan `src` only today (`packages/core/scripts/check-test-structure.ts:11`). The
  new scripts scan `src` and `tests`.

### Release

| Item                     | Target                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version                  | `0.7.0` for `@oxform/core`, `@oxform/react` and `@oxform/solid` (owner decision 2). No prerelease mode.                                                                                   |
| `.changeset/config.json` | Add `fixed: [["@oxform/core", "@oxform/react", "@oxform/solid"]]` and `privatePackages: { "version": false, "tag": false }`. Both keys exist in the schema of `@changesets/config` 4.0.1. |
| Flow                     | One `minor` changeset that names the three packages. `pnpm run version:bump`, then `pnpm run publish`. Manual, as today. No release workflow is added.                                    |
| Peer range               | `workspace:^` in each adapter, published as `^0.7.0`. With `fixed`, an adapter always has a matching core.                                                                                |
| In-package docs          | Stage A (this release): each readme links the site. Stage B: `docs:package` runs in `prepublish`, `"docs"` joins `files`, and `packages/*/docs/` joins `.gitignore`.                      |

| Approach to reach 0.7.0                           | Verification                                                   | Risks and mitigation                                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. `fixed` group and one changeset (decided, D04) | `pnpm exec changeset status --verbose` shows 0.7.0 three times | `@oxform/solid` is at 0.2.0, and a new peer dependency can make Changesets plan a major bump for dependents. Mitigation: read the status output first, else B. |
| B. Set the three versions by hand                 | The three manifests and changelogs show 0.7.0                  | One hand-written changelog entry. Changesets takes over from 0.7.1.                                                                                            |

### CI

| Approach                            | Shape                                                                       | Verification                             | Risks and mitigation                                                         |
| ----------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| A. One job, ordered steps (decided) | Today's job (`.github/workflows/ci.yml`) plus the new steps                 | A pull request that breaks a check fails | Slow feedback as suites grow. Mitigation: move to B when the job time hurts. |
| B. Parallel jobs                    | `check`, `build` (uploads `dist`), then test, package, bundle and docs jobs | The same                                 | Artifact passing and repeated installs. Not needed at today's size.          |

Step order for A: install, Playwright (cached), `build`, `check`, `check:terms`, `check:package`,
`check:parity`, `check:tree-shaking`, `docs:check:agents`, `test:coverage`, `test`. Build stays first because the later steps read `dist` and the docs output. The
steps after `build` run even when an earlier check fails, so one run shows all failures (`03-testing.md`,
"CI mapping"). The benchmark of `03-testing.md`, `report:size`, `compare:size` and `compare:check` are not CI steps.

## Contributor-doc impact

List only. [04-documentation.md](./04-documentation.md) owns the rewrite.

| Document                                                                           | What becomes wrong                                                                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/structure.md`                                                                | All sections: workspace layout, package relationships (peer dependency), source organization, import paths                                 |
| `docs/commands.md`                                                                 | Build (ESM only), test paths, package validation (`attw` profile, `check:tree-shaking`, `test:package`), the two size reports, `postbuild` |
| `docs/testing.md`                                                                  | File placement, runners (core in Node), type contracts (`*.test-d.ts`), the folders that the check scripts scan                            |
| `docs/code-style.md`                                                               | "File Organization" (the `form/`, `types/`, `utils/` tree) and the naming examples (`FormApi`, `~mount`)                                   |
| `docs/typescript.md`                                                               | Rules written for classes (`#private`, `~` methods)                                                                                        |
| `docs/form-core-behaviors.md`, `docs/checks-and-issues.md`                         | They describe 0.x methods                                                                                                                  |
| `AGENTS.md` "Project context"                                                      | The guide list                                                                                                                             |
| `AGENTS.md` "Commands"                                                             | The single-test path (`src/tests/file.spec.ts`)                                                                                            |
| `AGENTS.md` "Validation"                                                           | The required commands: `check:all` gains the tree-shaking check, and docs changes need `docs:check:agents`                                 |
| `readme.md`, `packages/*/readme.md`, `apps/docs/README.md`, `examples/*/readme.md` | Entry points, install lines (peer dependency, ESM only), examples and playground description                                               |

## Check against the coding standards

- YAGNI: no release workflow, no parallel CI, no custom lint plugin, no prerelease mode, `"docs"` in `files`
  only when stage B exists.
- KISS: one pack configuration for core, a hand-written `exports` map, built-in lint rules, one format.
- DIE: one example kit, one parity package, one base `vite.config.ts`, path helpers in one internal module.
- Delete aggressively: CJS output, `typesVersions`, `remeda`, `type-fest`, `postbuild`, `explorations/`.
- Added complexity and its reason: `tests/package/` (the direction's "entry points share modules" check),
  `tests/bundle/` (the tree-shaking check and the size report), the `#core*` aliases (presets with no
  private access), three private workspaces (`examples/kit` for 04, `adapter-parity` for 03,
  `examples/comparison` for 07).

## Deviations and decisions

Every item is decided or is a verification task of a work package. `06-roadmap.md` records who decided.

1. **Adapter entry point.** Decided. `@oxform/core/adapter` is the fourth core entry point (owner decision 8,
   see [Adapter-facing exports](#adapter-facing-exports)). The tree, the manifest and the lint table above
   include it.
2. **`postbuild`.** Today the root `postbuild` formats the whole repository after each build
   (`package.json:16`). It conflicts with "limit formatting to files changed" (`AGENTS.md` "Validation").
   This file deletes it. `check:format` in CI covers the need.
3. **Preset rule.** The direction says a test enforces "no private access". Owner ruling: the barrel-only
   imports and the lint override of this file are the early gate, and the runtime `tests/package/` spec of
   `03-testing.md` is the direction's test.
4. **Split of `api.ts` and of main types.** The direction names the spike modules. This file adds
   `main/types.ts`, `main/path-types.ts` and `main/path.ts`, because the spike's `api.ts` is one types file
   for all areas and `get` and `idPart` sit in a behaviors module there.
5. **Test conventions.** Co-located unit specs, `tests/` and `*.test-d.ts` differ from today's `src/tests/`
   (`docs/testing.md` "File Placement"). Nothing in today's scripts makes the old layout better: both check
   scripts scan recursively for `*.spec.ts(x)` (`check-test-structure.ts:11,24`). They need the `tests` root.
6. **Requests accepted.** From 03: a private parity workspace (`packages/adapter-parity`) and `tests/bundle/`
   in core. From 04: in-package `docs/` folders in two stages, `docs:check:agents`, and a shared example kit.
   From 07: the private workspace `examples/comparison`, `compare:size` and `compare:check`.
7. **Kit and rendering code.** Closed. Rendering code lives in the example apps, and the kit holds the
   framework-neutral part. `04-documentation.md`, section 8, has the same split.
8. **In-package docs folder name.** Closed. The folder is `docs/` (`04-documentation.md`, section 7.4).
9. **Peer dependencies.** Decided (D35). `react-dom` is no longer a peer of `@oxform/react`: the adapter
   source imports only `react` (`X/spike/src/react/create-parts.tsx`; only `parts.spec.tsx` imports
   `react-dom`). The Solid peer range stays a union of Solid 1 and Solid 2, as today
   (`packages/solid/package.json:76`), because one package serves both runtimes.
10. **Size budgets.** Decided. No budget exists (owner decision 12). `check:size` of the earlier text is now
    `check:tree-shaking` (a gate, with no size number) and `report:size` (a report).
11. **Verification tasks.** No build was run for this plan. Each claim is verified by a work package of
    phase 1, with the fallback named in its section: shared chunks for several entries (P1-03), the kept pure
    annotation (P1-04), `allowTypeImports` in `patterns` (P1-05), and the versions that Changesets plans
    (P1-08).

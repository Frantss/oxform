# Monorepo Structure

See [Commands Reference](./commands.md) for navigation commands.

## Workspace Layout

```
/
├── apps/
│   └── docs/            # @oxform/docs - public documentation site
├── packages/
│   ├── core/            # @oxform/core - the main APIs, the behaviors and the presets
│   ├── react/           # @oxform/react - the React adapter
│   ├── solid/           # @oxform/solid - published Solid 1 and /v2 entry points
│   ├── solid-v1/        # private Solid 1 adapter
│   ├── solid-v2/        # private Solid 2 adapter
│   └── adapter-parity/  # private parity scenarios that every adapter must pass
├── examples/
│   ├── kit/             # private framework-neutral example code and its specs
│   ├── react/           # React example app and browser specs
│   ├── solid/           # Solid 1 example app and browser specs
│   └── solid-v2/        # Solid 2 example app and browser specs
├── docs/                # contributor guides
├── plans/               # design records of the extension API rebuild
├── reports/             # findings log
├── scripts/             # root scripts: check-terms.ts, type-coverage.ts
├── pnpm-workspace.yaml  # workspace globs and shared dependency catalog
└── package.json         # root scripts
```

## Package Relationships

- `@oxform/core` has no internal dependency.
- `@oxform/react` and `@oxform/solid` list `@oxform/core` as a peer dependency (`workspace:^`). An
  adapter imports core only through its public entry points and does not re-export it.
- `@oxform/solid-v1` and `@oxform/solid-v2` are private workspaces with isolated Solid runtimes,
  compilers, types and tests. `@oxform/solid` assembles their builds: Solid 1 in `dist/`, Solid 2 in
  `dist/v2/`. It has no implementation `src/`.
- `@oxform/adapter-parity` and `example-oxform-kit` are private. They hold shared scenarios and shared
  example code. They import no adapter or UI runtime.
- Packages are ESM only.

## Entry Points

| Entry point              | Entry file                       | Holds                                                                                |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------ |
| `@oxform/core`           | `packages/core/export/index.ts`  | The main APIs: `defineForm`, `defineExtension`, `slots`, `on`, `createEffect`, paths |
| `@oxform/core/behaviors` | `export/behaviors.ts`            | The built-in extensions and the slot groups                                          |
| `@oxform/core/presets`   | `export/presets.ts`              | The presets, such as `standard`                                                      |
| `@oxform/core/adapter`   | `export/adapter.ts`              | The contract for adapter authors. See [Adapter authors](./adapter-authors.md)        |
| `@oxform/react`          | `packages/react/export/index.ts` | `createParts`, `usePart` and their types                                             |
| `@oxform/solid`, `/v2`   | `packages/solid/export/`         | The same names as the React adapter, for Solid 1 and Solid 2                         |

An `export/` file lists the public names. Add a name to an entry file, to its type test inventory
(`tests/types/inventory.json`) and to its reference page in the same change. `pnpm run check:parity` fails
when the built adapters do not export the same names.

## Source Organization

**Core (`packages/core/src/`)** has four areas, with a fixed direction of imports:

| Area         | Holds                                                                         | May import                 |
| ------------ | ----------------------------------------------------------------------------- | -------------------------- |
| `internal/`  | Path helpers shared by the other areas                                        | Itself only                |
| `main/`      | `defineForm`, the context, effects, scopes, paths and the shared types        | `internal/`                |
| `behaviors/` | One module per built-in extension (`values.ts`, `check.ts`, `submit.ts`, ...) | `internal/`, `main/`       |
| `presets/`   | Presets, which compose behaviors through the `#core*` barrels only            | `#core`, `#core/behaviors` |

Each runtime module has a sibling `*.spec.ts`. The lint overrides in the root `vite.config.ts`
(`restrictImports`) enforce these directions, so `pnpm run check:rules` fails on a wrong import.
`packages/core/tests/` holds the flow specs, `tests/types/` holds the type tests, and `scripts/` holds the
type-coverage check.

**React (`packages/react/src/`):** `create-parts.ts` and `use-part.ts` build the parts of a form, `hooks.ts`
and `context.ts` hold the hooks and the form context, `part-view.ts` and `types.ts` hold the rest. Specs sit
beside each module. `tests/` holds the parity driver and the server specs.

**Solid (`packages/solid-v1/src/`, `packages/solid-v2/src/`):** the same shape as React, one workspace per
Solid runtime. `packages/solid/export/` exposes the two public barrels.

**Docs app (`apps/docs/`):** `content/docs/` holds the MDX pages and each section's `meta.json`,
`source.config.ts` configures Fumadocs and Twoslash, `src/routes/` holds the TanStack Start routes, and
`scripts/check-agents.ts` is the agent check. See the [docs app readme](../apps/docs/README.md) for the
authoring rules.

## Import Paths

- Core uses `#main/*`, `#behaviors/*`, `#presets/*` and `#internal/*` (all `#*` to `./src/*.ts`), and the
  barrels `#core`, `#core/behaviors`, `#core/presets` and `#core/adapter` (to `./export/*.ts`).
- A preset and a flow spec import core only through the barrels, as a consumer does.
- React, Solid 1 and Solid 2 map `#*` to `./src/*.ts`. The docs app uses `@/` for `src/`.
- Use these aliases instead of paths such as `../../`.

## Dependency Management

- Shared versions are in `pnpm-workspace.yaml` under `catalogs.oxform`.
- Internal packages reference each other with `workspace:*` (`workspace:^` for a peer dependency).
- Run `pnpm install` from the root to install all workspaces.

# Monorepo Structure

See [Commands Reference](./commands.md) for navigation commands.

## Workspace Layout

```
/
├── apps/
│   └── docs/          # @oxform/docs - Public documentation website
├── packages/
│   ├── core/          # @oxform/core - Framework-agnostic form library
│   ├── react/         # @oxform/react - React hooks and components
│   ├── solid/         # @oxform/solid - Published Solid 1 and /v2 entries
│   ├── solid-v1/      # Private Solid 1 implementation
│   └── solid-v2/      # Private Solid 2 implementation
├── examples/
│   ├── react/         # React demos and browser tests
│   ├── solid/         # Solid 1 demo and browser tests
│   └── solid-v2/      # Solid 2 demo and browser tests
├── docs/              # Contributor guides
├── pnpm-workspace.yaml # Workspace globs and shared dependency catalog
└── package.json       # Root workspace configuration
```

## Package Relationships

- `@oxform/core` - Standalone, no internal dependencies
- `@oxform/react` - Depends on `@oxform/core` (via `workspace:*`)
- `@oxform/solid` - Depends on `@oxform/core` (via `workspace:*`), with a Solid peer dependency
- `@oxform/solid-v1` and `@oxform/solid-v2` - Private workspaces with isolated
  Solid runtimes, compilers, types, and tests. Their builds are assembled into
  the published `@oxform/solid` package; consumers resolve no private workspaces.

## Navigating Packages

- Use `cd packages/<name>` to enter a package directory
- Package names are in each `package.json` (e.g., `@oxform/core`, `@oxform/react`)
- Core, React, and the private Solid adapters have `src/`, `export/`, and test files.
  Builds generate `dist/`. The published Solid package assembles the private
  adapters and has no implementation `src/` directory.

## Source Organization

**Core (`packages/core/src/`):**

- `form/` - Main API and core modules (`form-api.ts`, `field-api.ts`, `form-core*.ts`)
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `tests/` - Test suites

**React (`packages/react/src/`):**

- `use-form.ts`, `use-field.ts` - React hooks
- `field.tsx`, `array-field.tsx` - React components
- `tests/` - React-specific tests

**Solid implementations (`packages/solid-v1/src/`, `packages/solid-v2/src/`):**

- `create-*.ts` - Owned reactive primitives and core bindings
- `field.ts`, `array-field.ts`, `subscribe.ts` - Render-function components
- `internal/` - Store subscriptions, field rebinding, and reactive property selection
- `tests/` - Browser behavior and public type contracts
- `server-tests/` - Server-rendering behavior

`packages/solid/export/` exposes the two public barrels. Its build copies the
Solid 1 output to `dist/` and Solid 2 output to `dist/v2/`.
`examples/solid` and `examples/solid-v2` provide runnable demos.

**Public docs (`apps/docs/`):**

- `content/docs/` - MDX guides, recipes, and API references for React, Solid, and core
- `content/docs/**/meta.json` - Sidebar ordering and section metadata
- `source.config.ts` - Fumadocs collections, Twoslash snippets, and generated type tables
- `src/routes/` - TanStack Start routes, including documentation and search
- `src/lib/source.ts` - Documentation source with the `/docs` base URL
- `src/routeTree.gen.ts` - Generated route tree

See the [docs app readme](../apps/docs/README.md) for editing and validation commands.

## Import Paths

Source packages use `#*` aliases pointing to `./src/*.ts`:

- `import { FormApi } from '#form/form-api'` resolves to `src/form/form-api.ts`
- Use absolute imports with `#` instead of relative paths like `../../`
- React adds explicit aliases for TSX modules. The published Solid package's
  `#*` alias points to `export/`; the docs app uses `@/` for `src/`.

## Dependency Management

- Shared dependency versions are listed in `pnpm-workspace.yaml` under `catalogs.oxform`
- Internal packages reference each other with `workspace:*`
- Run `pnpm install` from root to install all dependencies

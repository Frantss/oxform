# Monorepo Structure

See [Commands Reference](./commands.md) for navigation commands.

## Workspace Layout

```
/
├── packages/
│   ├── core/          # oxform-core - Framework-agnostic form library
│   ├── react/         # oxform-react - React hooks and components
│   └── solid/         # oxform-solid - Solid primitives and components
├── docs/              # This documentation
└── package.json       # Root workspace configuration
```

## Package Relationships

- `oxform-core` - Standalone, no internal dependencies
- `oxform-react` - Depends on `oxform-core` (via `workspace:*`)
- `oxform-solid` - Depends on `oxform-core` (via `workspace:*`), with a Solid peer dependency

## Navigating Packages

- Use `cd packages/<name>` to enter a package directory
- Package names are in each `package.json` (e.g., `oxform-core`, `oxform-react`)
- Each package has its own `src/`, `dist/`, `export/` and test files

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

**Solid (`packages/solid/src/`):**

- `create-*.ts` - Owned reactive primitives and core bindings
- `field.ts`, `array-field.ts`, `subscribe.ts` - Render-function components
- `internal/` - Store subscriptions, field rebinding, and reactive property selection
- `tests/` - Browser behavior and public type contracts
- `server-tests/` - Server-rendering behavior

`examples/solid` provides the runnable Solid form demo.

## Import Paths

Each package uses `#*` aliases pointing to `./src/*.ts`:

- `import { FormApi } from '#form/form-api'` resolves to `src/form/form-api.ts`
- Use absolute imports with `#` instead of relative paths like `../../`

## Dependency Management

- Shared dependency versions are listed in `pnpm-workspace.yaml` under `catalogs.oxform`
- Internal packages reference each other with `workspace:*`
- Run `pnpm install` from root to install all dependencies

# Code Style

## Formatting

**Always run formatting before finishing a task:**

```bash
pnpm run fix:format docs/commands.md packages/react/readme.md
```

Pass only files changed for the task. With no paths, `fix:format` formats the
whole repository. `fix:all` also runs lint fixes across the repository; inspect
the diff and preserve unrelated work.

## Naming Conventions

| Type             | Pattern                    | Example                     |
| ---------------- | -------------------------- | --------------------------- |
| Classes          | PascalCase                 | `FormApi`, `FieldApi`       |
| Functions        | camelCase                  | `useField`, `createForm`    |
| Types/Interfaces | PascalCase                 | `FormOptions`, `FieldState` |
| Constants        | UPPER_SNAKE                | `MAX_RETRIES`               |
| Private fields   | `#` prefix                 | `#subscribers`              |
| Internal methods | `~` prefix                 | `~mount`, `~update`         |
| Boolean props    | `is`/`has`/`should` prefix | `isDisabled`, `hasError`    |

## File Organization

```
export/
└── index.ts           # Public exports only
src/
├── form/              # Core classes and factories (core package)
├── types/             # Shared types
├── utils/             # Pure utilities
│   └── tests/         # Utility tests
└── tests/             # Test files (*.spec.ts or *.spec.tsx)
```

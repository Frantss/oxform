# Code Style

## Formatting

**Always run formatting before finishing a task:**

```bash
bun run fix:format      # Format only
bun run fix:all         # Format + lint + auto-fix
```

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
src/
├── index.ts           # Public exports only
├── form-api.ts        # Core classes
├── field-api.ts
├── types.ts           # Shared types
├── utils/             # Pure utilities
│   └── testing/       # Test-only helpers
└── tests/             # Test files (*.spec.ts)
```

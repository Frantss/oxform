# Oxform Development Guide

TypeScript monorepo for Oxform, a framework-agnostic form library using pnpm workspaces.

**Package Manager**: pnpm

## Quick Reference

```bash
# Build
pnpm run build
pnpm run build:dev        # watch mode

# Type check
pnpm run check:types

# Run a single test
cd packages/<name> && pnpm run test run src/tests/file.spec.ts

# Lint/Format (Oxlint/Oxfmt, not ESLint/Prettier)
pnpm run check:all        # lint + format + types + package
pnpm run fix:all          # auto-fix all
```

## Detailed Guides

- [Structure](./docs/structure.md) - Monorepo layout and package organization
- [Commands Reference](./docs/commands.md) - All available commands and usage
- [Checks and Issues Reference](./docs/checks-and-issues.md) - Check and issue validation behavior
- [Testing Patterns](./docs/testing.md) - Vitest + Playwright browser testing
- [TypeScript Conventions](./docs/typescript.md) - Type patterns and API design
- [Code Style](./docs/code-style.md) - Imports, formatting, namings

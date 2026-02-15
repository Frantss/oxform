# Commands Reference

## Dev Environment

- Use `bun --filter <package_name> build` to build a specific package instead of all packages.
- Use `cd packages/<name>` to navigate to a package and run commands locally.
- Check the `name` field inside each package's `package.json` to confirm the right name—skip the top-level one.

## Build Commands

- Run `bun run build` to compile all packages for production.
- Use `bun run build:dev` for watch mode—rebuilds automatically on file changes.
- The build uses tsdown to output both ESM and CJS formats.

## Testing Commands

- Run `bun run test` to execute tests across all packages.
- From inside a package directory, run `bun vitest run` to test just that package.
- Run a single test file with `bun vitest run src/tests/field/change.spec.ts`.
- Filter tests by name with `bun vitest run -t "<test name>"`.
- Tests run in a headless Playwright browser (chromium) via Vitest browser mode.

## Linting & Formatting Commands

- Run `bun run fix:all` before committing—this fixes both lint and format issues automatically.
- Check lint rules with `bun run check:rules` (uses oxlint).
- Check formatting with `bun run check:format` (uses oxfmt).
- Fix lint issues: `bun run fix:rules`.
- Fix formatting: `bun run fix:format`.

## Type Checking Commands

- Run `bun run check:types` to type-check all packages.
- Always ensure types pass before committing.

## Package Validation

- Run `bun run check:package` to validate package exports with publint.
- Run `bun run check:all` to run lint, format, types, and package checks together.

## Release Commands

- Use `bun run version:add` to add a changeset (interactive prompt).
- Run `bun run version:bump` to bump versions from changesets.
- Run `bun run publish` to publish to npm (runs pre-checks automatically).

## Workspace Commands

- Most root commands use `bun --filter '*'` to run across all workspace packages.
- Target a specific package with `bun --filter 'oxform-core' <command>`.
- Install dependencies for a specific package with `bun install --filter <package_name>`.

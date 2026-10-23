# Commands Reference

## Dev Environment

- Use `pnpm --filter <package_name> run build` to build a specific package instead of all packages.
- Use `cd packages/<name>` to navigate to a package and run commands locally.
- Check the `name` field inside each package's `package.json` to confirm the right name—skip the top-level one.

## Build Commands

- Run `pnpm run build` to compile all packages for production.
- Use `pnpm run build:dev` for watch mode—rebuilds automatically on file changes.
- Library packages build through `vp pack`, which uses tsdown under Vite+.

## Testing Commands

- Run `pnpm run test` to execute tests across all packages.
- From inside a package directory, run `vp test` to test just that package.
- Run a single test file with `vp test run src/tests/field/change.spec.ts`.
- Filter tests by name with `vp test -t "<test name>"`.
- Tests run in a headless Playwright browser (chromium) via Vite+ test mode.
- `pnpm --dir packages/solid run test:ssr` runs server-rendering tests in Node through `vite.ssr.config.ts`.
  The root test command runs both Solid suites.
- Run the Solid example with `pnpm --dir examples/solid run dev`.
- Run the Solid 2 example with `pnpm --dir examples/solid-v2 run dev`.
- Test either private adapter directly with
  `pnpm --dir packages/solid-v1 run test` or
  `pnpm --dir packages/solid-v2 run test`. The published package's test scripts
  run both adapters; Solid 2 browser tests cover desktop and mobile viewports.

## Linting & Formatting Commands

- Run `pnpm run fix:all` before committing—this fixes both lint and format issues automatically.
- Check lint rules with `pnpm run check:rules` (uses oxlint).
- Check formatting with `pnpm run check:format` (uses oxfmt).
- Fix lint issues: `pnpm run fix:rules`.
- Fix formatting: `pnpm run fix:format`.

## Type Checking Commands

- Run `pnpm run check:types` to type-check all packages.
- Package type checks run through `vp exec tsc --noEmit`.
- Always ensure types pass before committing.

## Package Validation

- Run `pnpm run check:package` to validate package exports with publint.
- Run `pnpm --dir packages/solid run check:consumers` after building to verify
  the packed Solid 1 and Solid 2 entries in isolated applications, including
  ESM, CJS, and inferred types. This uses the local pnpm dependency cache.
- Run `pnpm run check:all` to run lint, format, types, and package checks together.

## Release Commands

- Use `pnpm run version:add` to add a changeset (interactive prompt).
- Run `pnpm run version:bump` to bump versions from changesets.
- Run `pnpm run publish` to publish to npm (runs pre-checks automatically).

## Workspace Commands

- Root scripts use `vp run` for workspace tasks; use `pnpm --filter <package_name> run <command>` to target a package.
- Target a specific package with `pnpm --filter '@oxform/core' run <command>`.
- Add a dependency to a specific package with `pnpm --filter <package_name> add <dependency>`.

# Commands Reference

## Dev Environment

Run commands from the repository root unless noted otherwise. Use the pnpm
version in `package.json` (`12.15.0`). Node must satisfy
`^22.18.0 || ^24.11.0 || >=26.0.0`.

```bash
pnpm install
```

- Use `pnpm --filter <package_name> run build` to build a specific package instead of all packages.
- Use `cd packages/<name>` to navigate to a package and run commands locally.
- Check the `name` field inside the target workspace's `package.json` to confirm its package name.

## Build Commands

- Run `pnpm run build` to build workspace libraries, examples, and the docs app.
- Use `pnpm run build:dev` to pass `--watch` to workspace build tasks.
- Library packages build through `vp pack`, which uses tsdown under Vite+.
- The published Solid package builds both private adapters and assembles their output.

## Docs and Examples

```bash
pnpm run docs:dev                           # Docs at http://localhost:3002
pnpm run docs:build                         # Production docs build
pnpm run docs:check                         # Generate MDX metadata and check types
pnpm --dir apps/docs run playground:build    # Rebuild embedded previews after editing examples
pnpm --dir examples/react run dev
pnpm --dir examples/solid run dev
pnpm --dir examples/solid-v2 run dev
```

Public documentation lives in `apps/docs/content/docs`; contributor guides
live in `docs/`. The docs server provides the playground at `/playground`.
See the [docs app readme](../apps/docs/README.md) for the
content pipeline and production server configuration.

## Testing Commands

- Run `pnpm run test` to execute core, the parity fixtures, React, both Solid adapters, and the example suites.
- From inside an implementation package, run `pnpm run test` for its suite.
- Run one core file with `pnpm --dir packages/core run test run src/main/form.spec.ts`.
- Filter core tests by name with `pnpm --dir packages/core run test -t "<test name>"`.
- Browser tests run in headless Chromium through the Playwright provider.
- `pnpm --dir packages/react run test:ssr` runs the React server-rendering
  suite in Node, with `vite.ssr.config.ts`. The React `test` runs it after the
  browser suite.
- Test either private Solid adapter directly with
  `pnpm --dir packages/solid-v1 run test` or
  `pnpm --dir packages/solid-v2 run test`. The published package's `test` runs
  both. Solid 2 browser tests cover desktop and mobile viewports.

See [Testing Patterns](./testing.md) for file placement, assertions, and type tests.

## Linting & Formatting Commands

- Check lint rules with `pnpm run check:rules` (uses oxlint).
- Check formatting with `pnpm run check:format` (uses oxfmt).
- Fix lint issues: `pnpm run fix:rules`.
- Format changed files: `pnpm run fix:format docs/commands.md docs/testing.md`.
- `pnpm run fix:all` applies lint and format fixes across the repository.
  Use it only when that scope is intended; inspect the diff afterward.

## Type Checking Commands

- Run `pnpm run check:types` to type-check all packages.
- Package type checks run through `vp exec tsc --noEmit`.
- Always ensure types pass before committing.

## Package Validation

- Build before running `pnpm run check:package`; it validates generated
  package exports with `publint --strict` and `attw --pack --no-emoji`.
- Core and React package validation also type-checks the type tests against
  the built `dist` (`check:types:dist`) and fails when an export has no type
  test (`check:type-coverage`).
- `pnpm --dir packages/adapter-parity run check:parity` fails when the adapters
  do not export the same names. It is not in `check:all` until the Solid
  adapters catch up.
- Run `pnpm run check:all` to run lint, format, types, and package checks together.

## Before Finishing

For code or configuration changes, run `pnpm run build`, then
`pnpm run check:all` and `pnpm run test`. Format only changed files before
finishing. Browser-facing changes also require desktop/mobile flow checks and
browser console inspection.

Documentation-only changes need formatting and link checks. Build or run the
docs app when the change affects MDX compilation, generated signatures, code
snippets, or rendered behavior. Report blocked or skipped checks explicitly.

## Release Commands

- Use `pnpm run version:add` to add a changeset (interactive prompt).
- Run `pnpm run version:bump` to bump versions from changesets.
- Run `pnpm run publish` to publish to npm (runs pre-checks automatically).

## Workspace Commands

- Root scripts use `vp run` for workspace tasks; use `pnpm --filter <package_name> run <command>` to target a package.
- Target a specific package with `pnpm --filter '@oxform/core' run <command>`.
- Add a dependency to a specific package with `pnpm --filter <package_name> add <dependency>`.

# Commands Reference

Run commands from the repository root unless noted otherwise. Use the pnpm version in `package.json`
(`12.15.0`). Node must satisfy `^22.18.0 || ^24.11.0 || >=26.0.0`. Root scripts use Vite+ (`vp`).

```bash
pnpm install
```

- Use `pnpm --filter <package_name> run <script>` or `pnpm --dir <path> run <script>` to run a script in one
  workspace. The `name` field of its `package.json` gives the package name.

## Build

- `pnpm run build` builds the libraries, the examples and the docs app (`vp run -r build`). Build before
  `check:package`, `check:parity` and `docs:check:agents`: they read `dist/`.
- `pnpm run build:dev` passes `--watch` to the build tasks.
- Libraries build with `vp pack` (tsdown). Output is ESM only. `@oxform/solid` builds both private adapters,
  then assembles them (`scripts/assemble.ts`).

## Docs and Examples

```bash
pnpm run docs:dev                        # docs at http://localhost:3002
pnpm run docs:build                      # production docs build
pnpm run docs:start                      # serve the build, on PORT (default 3000)
pnpm run docs:check                      # generate MDX metadata and type-check the app
pnpm run docs:check:agents               # agent checks, after docs:build
pnpm --dir apps/docs run playground:build  # rebuild the embedded previews after editing an example
pnpm --dir examples/react run dev
pnpm --dir examples/solid run dev
pnpm --dir examples/solid-v2 run dev
```

- The docs dev server listens on port 3002 (`apps/docs/vite.config.ts`). Pass `-- --port <port>` to change
  it. To serve the build on another port, run `PORT=<port> pnpm run docs:start`.
- `docs:check:agents` checks `llms.txt`, `llms-full.txt`, the Markdown outputs, the page templates, the code
  fences, the term list, the reference inventory, the example ids and the heading ids. Each failure prints
  `file[:line]: [rule] message`. After you add a heading, run
  `pnpm --dir apps/docs run check:agents --record-heading-ids` and commit
  `apps/docs/scripts/heading-ids.json`.
- Public pages live in `apps/docs/content/docs`. See the [docs app readme](../apps/docs/README.md) for the
  authoring rules.

## Tests

- `pnpm run test` runs core, the parity fixtures, React, both Solid adapters and the example suites.
- `pnpm run test:coverage` reports the coverage of the core `unit` project. No threshold fails a run.
- Run one core file: `pnpm --dir packages/core run test run src/behaviors/check.spec.ts`.
- Filter core cases by name: `pnpm --dir packages/core run test -t "<case title>"`.
- `pnpm --dir packages/core run test:dev` (and the same script in an adapter) runs in watch mode.
- Core specs run in Node. Adapter and example specs run in headless Chromium through Playwright.
- `pnpm --dir packages/react run test:ssr` runs the React server specs in Node. The React `test` runs it
  after the browser suite. `@oxform/solid` has the same script for both Solid adapters.
- Test one Solid adapter with `pnpm --dir packages/solid-v1 run test` or
  `pnpm --dir packages/solid-v2 run test`. `solid-v2` also runs a mobile viewport.

See [Testing Patterns](./testing.md) for file placement, assertions and type tests.

## Lint, Format and Types

- `pnpm run check:rules` lints with Oxlint, type-aware. `pnpm run fix:rules` applies fixes.
- `pnpm run check:format` checks formatting with Oxfmt. `pnpm run fix:format <files>` formats the files that
  you pass. With no path it formats the whole repository.
- `pnpm run check:types` type-checks every workspace. A package runs `tsc --noEmit` on its source and on its
  type tests (`tests/types`).
- `pnpm run check` runs the three checks above.
- `pnpm run fix:all` fixes lint and format across the repository. Use it only when that scope is intended,
  and inspect the diff afterward.
- `pnpm run check:terms` checks the glossary terms in `packages/*/src`, `packages/*/tests`, `examples/*`,
  `docs/*.md` and the readmes. It uses the term list of `docs:check:agents`.

## Package Validation

- `pnpm run check:package` needs a build. For core, React and Solid it runs `publint --strict`,
  `attw --pack --no-emoji --profile esm-only`, `check:types:dist` and `check:type-coverage`.
- `check:types:dist` type-checks the type tests against the built `dist`, through the package `exports`.
  `check:type-coverage` fails when an export has no type test, or is missing from
  `tests/types/inventory.json`.
- `pnpm run check:parity` needs a build. It fails when the built adapters do not export the same names.
- `pnpm run check:all` runs `check`, `check:terms`, `check:package` and `check:parity`.

## Before Finishing

For code or configuration changes, run `pnpm run build`, `pnpm run check:all` and `pnpm run test`. For a
change to the docs content, also run `pnpm run docs:build` and `pnpm run docs:check:agents`. Format only the
files that you changed. Browser-facing changes also need desktop and mobile flow checks and a look at the
browser console. Report blocked or skipped checks.

## Release

- `pnpm run version:add` adds a changeset (interactive).
- `pnpm run version:bump` applies the changesets to the package versions and changelogs.
- `pnpm run publish` publishes to npm. `pnpm run prepublish` runs first: `build`, `check:all` and
  `docs:check:agents`. `@oxform/core`, `@oxform/react` and `@oxform/solid` are versioned together
  (`.changeset/config.json`).

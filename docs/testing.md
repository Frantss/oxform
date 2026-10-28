# Testing Patterns

See [Commands Reference](./commands.md) for test commands.

## File Placement

- Use `*.spec.ts` for non-JSX tests and `*.spec.tsx` for JSX tests.
- Core behavior tests live in `packages/core/src/tests/`, grouped by API or
  operation. Utility tests live in `packages/core/src/utils/tests/`.
- React and Solid browser tests live in each implementation package's `src/tests/`.
- Solid server-rendering tests live in `src/server-tests/`.
- Put example tests alongside the example code, following that workspace's pattern.

The published `packages/solid` package delegates tests to `solid-v1` and
`solid-v2`; add adapter tests to the matching private workspace.

## Runners

Import assertions and test functions from `vite-plus/test`. The root
`vite.config.ts` configures the Playwright provider with headless Chromium
at 1280 × 720. Solid 2 adds a 390 × 844 browser instance. Solid SSR configs
disable browser mode and use Node.

React tests use `render` from `vitest-browser-react`. Browser interactions
use `userEvent` and page locators from `vite-plus/test/browser`. Await renders
and interactions, and use `expect.element` for DOM assertions that may need
to retry.

See `packages/react/src/tests/use-field.spec.tsx` and the Solid adapters'
`src/tests/` for existing setup and cleanup patterns.

## Cases and Assertions

- Keep each file focused on one API or behavior. Use a `setup()` helper for
  repeated initialization and separate success, failure, and edge cases.
- Give each case a concrete behavior description. Group related cases with
  `describe()` when useful.
- Assert observable values, issues, status, DOM output, and callbacks.
- Clean up subscriptions, effects, and Solid owners created by a test.
- Mock only when needed. Existing browser mocks use
  `vi.mock(module, { spy: true })` with `vi.mocked()`.

Core package validation scans `src/**/*.spec.ts` and `*.spec.tsx`. Every
`describe`, `it`, and `test` title must be unique across the core package.
Each case needs a runtime assertion, `expectTypeOf`, or `@ts-expect-error`.
A case may have one runtime `expect()` unless it includes a justified exception:

```ts
// oxform-test-structure: allow-multiple-assertions -- these assertions describe one status transition
```

Prefer splitting independent assertions into separate cases. The source of
these rules is `packages/core/scripts/check-test-duplicates.ts` and
`packages/core/scripts/check-test-structure.ts`.

## Type Contracts

Use `expectTypeOf` for inferred values, paths, callback arguments, and issue
levels. Use `@ts-expect-error` for rejected paths or values. Existing
`create-use-api-type-tests.spec.ts` and `*.spec.tsx` suites cover core and
adapter creation APIs. Run `pnpm run check:types` to check TypeScript contracts;
runtime tests alone do not verify them.

## Running Tests

```bash
pnpm run test
pnpm --dir packages/core run test run src/tests/form-core-field/change.spec.ts
pnpm --dir packages/react run test run src/tests/use-field.spec.tsx
pnpm --dir packages/solid run test:ssr
```

Vite+ runs tests once by default. Use an implementation package's
`pnpm run test:dev` for watch mode.

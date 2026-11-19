# Testing Patterns

See [Commands Reference](./commands.md) for all commands.

## Setup and `using`

Every spec builds its subject through one `setup` function and holds it with `using`. The subject is
what the case tests: a form, a context, a rendered view, or the input of a pure function.

- Each spec file declares one `const setup = (...) => ...` after its imports.
- `setup` returns a disposable object. `[Symbol.dispose]` releases what `setup` made: it destroys a
  context, or unmounts a view and removes its container. When nothing needs to be released,
  `[Symbol.dispose]` is an empty function.
- Each case starts with `using subject = setup(...)`. The subject is released when the case ends, also
  when an assertion fails, so no case needs `afterEach`.
- `setup` takes what a case changes as parameters, and makes new values at each call. A case cannot
  see the writes of another case.
- When the teardown is async, `setup` returns `[Symbol.asyncDispose]` and the case uses
  `await using`.
- `setup` returns a new object. It never assigns `[Symbol.dispose]` onto a shared object, such as a
  module constant or the `page` of `vite-plus/test/browser`.

A stateful subject (`packages/core/src/main/context.spec.ts`):

```ts
const setup = <Options extends object>(options: Options = {} as Options) => {
  const controls = createContext(options);

  return Object.assign(controls, { [Symbol.dispose]: () => controls.destroy() });
};

it('start in the store', () => {
  using controls = setup();
  controls.extensionContext('counter', { count: 1 });

  expect(controls.store.state).toEqual({ count: 1 });
});
```

The input of a pure function (`packages/core/src/main/path.spec.ts`):

```ts
const setup = <const Input extends object>(input: Input) => ({
  ...input,
  values: { address: { city: 'Lisbon' }, tags: ['a', 'b'] },
  [Symbol.dispose]() {},
});

it('reads a path from plain state', () => {
  using subject = setup({ at: 'address.city' });

  expect(get(subject.values, subject.at)).toBe('Lisbon');
});

it('writes a dot as a hyphen', () => {
  using subject = setup({ path: 'tags.0.name' });

  expect(idPart(subject.path)).toBe('tags-0-name');
});
```

A rendered Solid view (`examples/solid/tests/setup.tsx`). React unmounts asynchronously, so
`examples/react/tests/setup.tsx` returns `[Symbol.asyncDispose]: () => screen.unmount()` and each case uses
`await using screen = await setup(<App />)`.

```ts
const setup = (view: () => JSX.Element) => {
  const container = document.body.appendChild(document.createElement('div'));
  container.dataset.testid = `view-${++views}`;
  const dispose = render(view, container);

  return Object.assign(page.getByTestId(container.dataset.testid), {
    [Symbol.dispose]: () => {
      dispose();
      container.remove();
    },
  });
};
```

Shared fixtures that several core specs use go in `packages/core/tests/helpers.ts`. A spec's `setup`
uses them. Type tests (`*.test-d.ts`) run no code, so they have no `setup`.

## File Placement

| Files                                                         | What they test                                                    | Runner                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| `packages/core/src/**/*.spec.ts`                              | One module each, beside it (`paths.ts` and `paths.spec.ts`)       | `unit` project, Node, no `window` |
| `packages/core/tests/*.spec.ts`                               | Flows across modules, imported only through the `#core*` barrels  | `integration` project, Node       |
| `packages/core/tests/types/*.test-d.ts`                       | The public types, through the package names                       | `tsc`, no runtime                 |
| `packages/{react,solid-v1,solid-v2}/src/`                     | Adapter specs, beside their module                                | Browser, Chromium                 |
| `packages/{react,solid-v1,solid-v2}/tests/parity.spec.*`      | The parity scenarios of `packages/adapter-parity`, in the browser | Browser, Chromium                 |
| `packages/{react,solid-v1,solid-v2}/tests/server/`            | The server parity scenarios                                       | `test:ssr`, Node                  |
| `packages/{react,solid-v1,solid-v2}/tests/types/*.test-d.tsx` | The public types of each adapter, through the package names       | `tsc`, no runtime                 |
| `examples/{react,solid,solid-v2}/tests/`                      | The example apps, one spec per example                            | Browser, Chromium                 |
| `examples/kit/src/*.spec.ts`, `packages/adapter-parity/src/`  | Shared example code and adapter fixtures, beside their module     | Node                              |

- Use `*.spec.ts` for code without JSX and `*.spec.tsx` for code with JSX.
- `packages/solid` publishes the build of `solid-v1` and `solid-v2` and has no specs. Put a Solid spec in
  the private workspace of its runtime.
- A core module that holds only types (`types.ts`, `*-types.ts`) needs no sibling spec. Its type tests go in
  `tests/types/`.

## Runners

Import test functions and assertions from `vite-plus/test`. The root `vite.config.ts` runs browser specs
with Playwright in headless Chromium at 1280 × 720. `solid-v2` also runs a mobile instance at 390 × 844.
Core runs in Node only.

Browser specs render with `vitest-browser-react` (React examples), `createRoot` from `react-dom/client` (the
React adapter), or `render` from `solid-js/web` or `@solidjs/web` (Solid). Use locators from `vite-plus/test/browser`, await renders and interactions, and use
`expect.element` for a DOM assertion that may need to retry.

## Cases and Assertions

- Keep each file on one module or flow. Group the cases of one function with `describe()`.
- Give each case a concrete behavior title.
- Assert what a user of the code can observe: values, state, issues, DOM output and calls.
- A case has one runtime `expect()`. To assert several values of one behavior, compare them in one
  `expect` (for example an array of results).

- Each case has a runtime assertion, an `expectTypeOf`, or a `@ts-expect-error`.
- Mock only when needed. Use `vi.fn()` for callbacks.

## Coverage

`pnpm run test:coverage` reports the coverage of the core `unit` project. No threshold fails a run, and
integration specs do not count toward it.

## Type Tests

Type tests import by package name (`@oxform/core`, `@oxform/core/behaviors`, ...). Each export has a
`describe` block that names it, with a positive case (`expectTypeOf`) and a negative case
(`@ts-expect-error`). `tests/types/exemptions.json` lists the exports that cannot have a negative case,
with the reason.

Write a negative case as a call, not as an unused `const`: `noUnusedLocals` also reports an unused
`const`, so `@ts-expect-error` could pass for the wrong reason.

```ts
const accepts = <Type>(value: Type): Type => value;

it('rejects an unknown path', () => {
  // @ts-expect-error The path is not in the values.
  accepts<Path<Profile>>('address.country');
});
```

- `pnpm --dir packages/core run check:types` checks the type tests against the source.
- `check:types:dist` checks them against the built `dist`, through the package `exports`.
- `check:type-coverage` fails when an export has no type case, or is not in `tests/types/inventory.json`
  (the list of public names of each entry point).

## Running Tests

```bash
pnpm run test                                                # every workspace
pnpm run test:coverage                                       # core unit coverage
pnpm --dir packages/core run test src/main/context.spec.ts  # one core spec
pnpm --dir packages/solid-v2 run test                        # one adapter, in the browser
```

Vite+ runs tests once. Use a package's `pnpm run test:dev` for watch mode.

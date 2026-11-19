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

| Type                 | Pattern                            | Example                            |
| -------------------- | ---------------------------------- | ---------------------------------- |
| Functions, variables | camelCase                          | `defineForm`, `createParts`        |
| Types                | PascalCase                         | `FormStatus`, `FieldHandle`        |
| Constants            | UPPER_SNAKE                        | `MAX_RETRIES`                      |
| Boolean names        | `is`/`has`/`should` prefix         | `isDisabled`, `hasError`           |
| Files                | kebab-case, one module per concern | `create-parts.ts`, `check.ts`      |
| Extension            | `<word>`                           | `validation`, `submit`             |
| Api type             | `<Word>Api`                        | `ValidationApi`, `SubmitApi`       |
| Instance member      | `<word>`, also the state key       | `form.submit`, `state.status`      |
| Internal function    | `create<Word>`                     | `createValidation`, `createStatus` |

- One word names a concern. The extension `status` has the api type `StatusApi`, the member `form.status`
  and the internal function `createStatus`. `handles` is the one exception: it adds `field`, `array` and
  `scope`, and its api type is `Scope`.
- A `create<Word>` function is internal. Public names come from the `export/` files.
- Use the [glossary](#glossary) words in code, comments, tests and documents. `pnpm run check:terms` fails
  on a word that the glossary replaces, such as `plugin` (use `extension`). The term list is in
  `scripts/check-terms.ts`.
- Do not mark internal code with a `~` or `_` prefix.

## File Organization

```
packages/core/
├── export/            # entry files: index.ts, behaviors.ts, presets.ts, adapter.ts
├── src/
│   ├── internal/      # shared helpers
│   ├── main/          # defineForm, context, effects, scopes, paths
│   ├── behaviors/     # one module per built-in extension
│   └── presets/       # presets
└── tests/             # flow specs, and types/ for the type tests
```

- A spec sits beside its module: `check.ts` and `check.spec.ts`. A module that holds only types needs no spec.
- See [Structure](./structure.md) for the import direction of the core areas.

## Glossary

Use these words, with these meanings, in code, tests and documentation. Do not use a synonym.

| Term           | Meaning                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Form           | The immutable result of `defineForm`, `.extend` or `.configure`. Safe at module scope. Not an instance |
| Instance       | One live form from `form.create()`: api, `store`, `id`, `destroy()`                                    |
| Extension      | One object from `defineExtension`: `name`, `options`, `state`, `api`, `slots`, `fields`                |
| Needs          | What an extension or slot group requires from the form so far. Every need is required                  |
| Behavior       | The concern that a built-in extension implements: values, validation, status, ...                      |
| Preset         | A function from form to form that applies several extensions. `standard` is the first preset           |
| Option         | An input of a form, declared with `optionTypes`                                                        |
| Check          | A named set of issues by path, added by the `check(name)` extension. `error` is one check              |
| Slot           | The framework-neutral description of one rendered piece. A slot never names a framework component      |
| Slot group     | A reusable set of slots made by `defineSlots`                                                          |
| Part           | What an adapter renders from a slot                                                                    |
| Scope          | A sub-object of the values. `defineScope` describes one, and `scope(path)` views one                   |
| Handle         | The object from `field(path)` or `array(path)` on an instance                                          |
| Field members  | Members that an extension adds to field handles, with `on<T>`                                          |
| Adapter        | A framework package that turns a form into parts and adapter hooks                                     |
| Extension hook | A subscription point of a built-in api: `values.intercept`, `values.onChange`, `validation.onRun`      |
| Adapter hook   | A function from `createParts` that reads a form inside a component: `useField`, `useSelector`          |
| Main APIs      | The public functions of `@oxform/core`. Contributors may say "kernel" for the code behind them         |

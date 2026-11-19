# TypeScript Conventions

**When writing TypeScript code, verify:**

- [ ] Public functions have explicit return types.
- [ ] Use `satisfies` to check a value and keep its literal types.
- [ ] Use types, not interfaces, unless declaration merging is the purpose.
- [ ] Use `import type` (or `type` in an import list) for type-only imports.
- [ ] Use the `#*` aliases of the package, not `../../` paths. See [Structure](./structure.md#import-paths).
- [ ] Do not mark internal code with a `~` or `_` prefix. Keep it out of the `export/` files. A module-private
      channel is a module-private name.

## Inference rules

Types come from the chain of a form. Do not write the state or api type of a form by hand.

- **An extension takes an `Extendable` parameter.** `Extendable<Values, Provides, State>` states the api and
  the state that the extension needs. `needs` lists the same names at runtime, and the type fails when the
  two differ. TypeScript infers everything else from the chain, in call order.
- **A preset is a generic function.** Its signature takes the form that it extends and returns that form
  extended with the options that the preset adds. Do not fix the values, state, api or slots of the form in
  the signature.
- **No hand-written state or api type.** Read them back with `ValuesOf`, `ApiOf`, `StateOf`, `OptionsOf`,
  `InstanceOf` and `PartsOf`. If a type needs a hand-written copy, the extension is missing a declaration.
- **Write `text` after `state` in a custom slot.** TypeScript infers left to right. Otherwise the state of
  the slot is `{}`.
- **Give a state factory a return type** when its first value is `null`:
  `state: (): { autosave: AutosaveState } => ...`.
- **Paths are checked.** Use `Path`, `ArrayPath`, `PathValue` and `ValuesOf`, not `string`, for a path that
  the form owns.

## API design

- One word names a concern. See the naming rule in [Code style](./code-style.md#naming-conventions).
- Public types come from an entry point of the package. A type test reaches them through the package name.
  Each export needs a positive and a negative type case. See [Testing](./testing.md#type-tests).
- An adapter imports from `@oxform/core/adapter` only what it needs. See
  [Adapter authors](./adapter-authors.md).

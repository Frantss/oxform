# Adapter Authors

This guide is for the authors of a framework adapter, such as `@oxform/react` or `@oxform/solid`. It
describes `@oxform/core/adapter`, the entry point for adapters. Application code does not import it, and no
public documentation page describes it. Its exports are a semver contract.

An adapter knows no extension. Everything that a part does comes from its slot, so an adapter renders the
slots of any form. An adapter lists `@oxform/core` as a peer dependency and does not re-export it.

## Exports

| Export                        | Category | Use                                                                                                             |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `slotsOf(form)`               | function | The slots of a form, in extension order. A later slot with the same key replaces an earlier one                 |
| `adapterControlsOf(instance)` | function | The controls of an instance that `form.create` made. It throws for any other object                             |
| `prefixOf(scope)`             | function | The path prefix of a scope, or `''` for an object that is not a scope                                           |
| `joinPath(prefix, path)`      | function | Joins a prefix and a path with a dot                                                                            |
| `isDeepEqual(a, b)`           | function | The comparison that core uses for a change: plain objects, arrays, dates, maps and sets by content              |
| `AdapterControls`             | type     | `setOptions(options)` merges new options like `create`. `unmount()` runs the cleanups and keeps them registered |
| `PartsFromSlots`              | type     | The parts of a slot record, one per slot. `PartsOf<Form>` uses it                                               |
| `ResolveKeys`                 | type     | Replaces each `key` prop of a part with a path of the form, or of the scope                                     |
| `FieldMembersOf`              | type     | The field members that extensions add, at a path                                                                |
| `ChecksOfApi`                 | type     | The check names of an api that has handles                                                                      |

## Contract

1. **Read slots once per form.** `slotsOf` builds a new record on each call, so cache it per form object.
2. **Render one part per slot.** The part `root` is the form element and holds the instance. Name the other
   parts by the capitalized slot name.
3. **Make the instance.** `Root` calls `form.create(options)`, or takes a given instance. It uses a
   framework id for the `id` option, so an id is the same on a server and in a browser.
4. **Follow the options.** When `Root` made the instance, call `adapterControlsOf(instance).setOptions(options)`
   each time the options change. Call `unmount()` when `Root` leaves. A given instance keeps the options of
   its owner, so do not call the controls for it.
5. **Read each slot as a pure function of the store.** `present`, `state`, `attrs` and `text` run on a server.
   `on` and `bind` run in a browser only.
6. **Resolve `key` props.** A part with a `scope` prop resolves each `key` prop against the scope:
   `joinPath(prefixOf(scope), key)`.
7. **Map the names.** Slots use HTML attribute names (`for`, `class`, `readonly`). Map them to the names of
   the framework.
8. **Skip equal renders.** Compare the state of a part with `isDeepEqual` before it updates the view.
9. **Take the element from the slot.** The caller of `createParts` may override it with an `ElementTag`.

## Rules

- Import from `@oxform/core` and its entry points only. Never import core source, `Symbol.for` keys or any
  other private name.
- The three adapters (`@oxform/react`, `@oxform/solid` and `@oxform/solid/v2`) export the same names.
  `pnpm run check:parity` fails otherwise. The parity scenarios of `packages/adapter-parity` must pass for
  each adapter, in the browser and on a server. See [Testing](./testing.md).
- The lint rules in the root `vite.config.ts` stop an adapter from importing `@oxform/core/presets` or
  `@oxform/core/behaviors` outside type imports and specs.
- A change to `@oxform/core/adapter` needs a type test, the entry's inventory entry and a changeset.

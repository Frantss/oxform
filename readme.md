# Oxform

> [!IMPORTANT]
> `oxform-react` and `oxform-core` are deprecated. Use [`@oxform/react`](https://www.npmjs.com/package/@oxform/react) and [`@oxform/core`](https://www.npmjs.com/package/@oxform/core) instead.

Oxform is a framework-agnostic form library for TypeScript. A form is a chain of extensions. Each extension
adds options, state, an api and slots. A thin adapter turns the slots of a form into parts for React or Solid.

Five principles guide the design:

1. **Composable.** A form is a chain of extensions, assembled for each use case.
2. **Reusable.** An extension, a preset, a slot group and a scope can each be packaged and used in another
   form.
3. **Extensible.** Add options, state, api, slots and field members with no change to the engine.
4. **Type-safe.** `Values` comes from the schema. Every other type is inferred from the chain.
5. **Lightweight.** A form pays only for the extensions in its chain.

The design is inspired by [UI SDK](https://ui-sdk.dev/): a `define*` function with `name`, `options`,
`state`, `api` and `slots`, and slots that an adapter renders.

## A sign-in form

A sign-in page needs values, validation, one blocking check, status, events and submit. It needs no arrays and
no reset, so the chain leaves them out.

```ts
import { defineForm, slots } from '@oxform/core';
import {
  check,
  events,
  fieldErrorSlots,
  rootSlots,
  status,
  submit,
  submitSlots,
  validation,
  values,
} from '@oxform/core/behaviors';

export const signIn = defineForm({ schema: signInSchema, defaultValues: emptySignIn })
  .extend(values)
  .extend(validation)
  .extend(check('error', { blocking: true, exclusive: true }))
  .extend(status)
  .extend(events)
  .extend(submit)
  .extend(slots(slot => ({ ...rootSlots(slot), ...fieldErrorSlots(slot), ...submitSlots(slot) })))
  .configure({ error: { blur: signInSchema, submit: signInSchema } });
```

The full example is `examples/kit/src/sign-in.ts`. The `standard` preset in `@oxform/core/presets` applies
the full chain in one call.

## Packages

| Package                                       | Entry points                              | Purpose                                |
| --------------------------------------------- | ----------------------------------------- | -------------------------------------- |
| [`@oxform/core`](./packages/core/readme.md)   | `.`, `/behaviors`, `/presets`, `/adapter` | The main APIs, the built-in extensions |
| [`@oxform/react`](./packages/react/readme.md) | `.`                                       | The React adapter. Peer: React 19      |
| [`@oxform/solid`](./packages/solid/readme.md) | `.` (Solid 1), `/v2` (Solid 2)            | The Solid adapters                     |

The packages are ESM only. An adapter lists `@oxform/core` as a peer dependency.

## Links

- Documentation: [oxform.frantss.uy](https://oxform.frantss.uy). For agents: [llms.txt](https://oxform.frantss.uy/llms.txt).
- Examples: [`examples/`](./examples) (React, Solid 1, Solid 2 and the shared kit). The docs
  [playground](./apps/docs/README.md#playground) runs them.
- Contributors: [`AGENTS.md`](./AGENTS.md) and the guides in [`docs/`](./docs).
- Source: [github.com/frantss/oxform](https://github.com/frantss/oxform).

## License

MIT

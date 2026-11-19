# @oxform/core

The main APIs, the built-in extensions and the presets of [Oxform](https://github.com/frantss/oxform), a
framework-agnostic form library. A form is a chain of extensions. An adapter renders it.

## Install

```bash
npm install @oxform/core
```

The package is ESM only. Add an adapter to render a form: [`@oxform/react`](../react/readme.md) or
[`@oxform/solid`](../solid/readme.md). Any [Standard Schema](https://standardschema.dev/) library, such as
Zod, gives the schema.

## Entry points

| Entry point              | Holds                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `@oxform/core`           | `defineForm`, `defineExtension`, `slots`, `defineSlots`, `on`, `defineScope`, `createEffect`, and the types                               |
| `@oxform/core/behaviors` | The built-in extensions (`values`, `validation`, `check`, `status`, `events`, `arrays`, `reset`, `submit`, `handles`) and the slot groups |
| `@oxform/core/presets`   | `standard`: the chain of the built-in extensions                                                                                          |
| `@oxform/core/adapter`   | The contract for adapter authors. Application code does not use it                                                                        |

## Example

```ts
import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { z } from 'zod';

const schema = z.object({ email: z.email() });

const signIn = defineForm({ schema, defaultValues: { email: '' } })
  .extend(standard)
  .configure({ onSubmit: async values => console.log(values.email) });

const form = signIn.create();
form.values.set('email', 'ada@example.com');
await form.submit.run();
```

## Documentation

- [Documentation site](https://oxform.frantss.uy)
- [llms.txt](https://oxform.frantss.uy/llms.txt), the index of every page for agents

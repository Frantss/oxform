# @oxform/solid

The Solid adapters of [Oxform](https://github.com/frantss/oxform), a framework-agnostic form library. They
turn the slots of a form into Solid components and hooks. They know no extension.

## Install

```bash
npm install @oxform/core @oxform/solid solid-js
```

`@oxform/core` and `solid-js` are peer dependencies. The package is ESM only.

For Solid 2, install the Solid 2 release candidate that the package lists, and import from `@oxform/solid/v2`:

```bash
npm install @oxform/core @oxform/solid solid-js@2.0.0-rc.19 @solidjs/web@2.0.0-rc.19
```

## Entry points

| Entry point        | Solid   | Holds                                               |
| ------------------ | ------- | --------------------------------------------------- |
| `@oxform/solid`    | Solid 1 | `createParts`, `usePart` and the types of the parts |
| `@oxform/solid/v2` | Solid 2 | The same names, for Solid 2                         |

## Example

`createParts` gives one component per slot of the form, and the hooks of the form. The state of a slot is
a function in Solid.

```tsx
import { createParts } from '@oxform/solid';
import { signInPage } from './sign-in-page';

const { Root, Field, FieldError, Submit } = createParts(signInPage, { fieldError: 'span' });

export const SignIn = () => (
  <Root aria-label='Sign in' novalidate>
    <label>
      Email
      <Field name='email' type='email' autocomplete='email' />
    </label>
    <FieldError name='email' />
    <Submit>{state => (state().submitting ? 'Signing in…' : 'Sign in')}</Submit>
  </Root>
);
```

The form `signInPage` is a chain of `@oxform/core` extensions. See `examples/kit/src/sign-in.ts`.

## Documentation

- [Documentation site](https://oxform.frantss.uy)
- [llms.txt](https://oxform.frantss.uy/llms.txt), the index of every page for agents

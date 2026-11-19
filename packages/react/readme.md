# @oxform/react

The React adapter of [Oxform](https://github.com/frantss/oxform), a framework-agnostic form library. It
turns the slots of a form into React components and hooks. It knows no extension.

## Install

```bash
npm install @oxform/core @oxform/react
```

`@oxform/core` and React 19 are peer dependencies. The package is ESM only.

## Entry points

| Entry point     | Holds                                               |
| --------------- | --------------------------------------------------- |
| `@oxform/react` | `createParts`, `usePart` and the types of the parts |

## Example

`createParts` gives one component per slot of the form, and the hooks of the form.

```tsx
import { createParts } from '@oxform/react';
import { signInPage } from './sign-in-page';

const { Root, Field, FieldError, Submit } = createParts(signInPage, { fieldError: 'span' });

export const SignIn = () => (
  <Root aria-label='Sign in' noValidate>
    <label>
      Email
      <Field name='email' type='email' autoComplete='email' />
    </label>
    <FieldError name='email' />
    <Submit>{state => (state.submitting ? 'Signing in…' : 'Sign in')}</Submit>
  </Root>
);
```

The form `signInPage` is a chain of `@oxform/core` extensions. See `examples/kit/src/sign-in.ts`.

## Documentation

- [Documentation site](https://oxform.frantss.uy)
- [llms.txt](https://oxform.frantss.uy/llms.txt), the index of every page for agents

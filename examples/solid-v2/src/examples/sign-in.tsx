import { createParts } from '@oxform/solid/v2';
import { signInPage } from 'example-oxform-kit/sign-in-page';

/** E29. One part per slot. The error renders in a `span`, the one element that the design changes. */
const { Root, Field, FieldError, Submit } = createParts(signInPage, { fieldError: 'span' });

export const SignIn = () => (
  <Root aria-label='Sign in' novalidate>
    <label>
      Email
      <Field name='email' type='email' autocomplete='email' />
    </label>
    <FieldError name='email' />
    <label>
      Password
      <Field name='password' type='password' autocomplete='current-password' />
    </label>
    <FieldError name='password' />
    <Submit>{state => (state().submitting ? 'Signing in…' : 'Sign in')}</Submit>
  </Root>
);

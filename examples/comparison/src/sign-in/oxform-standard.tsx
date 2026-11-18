import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { createParts } from '@oxform/react';
import { server } from '../server';
import { emptySignIn, refusedMessage, signInSchema } from './schema';
import { revalidateAfterSubmit } from './revalidate-after-submit';

/** The `standard` preset, with the submit rules and the server refusal of E19. */
const signIn = defineForm({ schema: signInSchema, defaultValues: emptySignIn })
  .extend(standard)
  .extend(revalidateAfterSubmit)
  .configure({
    error: { submit: signInSchema },
    onSubmit: async (credentials, form) => {
      if (!(await server.signIn(credentials))) form.error.set('password', [{ message: refusedMessage }]);
    },
  });

const { Root, Field, FieldError, Submit } = createParts(signIn);

export const SignIn = () => (
  <Root aria-label='Sign in' noValidate>
    <label>
      Email
      <Field name='email' type='email' />
    </label>
    <FieldError name='email' />
    <label>
      Password
      <Field name='password' type='password' />
    </label>
    <FieldError name='password' />
    <Submit>Sign in</Submit>
  </Root>
);

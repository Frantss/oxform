import { Field, Form, setErrors, useForm } from '@formisch/react';
import { server } from '../server';
import { emptySignIn, refusedMessage, signInSchema } from './schema';

export const SignIn = () => {
  const form = useForm({ schema: signInSchema, initialInput: emptySignIn, validate: 'submit', revalidate: 'input' });

  return (
    <Form
      of={form}
      aria-label='Sign in'
      onSubmit={async credentials => {
        if (!(await server.signIn(credentials))) setErrors(form, { path: ['password'], errors: [refusedMessage] });
      }}
    >
      {(['email', 'password'] as const).map(name => (
        <Field key={name} of={form} path={[name]}>
          {field => (
            <>
              <label>
                {name === 'email' ? 'Email' : 'Password'}
                <input
                  {...field.props}
                  type={name}
                  value={field.input ?? ''}
                  aria-describedby={field.errors ? `${name}-error` : undefined}
                />
              </label>
              {field.errors && <p id={`${name}-error`}>{field.errors[0]}</p>}
            </>
          )}
        </Field>
      ))}
      <button type='submit' disabled={form.isSubmitting}>
        Sign in
      </button>
    </Form>
  );
};

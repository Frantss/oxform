import { useState } from 'react';
import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { Inspector } from '../inspector';

const schema = z.object({ email: z.email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });

const login = configureForm(standardForm, {
  schema,
  defaultValues: { email: '', password: '' },
  error: { blur: schema, submit: schema },
});

const { Root, Field, FieldError, Submit, useSelector } = createParts(login, {
  root: 'form',
  field: 'input',
  fieldError: 'p',
  submit: 'button',
});

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

export function Login() {
  const [result, setResult] = useState<{ message: string; failed: boolean }>();

  return (
    <Root
      className='layout'
      onSubmit={async (values, form) => {
        setResult(undefined);
        await wait(700);
        if (values.password !== 'correct horse') {
          form.field('password').setError([{ message: 'Wrong email or password' }]);
          return setResult({ message: 'Sign in failed.', failed: true });
        }
        setResult({ message: `Signed in as ${values.email}.`, failed: false });
      }}
    >
      <div className='card'>
        <p className='hint'>
          The password is <code>correct horse</code>. Any other password gets a server error.
        </p>
        <label>
          Email
          <Field name='email' type='email' autoComplete='username' />
          <FieldError name='email'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <label>
          Password
          <Field name='password' type='password' autoComplete='current-password' />
          <FieldError name='password'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <div className='actions'>
          <Submit>{({ submitting }) => (submitting ? 'Signing in…' : 'Sign in')}</Submit>
        </div>
        {result && (
          <p className='result' role='status' data-failed={result.failed || undefined}>
            {result.message}
          </p>
        )}
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}

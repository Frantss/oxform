import { useState } from 'react';
import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { Inspector } from '../inspector';

const schema = z.object({
  name: z.string().min(3, 'Use at least 3 characters'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

// `schema` sets the data shape only. The validators of the `error` check decide when it runs.
const signup = configureForm(standardForm, {
  schema,
  defaultValues: { name: '', email: '', password: '' },
  error: { change: schema, submit: schema },
});

const { Root, Field, FieldError, Submit, Reset, useSelector } = createParts(signup);

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

export function Signup() {
  const [result, setResult] = useState<string>();

  return (
    <Root
      className='layout'
      onSubmit={async values => {
        await wait(600);
        setResult(`Welcome, ${values.name}.`);
      }}
      onInvalid={issues => setResult(`${issues.error.length} issues. Nothing was sent.`)}
    >
      <div className='card'>
        <label>
          Name
          <Field name='name' autoComplete='name' />
          <FieldError name='name' />
        </label>
        <label>
          Email
          <Field name='email' type='email' autoComplete='email' />
          <FieldError name='email' />
        </label>
        <label>
          Password
          <Field name='password' type='password' autoComplete='new-password' />
          <FieldError name='password' />
        </label>
        <div className='actions'>
          <Submit>{({ submitting }) => (submitting ? 'Creating account…' : 'Create account')}</Submit>
          <Reset>Reset</Reset>
        </div>
        {result && (
          <p className='result' role='status'>
            {result}
          </p>
        )}
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}

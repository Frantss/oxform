import { useState } from 'react';
import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { Inspector } from '../inspector';

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));
const isTaken = async (username: string) => {
  await wait(900);
  return ['ada', 'grace'].includes(username.toLowerCase());
};

const schema = z.object({
  username: z.string().min(3, 'Use at least 3 characters'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

// The server is asked on blur only. Typing and submit use the plain schema.
const availability = z.object({
  username: z.string().refine(async username => !(await isTaken(username)), 'That username is taken'),
});

const account = configureForm(standardForm, {
  schema,
  defaultValues: { username: '', password: '' },
  error: { change: schema, blur: availability, submit: schema },
});

const { Root, Field, FieldError, Submit, useSelector } = createParts(account);

function Checking() {
  const validating = useSelector(state => state.status.form.validating);
  return (
    <p className='hint'>{validating ? 'Checking with the server…' : 'Try "ada" or "grace", then leave the field.'}</p>
  );
}

export function AsyncValidation() {
  const [created, setCreated] = useState<string>();

  return (
    <Root className='layout' onSubmit={values => setCreated(`Account ${values.username} created.`)}>
      <div className='card'>
        <label>
          Username
          <Field name='username' autoComplete='off' />
          <FieldError name='username' />
          <Checking />
        </label>
        <label>
          Password
          <Field name='password' type='password' autoComplete='new-password' />
          <FieldError name='password' />
        </label>
        <div className='actions'>
          <Submit>Create account</Submit>
        </div>
        {created && (
          <p className='result' role='status'>
            {created}
          </p>
        )}
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}

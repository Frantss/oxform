import { useState } from 'react';
import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { leanForm } from '../kit/lean-form';
import { Inspector } from '../inspector';

const schema = z.object({ email: z.email('Enter a valid email') });

// The lean form has no reset, arrays or field handles, so none of that code is in the bundle.
const newsletter = configureForm(leanForm, {
  schema,
  defaultValues: { email: '' },
  error: { blur: schema, submit: schema },
});

const { Root, Field, FieldError, Submit, useSelector } = createParts(newsletter, {
  root: 'form',
  field: 'input',
  fieldError: 'p',
  submit: 'button',
});

export function Newsletter() {
  const [subscribed, setSubscribed] = useState<string>();

  return (
    <Root className='layout' onSubmit={values => setSubscribed(`${values.email} is subscribed.`)}>
      <div className='card'>
        <label>
          Email
          <Field name='email' type='email' autoComplete='email' />
          <FieldError name='email'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <div className='actions'>
          <Submit>Subscribe</Submit>
        </div>
        {subscribed && (
          <p className='result' role='status'>
            {subscribed}
          </p>
        )}
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}

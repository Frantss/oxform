import { useState } from 'react';
import z from 'zod';
import { configureForm } from '../../../spike/src/form';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { withMasks } from '../kit/masks';
import { Inspector } from '../inspector';

const schema = z.object({
  holder: z.string().min(1, 'Enter the name on the card'),
  number: z.string().regex(/^\d{4} \d{4} \d{4} \d{4}$/, 'Enter 16 digits'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Use MM/YY'),
  cvc: z.string().regex(/^\d{3}$/, 'Enter 3 digits'),
});

// `masks` is an option the extension added, typed by the form's own field names.
const payment = configureForm(withMasks(standardForm), {
  schema,
  defaultValues: { holder: '', number: '', expiry: '', cvc: '' },
  masks: { number: '#### #### #### ####', expiry: '##/##', cvc: '###' },
  error: { blur: schema, submit: schema },
});

const { Root, Field, FieldError, Submit, useField, useSelector } = createParts(payment, {
  root: 'form',
  field: 'input',
  fieldError: 'p',
  submit: 'button',
});

/** `unmasked()` is the extension's addition to the field handle. */
function CardSummary() {
  const digits = useField('number').unmasked();
  return <p className='hint'>{digits ? `Card ending ${digits.slice(-4).padStart(4, '•')}` : 'No card entered'}</p>;
}

export function Payment() {
  const [result, setResult] = useState<string>();

  return (
    <Root className='layout' onSubmit={values => setResult(`Charging ${values.number}.`)}>
      <div className='card'>
        <label>
          Name on card
          <Field name='holder' autoComplete='cc-name' />
          <FieldError name='holder'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <label>
          Card number
          <Field name='number' inputMode='numeric' autoComplete='cc-number' placeholder='4242 4242 4242 4242' />
          <FieldError name='number'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <label>
          Expiry
          <Field name='expiry' inputMode='numeric' autoComplete='cc-exp' placeholder='MM/YY' />
          <FieldError name='expiry'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <label>
          CVC
          <Field name='cvc' inputMode='numeric' autoComplete='cc-csc' placeholder='123' />
          <FieldError name='cvc'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <CardSummary />
        <div className='actions'>
          <Submit>Pay</Submit>
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

import { useState } from 'react';
import z from 'zod';
import type { HandlesApi } from '../../../api';
import { configureForm } from '../../../spike/src/form';
import { defineFragment } from '../../../spike/src/fragments';
import { createParts } from '../../../spike/src/react/create-parts';
import { standardForm } from '../../../spike/src/standard';
import { Inspector } from '../inspector';

type Address = { street: string; zip: string };

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  zip: z.string().length(5, 'A zip code has 5 characters'),
});

// A fragment is a schema, defaults and validators for a sub-object. It has no place until a form mounts it.
const address = defineFragment({
  schema: addressSchema,
  defaultValues: { street: '', zip: '' },
  checks: { error: { change: addressSchema, submit: addressSchema } },
});

const orderSchema = z.object({ name: z.string().min(1, 'Name is required') });

const checkout = configureForm(standardForm, {
  schema: orderSchema,
  defaultValues: { name: '' },
  fragments: { billing: address, shipping: address },
  error: { change: orderSchema, submit: orderSchema },
});

const { Root, Field, FieldError, Submit, useForm, useScope, useSelector } = createParts(checkout, {
  root: 'form',
  field: 'input',
  fieldError: 'p',
  submit: 'button',
});

// Written once. The names are relative to the scope, so it works at any mount point.
function AddressFields({ scope, label }: { scope: HandlesApi<Address, 'error'>; label: string }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <label>
        Street
        <Field scope={scope} name='street' />
        <FieldError scope={scope} name='street'>
          {({ messages }) => messages[0]}
        </FieldError>
      </label>
      <label>
        Zip
        <Field scope={scope} name='zip' inputMode='numeric' />
        <FieldError scope={scope} name='zip'>
          {({ messages }) => messages[0]}
        </FieldError>
      </label>
    </fieldset>
  );
}

function Addresses() {
  const billing = useScope('billing');
  const shipping = useScope('shipping');

  return (
    <>
      <AddressFields scope={billing} label='Billing address' />
      <AddressFields scope={shipping} label='Shipping address' />
    </>
  );
}

function CopyBilling() {
  const form = useForm();
  return (
    <button type='button' onClick={() => form.values.set('shipping', form.values.get('billing'))}>
      Copy billing to shipping
    </button>
  );
}

export function Checkout() {
  const [paid, setPaid] = useState<string>();

  return (
    <Root
      className='layout'
      onSubmit={values =>
        setPaid(`Order for ${values.name} ships to ${values.shipping.street}, ${values.shipping.zip}.`)
      }
    >
      <div className='card'>
        <label>
          Name
          <Field name='name' />
          <FieldError name='name'>{({ messages }) => messages[0]}</FieldError>
        </label>
        <Addresses />
        <div className='actions'>
          <CopyBilling />
          <Submit>Pay</Submit>
        </div>
        {paid && (
          <p className='result' role='status'>
            {paid}
          </p>
        )}
      </div>
      <Inspector useSelector={useSelector} />
    </Root>
  );
}

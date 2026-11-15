import { useState } from 'react';
import z from 'zod';
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

const { Root, Field, FieldError, Submit, within, useForm, useScope, useSelector } = createParts(checkout);

type AddressParts = Pick<ReturnType<typeof within<Address>>, 'Field' | 'FieldError'>;

// Written once. It gets the parts already bound to a scope: it imports nothing from the form, and no part can forget
// its scope.
function AddressFields({ parts: { Field, FieldError }, label }: { parts: AddressParts; label: string }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <label>
        Street
        <Field name='street' />
        <FieldError name='street' />
      </label>
      <label>
        Zip
        <Field name='zip' inputMode='numeric' />
        <FieldError name='zip' />
      </label>
    </fieldset>
  );
}

function Addresses() {
  const billing = within(useScope('billing'));
  const shipping = within(useScope('shipping'));

  return (
    <>
      <AddressFields parts={billing} label='Billing address' />
      <AddressFields parts={shipping} label='Shipping address' />
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
          <FieldError name='name' />
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

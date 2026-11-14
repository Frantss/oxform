// SKETCH: none of these APIs exist and this file is not compiled. The types are in api.ts and type-tests/.
//
// Use case: a reusable piece of form structure, an address block, mounted twice.
// A fragment is a schema, defaults, and validators for a sub-object, without a place. Mounting gives it one.

import { configureForm, defineFragment, type HandlesApi } from '@oxform/core';
import { standardForm } from '@oxform/core/standard';
import { createParts } from '@oxform/react';
import z from 'zod';

const addressSchema = z.object({ street: z.string().min(1), zip: z.string().length(5) });

export const address = defineFragment({
  schema: addressSchema,
  defaultValues: { street: '', zip: '' },
  checks: { error: { change: addressSchema, blur: store => zipRulesSchema(store.values) } },
});

// `schema` and `defaultValues` describe the form's own part. Each mount adds its values at its prefix:
// Values is { name: string; billing: Address; shipping: Address }.
export const checkout = configureForm(standardForm, {
  schema: z.object({ name: z.string() }),
  defaultValues: { name: '' },
  fragments: { billing: address, shipping: address },
  onSubmit: values => pay(values),
});

// How it works underneath: the kernel wraps each fragment's schema, so it validates `values[prefix]` and
// re-prefixes the issue paths. The composed schema runs the form's schema and each wrapper. A fragment's
// validators are wrapped the same way. This needs no library-specific `.extend`.

export const { Root, Field, Submit, useScope } = createParts(checkout, {
  root: 'form',
  field: 'input',
  submit: 'button',
});

// Paths are typed through the mounts.
export function CheckoutForm() {
  return (
    <Root>
      <Field name='name' />
      <Field name='billing.street' />
      <Field name='billing.zip' />
      <Field name='shipping.zip' />
      <Submit>Pay</Submit>
    </Root>
  );
}

// Logic written once for the fragment works at any mount point and in any form that mounts it.
// `scope` accepts only paths that hold an object, so `scope('name')` is a type error.
function addressComplete(scope: HandlesApi<{ street: string; zip: string }, 'error'>) {
  return scope.field('street').get() !== '' && scope.field('zip').get().length === 5;
}

const form = checkout();
addressComplete(form.scope('billing'));
addressComplete(form.scope('shipping'));

export function BillingSummary() {
  const billing = useScope('billing'); // same signature as `form.scope`
  return <p>{addressComplete(billing) ? 'Complete' : 'Incomplete'}</p>;
}

// Open: rendering parts inside a scope, `<Field scope={billing} name='zip' />`, is not designed yet.

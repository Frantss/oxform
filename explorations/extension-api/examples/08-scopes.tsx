// Type-checked: `tsc -p examples/tsconfig.json`. The types are in spike/src/api.ts and type-tests/.
//
// Use case: a reusable piece of form structure, an address block, used twice.
// A scope is a sub-object. `defineScope` gives it a schema, defaults and validators, without a place.
// `defineForm({ scopes })` gives it a path. `form.scope(path)` is the one accessor, for any object path, placed or not.

import { defineForm, defineScope, type Scope } from '@oxform/core';
import { standard } from '@oxform/core/standard';
import { createParts } from '@oxform/react';
import z from 'zod';

const addressSchema = z.object({ street: z.string().min(1), zip: z.string().length(5) });

export const address = defineScope({
  schema: addressSchema,
  defaultValues: { street: '', zip: '' },
  checks: { error: { change: addressSchema, blur: store => zipRulesSchema(store.values) } },
});

// `schema` and `defaultValues` describe the form's own part. Each scope adds its values at its key:
// Values is { name: string; billing: Address; shipping: Address }. `scopes` is the one thing besides
// `schema`, `defaultValues`, `name` and `id` that `defineForm` takes, because it changes `Values`.
// A key cannot be a key of the form's own values, and cannot contain a dot: both are type errors, and `create` throws.
// A scope with validators for a check (`error` here) needs the form to have that check.
export const checkout = defineForm({
  name: 'checkout',
  schema: z.object({ name: z.string() }),
  defaultValues: { name: '' },
  scopes: { billing: address, shipping: address },
})
  .extend(standard)
  .configure({ onSubmit: values => pay(values) });

// How it works underneath: the kernel wraps each scope's validators, so they validate `values[path]` and
// re-prefix the issue paths. The form's own validator and each scope's both run, and their issues are merged.
// This needs no library-specific `.extend`. The default values of a scope merge deeply under `configure` and `create`:
// `checkout.create({ defaultValues: { name: '', billing: { street: 'Main' } } })` keeps the scope's `zip` default.
// The form's `schema` only types the values: nothing validates with it, the checks do.

export const { Root, Field, Submit, useScope } = createParts(checkout, {
  root: 'form',
  field: 'input',
  submit: 'button',
});

// Paths are typed through the scopes. `onSubmit` is an option of `submit`, configured above.
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

// Logic written once for `Scope<Address>` works at any scope, at a plain object path, and in any form.
// `scope` accepts only paths that hold an object, so `scope('name')` is a type error.
function addressComplete(scope: Scope<{ street: string; zip: string }, 'error'>) {
  return scope.field('street').get() !== '' && scope.field('zip').get().length === 5;
}

const form = checkout.create();
addressComplete(form.scope('billing'));
addressComplete(form.scope('shipping'));

export function BillingSummary() {
  const billing = useScope('billing'); // same signature as `form.scope`
  return <p>{addressComplete(billing) ? 'Complete' : 'Incomplete'}</p>;
}

// Parts take a `scope`: the names are relative to it and typed by its values. The block is written once.
// It sits next to `createParts` because `Field` is the form's own component.
function AddressFields({ scope }: { scope: Scope<{ street: string; zip: string }, 'error'> }) {
  return (
    <>
      <Field scope={scope} name='street' />
      <Field scope={scope} name='zip' />
    </>
  );
}

export function CheckoutAddresses() {
  const billing = useScope('billing');
  const shipping = useScope('shipping');
  return (
    <Root>
      <AddressFields scope={billing} /> {/* writes billing.street and billing.zip */}
      <AddressFields scope={shipping} />
    </Root>
  );
}

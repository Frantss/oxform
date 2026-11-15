// Scopes on the real types: one term, one view type (`Scope<V>`), one accessor (`form.scope(path)`).
// A scope definition (`defineScope`) gives a sub-object a schema, defaults and validators. `defineForm({ scopes })`
// places it, and `form.scope(path)` views any object path, placed or not.

import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineForm, defineScope, type Scope } from '../spike/src/api';
import { standard } from '../spike/src/standard';

type Address = { street: string; zip: string; geo: { lat: number } };
type Checkout = { email: string; notes: string };
declare const addressSchema: StandardSchemaV1<Address>;
declare const checkoutSchema: StandardSchemaV1<Checkout>;

const address = defineScope({
  schema: addressSchema,
  defaultValues: { street: '', zip: '', geo: { lat: 0 } },
});

const checkout = defineForm({
  schema: checkoutSchema,
  defaultValues: { email: '', notes: '' },
  scopes: { billing: address, shipping: address },
}).extend(standard);

const form = checkout.create();

// 1. Values gains one entry per scope
export const street: string = form.values.get('billing.street');
export const own: string = form.values.get('email');
export const whole: Address = form.values.get('shipping');
// @ts-expect-error no such scope
form.values.get('home.street');

// 2. form.scope(path) is typed by the scope definition
export const zip: string = form.scope('billing').field('zip').get();
export const lat: number = form.scope('billing').scope('geo').field('lat').get();
// @ts-expect-error not a field of Address
form.scope('billing').field('nope');
// @ts-expect-error `email` holds a string, so it has no scope
form.scope('email');
// @ts-expect-error unknown scope path
form.scope('home');

// 3. A scope is not an instance member: form.scope(path) is the only accessor
// @ts-expect-error there is no form.billing
form.billing;

// 4. One function, one type, at a placed scope, at a plain object path, in another form, and nested
function isFilled(scope: Scope<Address, 'error'>) {
  return scope.field('street').get() !== '' && scope.field('zip').get() !== '';
}
isFilled(form.scope('billing'));
isFilled(form.scope('shipping'));

const plain = defineForm({
  schema: {} as StandardSchemaV1<{ delivery: Address; other: Checkout }>,
  defaultValues: { delivery: { street: '', zip: '', geo: { lat: 0 } }, other: { email: '', notes: '' } },
})
  .extend(standard)
  .create();
isFilled(plain.scope('delivery'));
// Known gap (also in the old `HandlesApi`): `isFilled(plain.scope('other'))` compiles although `other` is a Checkout.
// The `field` members are generic functions, and their parameter constraints are not compared by shape.

const nested = defineForm({
  schema: {} as StandardSchemaV1<{ order: { to: Address } }>,
  defaultValues: { order: { to: { street: '', zip: '', geo: { lat: 0 } } } },
})
  .extend(standard)
  .create();
isFilled(nested.scope('order').scope('to'));

// 5. An array item path is a scope too
const members = defineForm({
  schema: {} as StandardSchemaV1<{ members: Address[] }>,
  defaultValues: { members: [] },
})
  .extend(standard)
  .create();
isFilled(members.scope('members.0'));

// 6. Scope keys must not collide with the form's own values, and must not contain a dot
defineForm({
  schema: checkoutSchema,
  defaultValues: { email: '', notes: '' },
  // @ts-expect-error `email` is a key of the form's own values
  scopes: { email: address },
});
defineForm({
  schema: checkoutSchema,
  defaultValues: { email: '', notes: '' },
  // @ts-expect-error a scope is one key: use form.scope('a.b') for a nested path
  scopes: { 'a.b': address },
});
defineForm({
  schema: checkoutSchema,
  defaultValues: { email: '', notes: '' },
  scopes: { home: address },
}).extend(standard);

// 7. A form without scopes is unchanged
const lean = defineForm({ schema: checkoutSchema, defaultValues: { email: '', notes: '' } })
  .extend(standard)
  .create();
lean.values.get('email');
// @ts-expect-error no scopes were given
lean.values.get('billing');

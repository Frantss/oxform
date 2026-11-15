// Composition on the real types: field members by value type, scopes, packaged extensions and their needs,
// a form without validation, hooks. The inference of single extensions is in `extension-api.ts`, the slot groups and
// parts in `part-scope.tsx` and `extension-parts.tsx`, the check sugar in `kernel-extensions.ts`.

import type { StandardSchemaV1 } from '@standard-schema/spec';
import { autosave } from '../kit/autosave';
import { masks } from '../kit/masks';
import { warnings } from '../kit/warnings';
import { createParts, defineForm, defineScope, type Scope } from '../spike/src/api';
import { events } from '../spike/src/events';
import { status } from '../spike/src/status';
import { standard } from '../spike/src/standard';
import { validation } from '../spike/src/validation';
import { values } from '../spike/src/values';

type Account = { name: string; tags: string[]; email: string };
declare const accountSchema: StandardSchemaV1<Account>;
const accountDefaults: Account = { name: '', tags: [], email: '' };
const account = defineForm({ schema: accountSchema, defaultValues: accountDefaults });

// 1. Field members: typed by the field's own value
const maskedForm = account.extend(standard).extend(masks).create();
maskedForm.field('name').unmasked();
maskedForm.field('name').change('x'); // base handle is kept
// @ts-expect-error members only on string values
maskedForm.field('tags').unmasked();
// @ts-expect-error unknown path
maskedForm.field('nope');

// 2. Scopes are placed at a path and add to Values
type Address = { street: string; zip: string };
declare const addressSchema: StandardSchemaV1<Address>;
const address = defineScope({
  schema: addressSchema,
  defaultValues: { street: '', zip: '' },
  checks: { error: { change: addressSchema } },
});
const checkout = defineForm({
  schema: accountSchema,
  defaultValues: accountDefaults,
  scopes: { billing: address, shipping: address },
})
  .extend(standard)
  .configure({ onSubmit: values => values.billing.zip.toUpperCase() })
  .create();
checkout.field('name').change('x');
checkout.field('billing.zip').change('12345');
checkout.field('shipping.street').get().toUpperCase();
// @ts-expect-error scope paths are typed
checkout.field('billing.nope');
checkout.scope('billing').field('zip').change('1');
// @ts-expect-error scoped paths are typed
checkout.scope('billing').field('nope');

// Scoped handles carry the members of an extension, typed by the sub-object's own values at every depth of `scope`
const maskedCheckout = defineForm({
  schema: accountSchema,
  defaultValues: accountDefaults,
  scopes: { billing: address },
})
  .extend(standard)
  .extend(masks)
  .create();
maskedCheckout.scope('billing').field('zip').unmasked();
maskedCheckout.scope('billing').field('zip').change('1'); // the base handle is kept
maskedCheckout.scope('billing').field('zip').error(); // and the check sugar
// @ts-expect-error scoped paths are typed
maskedCheckout.scope('billing').field('nope');
type Deep = { a: { b: { c: { text: string; count: number } } } };
declare const deepSchema: StandardSchemaV1<Deep>;
const deep = defineForm({ schema: deepSchema, defaultValues: { a: { b: { c: { text: '', count: 0 } } } } })
  .extend(standard)
  .extend(masks)
  .create();
deep.scope('a').scope('b').scope('c').field('text').unmasked(); // three levels deep
deep.scope('a').scope('b').scope('c').field('text').change('x'); // the base handle is kept
// @ts-expect-error `count` is not a string
deep.scope('a').scope('b').scope('c').field('count').unmasked();
addressFields(maskedCheckout.scope('billing')); // still assignable to a function written for `Scope`

// The hook's field handle carries the members too, typed by the field's value
const maskedParts = createParts(account.extend(standard).extend(masks));
function MaskedHook() {
  maskedParts.useField('name').unmasked();
  maskedParts.useField('name').change('x'); // base handle is kept
  // @ts-expect-error members only on string values
  maskedParts.useField('tags').unmasked();
  return null;
}

// A component written once for the scope works at any path
function addressFields(scope: Scope<Address, 'error'>) {
  scope.field('zip').change('x');
}
addressFields(checkout.scope('billing'));
addressFields(checkout.scope('shipping'));
// @ts-expect-error a scope of the wrong shape is rejected
addressFields(checkout.scope('name'));

// Parts given a `scope`: names are paths of the scope's values, so a block written once fits any path
const checkoutForm = defineForm({
  schema: accountSchema,
  defaultValues: accountDefaults,
  scopes: { billing: address, shipping: address },
}).extend(standard);
const checkoutParts = createParts(checkoutForm);
function AddressBlock({ scope }: { scope: Scope<Address, 'error'> }) {
  return (
    <>
      <checkoutParts.Field scope={scope} name='street' />
      <checkoutParts.FieldError scope={scope} name='zip'>
        {({ messages }) => messages[0]}
      </checkoutParts.FieldError>
      {/* @ts-expect-error not a path of Address */}
      <checkoutParts.Field scope={scope} name='nope' />
      {/* @ts-expect-error a path of the form, not of Address */}
      <checkoutParts.Field scope={scope} name='billing.street' />
    </>
  );
}
function AddressHooks({ scope }: { scope: Scope<Address, 'error'> }) {
  const street = checkoutParts.useField('street', { scope });
  street.change('x');
  street.error(); // the check sugar of the scope
  // @ts-expect-error not an array path of Address
  checkoutParts.useArrayField('nope', { scope });
  // @ts-expect-error not a path of Address
  checkoutParts.useField('nope', { scope });
  // @ts-expect-error a path of the form, not of Address
  checkoutParts.useField('billing.street', { scope });
  return null;
}
export function CheckoutView() {
  const billing = checkoutParts.useScope('billing');
  checkoutParts.useField('street', { scope: billing }).get().toUpperCase();
  // `useScope` opens a scope inside a scope
  checkoutParts.useScope('billing').field('zip').get().toUpperCase();
  return (
    <checkoutParts.Root>
      <checkoutParts.Field name='billing.street' />
      <checkoutParts.Field scope={billing} name='street' />
      {/* @ts-expect-error without a scope, names are paths of the form */}
      <checkoutParts.Field name='street' />
      <AddressBlock scope={billing} />
      <AddressBlock scope={checkoutForm.create().scope('shipping')} />
      {/* @ts-expect-error a scope of the wrong shape */}
      <checkoutParts.Field scope={checkoutForm.create().scope('name')} name='street' />
    </checkoutParts.Root>
  );
}

// A form without scopes is unchanged
account.extend(standard).create().field('name');

// 3. A packaged extension states what it needs from the form, and the form is checked at `.extend`
const draft = account
  .extend(standard)
  .extend(autosave)
  .configure({ saveDraft: value => value.email.toUpperCase() });
draft.create().autosave.flush();
draft.create().store.state.autosave.dirty satisfies boolean;
const draftParts = createParts(draft);
draftParts.AutosaveStatus;

// 4. A form without validation: status and events need no validation extension
const lean = account.extend(values).extend(status).extend(events);
lean.create().status.at('name');
lean.create().events.change('name', 'x');

// @ts-expect-error autosave needs validation, so the lean form is rejected
lean.extend(autosave);
// @ts-expect-error the warnings preset needs validation too
lean.extend(warnings);
// The same extensions apply once the form has validation.
lean.extend(validation).extend(autosave);

// 5. Lifecycle hooks, on the preset
const form = account.extend(standard).create();
form.submit.intercept(attempt => {
  if (attempt.values.name === '') attempt.cancel();
});
form.submit.onResult(result => result.issues.error.length);
form.validation.onRun(run => run.valid && run.issues.error.length);

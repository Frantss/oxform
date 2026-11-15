import type { StandardSchemaV1 } from '@standard-schema/spec';
import { type Attributes, type HandlesApi, configureForm, createParts, standardForm } from '../api';

type Contact = { name: string; phone: string };
type Account = { name: string; contact: Contact };
declare const schema: StandardSchemaV1<Account>;

const parts = createParts(
  configureForm(standardForm, { schema, defaultValues: { name: '', contact: { name: '', phone: '' } } }),
);

// A part with a `scope` prop. Known gap: the types cannot know that a block meant a scope. A name that is also a
// path of the form compiles without `scope` and writes to the form's field. A name that is not a path is caught.
export function ContactBlock({ scope }: { scope: HandlesApi<Contact, 'error'> }) {
  return (
    <>
      <parts.Field scope={scope} name='name' />
      <parts.Field name='name' />
      {/* @ts-expect-error `phone` is not a path of the form, so the missing scope is caught */}
      <parts.Field name='phone' />
    </>
  );
}

// Parts bound to a scope take no `scope` prop, so it cannot be forgotten. Names are paths of the scope's values.
// A block that takes the bound parts needs no import of the form's own parts.
type ContactParts = Pick<ReturnType<typeof parts.within<Contact>>, 'Field' | 'FieldError'>;

function Phone({ Field, FieldError }: ContactParts) {
  return (
    <>
      <Field name='phone' type='tel' ref={(element: HTMLInputElement | null) => element?.focus()} />
      <FieldError name='phone' />
      {/* @ts-expect-error `nope` is not a path of Contact */}
      <Field name='nope' />
    </>
  );
}

export function BoundBlock() {
  const contact = parts.useScope('contact');
  const bound = parts.within(contact);
  return (
    <>
      <bound.Field name='name' />
      <Phone Field={bound.Field} FieldError={bound.FieldError} />
      {/* @ts-expect-error a bound part does not take a scope */}
      <bound.Field name='name' scope={contact} />
    </>
  );
}

// An attribute may be a list of strings.
export const listAttributes: Attributes = { multiple: true, value: ['a', 'b'] as readonly string[] };

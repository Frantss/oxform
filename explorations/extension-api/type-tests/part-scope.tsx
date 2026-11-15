import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  type Attributes,
  type Extendable,
  type Scope,
  type Needs,
  type SlotFactory,
  createParts,
  defineExtension,
  defineForm,
  defineSlots,
  slots,
} from '../spike/src/api';
import { values } from '../spike/src/values';

type Contact = { name: string; phone: string };
type Account = { name: string; contact: Contact };
declare const schema: StandardSchemaV1<Account>;

/** Handles and the two field parts. The preset's real extensions arrive in a later phase. */
const fieldParts = <V,>(form: Extendable<V, Needs<V, 'values'>>) =>
  defineExtension(form, {
    name: 'field-parts',
    api: () => ({}) as Scope<V, 'error'>,
    slots: slot => ({
      field: slot({ element: 'input', props: { name: 'key' } }),
      fieldError: slot({
        element: 'p',
        props: { name: 'key' },
        state: () => ({ messages: [] as readonly string[] }),
      }),
    }),
  });

const form = defineForm({ schema, defaultValues: { name: '', contact: { name: '', phone: '' } } })
  .extend(values)
  .extend(fieldParts);

const parts = createParts(form);

// A part with a `scope` prop. Known gap: the types cannot know that a block meant a scope. A name that is also a
// path of the form compiles without `scope` and writes to the form's field. A name that is not a path is caught.
export function ContactBlock({ scope }: { scope: Scope<Contact, 'error'> }) {
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

// A slot group states its needs, and both halves are enforced. An extension that spreads it must declare them in its
// `form` parameter (the api and the state), and `.extend` then checks the form for them.
const needsShown = defineSlots((slot: SlotFactory<{ readonly flag: true }, { readonly shown: boolean }>) => ({
  badge: slot({ element: 'span', attrs: state => ({ 'data-shown': state.shown }) }),
}));

// The extension declares neither need.
export const lacksState = <V,>(form: Extendable<V, { readonly flag: true }>) =>
  defineExtension(form, {
    name: 'lacks-state',
    api: () => ({}),
    // @ts-expect-error the form's state has no `shown`
    slots: slot => ({ ...needsShown(slot) }),
  });
export const lacksApi = <V,>(form: Extendable<V, {}, { readonly shown: boolean }>) =>
  defineExtension(form, {
    name: 'lacks-api',
    api: () => ({}),
    // @ts-expect-error the form's api has no `flag`
    slots: slot => ({ ...needsShown(slot) }),
  });

// The extension declares both needs, so `.extend` checks the form.
export const shownBadge = <V,>(form: Extendable<V, { readonly flag: true }, { readonly shown: boolean }>) =>
  defineExtension(form, { name: 'badge', api: () => ({}), slots: slot => ({ ...needsShown(slot) }) });

const provides = <V,>(form: Extendable<V>) =>
  defineExtension(form, {
    name: 'provides',
    state: () => ({ shown: true }),
    api: () => ({ flag: true as const }),
  });
defineForm({ schema, defaultValues: { name: '', contact: { name: '', phone: '' } } })
  .extend(provides)
  .extend(shownBadge);
defineForm({ schema, defaultValues: { name: '', contact: { name: '', phone: '' } } })
  // @ts-expect-error the form provides neither `flag` nor `shown`
  .extend(shownBadge);

// A slot-only extension declares nothing. `slot` is typed by the api and state of the form it is applied to, and each
// group checks its own needs against that factory.
const newForm = () => defineForm({ schema, defaultValues: { name: '', contact: { name: '', phone: '' } } });
const flagOnly = <V,>(form: Extendable<V>) =>
  defineExtension(form, { name: 'flag-only', api: () => ({ flag: true as const }) });
const shownOnly = <V,>(form: Extendable<V>) =>
  defineExtension(form, { name: 'shown-only', state: () => ({ shown: true }), api: () => ({}) });

export const slotOnly = newForm()
  .extend(provides)
  .extend(slots(slot => ({ ...needsShown(slot) })));

// A group call that the form cannot satisfy is an error: the api, the state, or both.
newForm()
  .extend(flagOnly)
  .extend(
    slots(slot => ({
      // @ts-expect-error the form's state has no `shown`
      ...needsShown(slot),
    })),
  );
newForm()
  .extend(shownOnly)
  .extend(
    slots(slot => ({
      // @ts-expect-error the form's api has no `flag`
      ...needsShown(slot),
    })),
  );
newForm().extend(
  slots(slot => ({
    // @ts-expect-error the form has neither
    ...needsShown(slot),
  })),
);

// The slot factory sees the form's state, so a slot written inline is typed too.
export const inline = newForm()
  .extend(provides)
  .extend(
    slots(slot => ({
      // @ts-expect-error the form's state has no `nope`
      lost: slot({ attrs: state => ({ 'data-nope': state.nope }) }),
      found: slot({ element: 'span', attrs: state => ({ 'data-shown': state.shown }) }),
    })),
  );

// A later slot with the key of an earlier slot replaces it, and the parts come from the merged slots.
export const replaced = newForm()
  .extend(provides)
  .extend(slots(slot => ({ ...needsShown(slot), extra: slot({ element: 'i' }) })))
  .extend(slots(slot => ({ badge: slot({ element: 'b' }) })));
const replacedParts = createParts(replaced);
export const badge = <replacedParts.Badge />;
export const extra = <replacedParts.Extra />;

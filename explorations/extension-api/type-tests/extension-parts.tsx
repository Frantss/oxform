// Type tests for parts and the React types of the extension API. Nothing here runs.

import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  createParts,
  defineExtension,
  defineForm,
  defineSlots,
  usePart,
  type EventsApi,
  type Extendable,
  type Scope,
  type Needs,
  type PartsOf,
  type SlotFactory,
} from '../spike/src/api';

declare const schema: StandardSchemaV1<{ name: string; address: { city: string } }>;

/** A form with handles, and one slot whose `name` prop is a path of the form. */
const fieldParts = <V,>(form: Extendable<V, Needs<V, 'values'>>) =>
  defineExtension(form, {
    name: 'field',
    state: () => ({ shown: true }),
    api: () => ({}) as Scope<V, 'error'>,
    slots: slot => ({
      field: slot({
        element: 'input',
        props: { name: 'key' },
        attrs: (state, part) => ({ name: part.key, 'data-shown': state.shown, 'data-prop': part.props.name }),
      }),
      fieldError: slot({
        element: 'p',
        props: { name: 'key' },
        state: () => ({ messages: [] as readonly string[] }),
      }),
      root: slot({ element: 'form' }),
    }),
  });

export const form = defineForm({ schema, defaultValues: { name: '', address: { city: '' } } })
  .extend(<V,>(form: Extendable<V>) =>
    defineExtension(form, {
      name: 'values',
      api: () => ({}) as Needs<V, 'values'>,
    }),
  )
  .extend(fieldParts);

// The parts come from the slot declarations. A `key` prop carries a marker that the component resolves to a path.
type Parts = PartsOf<typeof form>;
const element: 'input' = {} as Parts['field']['element'];
void element;

const { Field, FieldError, Root, useScope, useField, within } = createParts(form);

export const ok = (
  <Root>
    <Field name='name' />
    <Field name='address.city' />
    <FieldError name='name'>{({ messages }) => messages.join(',')}</FieldError>
  </Root>
);

// @ts-expect-error a part's name is a path of the form's values
export const unknownPath = <Field name='nope' />;

// A scope re-types the names by the scope's values, so a block works at any path.
declare const address: Scope<{ city: string }, 'error'>;
export const scoped = <Field name='city' scope={address} />;
// @ts-expect-error `name` is a path of the form, not of the scope
export const wrongScope = <Field name='name' scope={address} />;

const Bound = within(address);
export const bound = <Bound.Field name='city' />;
// @ts-expect-error bound parts take paths of the scope
export const wrongBound = <Bound.Field name='address.city' />;

// Another element, chosen by the caller.
const Spans = createParts(form, { fieldError: 'span' } as const);
export const span = <Spans.FieldError name='name' />;

// Hooks are typed by the form.
export function Component() {
  const phone = useField('name');
  const city = useField('address.city');
  const addressScope = useScope('address');
  const nested = useField('city', { scope: addressScope });
  // @ts-expect-error unknown path
  useField('nope');
  return (
    <>
      {phone.get()}
      {city.get()}
      {nested.get()}
    </>
  );
}

export const custom = usePart(form, 'field', { name: 'name' }, { className: 'x' }, 'input');
// @ts-expect-error `nope` is not a path of the form's values
usePart(form, 'field', { name: 'nope' }, {}, 'input');

// A group of slots states its needs, and an extension that lacks them fails to compile.
const needsShown = defineSlots((slot: SlotFactory<{}, { shown: boolean }>) => ({
  badge: slot({ element: 'span', attrs: state => ({ 'data-shown': state.shown }) }),
}));
export const grouped = <V,>(form: Extendable<V>) =>
  defineExtension(form, { name: 'grouped', state: () => ({ shown: true }), api: () => ({}), slots: needsShown });
const needsEvents = defineSlots((slot: SlotFactory<{ readonly events: EventsApi<any> }, {}>) => ({
  focusable: slot({ on: { focus: (_event, { api }) => api.events.focus('a') } }),
}));
export const lacking = <V,>(form: Extendable<V>) =>
  defineExtension(form, {
    name: 'lacking',
    api: () => ({}),
    // @ts-expect-error the form's api has no `events`
    slots: slot => ({ ...needsEvents(slot) }),
  });
export const providing = <V,>(form: Extendable<V>) =>
  defineExtension(form, {
    name: 'providing',
    api: () => ({}) as { readonly events: EventsApi<V> },
    slots: slot => ({ ...needsEvents(slot) }),
  });

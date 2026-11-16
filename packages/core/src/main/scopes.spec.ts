import { describe, expect, it, vi } from 'vite-plus/test';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { arrays } from '#behaviors/arrays';
import { check } from '#behaviors/check';
import { events } from '#behaviors/events';
import { handles } from '#behaviors/handles';
import { reset } from '#behaviors/reset';
import { status } from '#behaviors/status';
import { validation } from '#behaviors/validation';
import { values } from '#behaviors/values';
import { reporting, schemaOf } from '../../tests/helpers';
import { defineExtension, defineForm } from './form';
import { defineScope } from './scopes';
import type { Extendable } from './types';

type Address = { street: string; tags: string[]; geo: { lat: number; lng: number } };
type Checkout = { email: string };

/** The `values` state key, and an api that reads it. */
const store = <Values>(form: Extendable<Values>) =>
  defineExtension(form, {
    name: 'store',
    state: options => ({ values: options.defaultValues }),
    api: context => ({ values: () => context.state.values.get() }),
  });

/** An address scope, and a checkout form that places it under `billing` and `shipping`. */
const setup = (scopeSchema = schemaOf<Address>()) => {
  const created: { destroy(): void }[] = [];
  const address = defineScope({
    schema: scopeSchema,
    defaultValues: { street: '', tags: ['home'], geo: { lat: 0, lng: 0 } },
  });
  const checkout = defineForm({
    schema: schemaOf<Checkout>(),
    defaultValues: { email: '' },
    scopes: { billing: address, shipping: address },
  }).extend(store);

  return {
    address,
    checkout,
    /** Creates an instance, and destroys it at the end of the case. */
    create<Instance extends { destroy(): void }>(make: () => Instance): Instance {
      const instance = make();
      created.push(instance);
      return instance;
    },
    [Symbol.dispose]: () => created.forEach(instance => instance.destroy()),
  };
};

describe('defineScope', () => {
  it('places the default values of a scope at each path', () => {
    using subject = setup();

    expect(subject.create(() => subject.checkout.create()).values()).toEqual({
      email: '',
      billing: { street: '', tags: ['home'], geo: { lat: 0, lng: 0 } },
      shipping: { street: '', tags: ['home'], geo: { lat: 0, lng: 0 } },
    });
  });

  it('lets an instance override a default of a scope', () => {
    using subject = setup();
    const defaults = { email: '', billing: { street: 'Main' } } as never;
    const instance = subject.create(() => subject.checkout.create({ defaultValues: defaults }));

    expect(instance.values()).toMatchObject({ billing: { street: 'Main' }, shipping: { street: '' } });
  });

  it('places one definition in two forms', () => {
    using subject = setup();
    const other = defineForm({ schema: schemaOf<object>(), defaultValues: {}, scopes: { home: subject.address } });

    expect(subject.create(() => other.extend(store).create()).values()).toEqual({
      home: { street: '', tags: ['home'], geo: { lat: 0, lng: 0 } },
    });
  });

  it('throws at create for a key of the own values of the form, and names the scope (rule 1)', () => {
    using subject = setup();
    const form = defineForm({
      schema: schemaOf<Checkout>(),
      defaultValues: { email: '' },
      scopes: { email: subject.address } as never,
    });

    expect(() => form.create()).toThrow('The scope "email" has the key of one of the form\'s own values, which it would replace.');
  });

  it('throws at create for a dotted key, and names the scope (rule 5)', () => {
    using subject = setup();
    const form = defineForm({ schema: schemaOf<object>(), defaultValues: {}, scopes: { 'a.b': subject.address } as never });

    expect(() => form.create()).toThrow('The scope "a.b" has a dot in its key. A scope is one key: view a nested path with form.scope(path).');
  });

  it('merges the defaults deeply, lowest priority first, and replaces arrays (rule 2)', () => {
    using subject = setup();
    const form = defineForm({
      schema: schemaOf<Checkout>(),
      defaultValues: { email: '' },
      scopes: { billing: subject.address },
    })
      .extend(store)
      .configure({ defaultValues: { email: '', billing: { geo: { lat: 1 } } } as never });
    const instance = subject.create(() => form.create({ defaultValues: { email: '', billing: { geo: { lng: 2 }, tags: ['work'] } } as never }));

    expect(instance.values()).toEqual({ email: '', billing: { street: '', tags: ['work'], geo: { lat: 1, lng: 2 } } });
  });

  it('validates nothing with the schema of a scope (rule 6)', () => {
    const validate = vi.fn(() => ({ issues: [{ message: 'Invalid' }] }));
    using subject = setup({ '~standard': { version: 1, vendor: 'test', validate } });
    subject.create(() => subject.checkout.create());

    expect(validate).not.toHaveBeenCalled();
  });
});

/** A schema that reports an empty `street`, with a path relative to the address. */
const streetRequired: StandardSchemaV1<never> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: value => ((value as Address).street === '' ? { issues: [{ message: 'Street', path: ['street'] }] } : { value: value as never }),
  },
};

/** A scope whose `error` check requires the street at submit, and a checkout form with a chain that validates. */
const validated = (scopeChecks: object = { error: { submit: streetRequired } }) => {
  const address = defineScope({
    schema: schemaOf<Address>(),
    defaultValues: { street: '', tags: [], geo: { lat: 0, lng: 0 } },
    checks: scopeChecks as never,
  });
  const form = defineForm({
    schema: schemaOf<Checkout & { items: Address[] }>(),
    defaultValues: { email: '', items: [{ street: 'Item', tags: [], geo: { lat: 0, lng: 0 } }] },
    scopes: { billing: address, shipping: address },
  })
    .extend(values)
    .extend(validation)
    .extend(check('error'))
    .extend(status)
    .extend(events)
    .extend(arrays)
    .extend(reset)
    .extend(handles);
  return { address, form };
};

describe('scope validators', () => {
  it('run at each path, and give issue paths that start with the path', async () => {
    using subject = setup();
    const instance = subject.create(() => validated().form.create());
    instance.values.set('billing.street', 'Main');
    await instance.validation.run();

    expect(instance.validation.issues()).toEqual({
      error: [{ message: 'Street', path: ['shipping', 'street'], type: 'submit' }],
    });
  });

  it('give a validator function the values at the path', async () => {
    using subject = setup();
    const seen: unknown[] = [];
    const recording = (input: { values: unknown }) => (seen.push(input.values), streetRequired);
    const instance = subject.create(() => validated({ error: { submit: recording } }).form.create());
    instance.values.set('shipping.street', 'Side');
    await instance.validation.run();

    expect(seen).toEqual([expect.objectContaining({ street: '' }), expect.objectContaining({ street: 'Side' })]);
  });

  it('merge with the validators of the form, and keep both issues (rule 3)', async () => {
    using subject = setup();
    const formStreet = reporting({ message: 'Form', path: ['billing', 'street'] });
    const instance = subject.create(() => validated().form.create({ error: { submit: formStreet } }));
    instance.values.set('shipping.street', 'Side');
    await instance.validation.run();

    expect(instance.error.at('billing.street').map(entry => entry.message)).toEqual(['Form', 'Street']);
  });

  it('place one definition in two forms, each with its own path', async () => {
    using subject = setup();
    const { address } = validated();
    const other = defineForm({ schema: schemaOf<object>(), defaultValues: {}, scopes: { home: address } })
      .extend(values)
      .extend(validation)
      .extend(check('error'));
    const instance = subject.create(() => other.create());
    await instance.validation.run();

    expect(instance.error.at('home.street' as never)).toHaveLength(1);
  });

  it('throw at create for a check that the form does not have, and name the scope and the check (rule 4)', () => {
    using subject = setup();
    const form = validated({ warning: { submit: streetRequired } }).form;

    expect(() => subject.create(() => form.create())).toThrow(
      'The scope "billing" has validators for the check "warning", which the form does not have.',
    );
  });

  it('throw at create on a form without validation (rule 4)', () => {
    using subject = setup();
    const { address } = validated();
    const form = defineForm({ schema: schemaOf<object>(), defaultValues: {}, scopes: { home: address } }).extend(store);

    expect(() => subject.create(() => form.create())).toThrow('The scope "home" has validators for the check "error", which the form does not have.');
  });
});

describe('scoped paths', () => {
  it('change and reset one path, and keep the other', () => {
    using subject = setup();
    const instance = subject.create(() => validated().form.create());
    instance.field('billing.street').change('Main');
    instance.field('shipping.street').change('Side');
    instance.scope('billing').field('street').reset();

    expect([instance.values.get('billing.street'), instance.values.get('shipping.street')]).toEqual(['', 'Side']);
  });

  it('give one view to a placed scope, an object path and an array item, and no instance member', () => {
    using subject = setup();
    const instance = subject.create(() => validated().form.create());
    instance.values.set('billing.street', 'Main');
    const street = (scope: { field(path: 'street'): { get(): string } }) => scope.field('street').get();

    expect([street(instance.scope('billing')), street(instance.scope('items.0')), 'billing' in instance]).toEqual(['Main', 'Item', false]);
  });
});

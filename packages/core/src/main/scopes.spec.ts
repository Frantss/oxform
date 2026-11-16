import { describe, expect, it, vi } from 'vite-plus/test';
import { schemaOf } from '../../tests/helpers';
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

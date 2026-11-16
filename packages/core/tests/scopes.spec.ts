import { describe, expect, it } from 'vite-plus/test';
import { defineExtension, defineForm, defineScope, on, type Extendable } from '#core';
import { standard } from '#core/presets';
import { requiredAt, schemaOf } from './helpers';

type Address = { street: string; geo: { lat: number } };

const isNumber = (value: unknown): value is number => typeof value === 'number';

/** `doubled()` on every number field. */
const doubling = <Values>(form: Extendable<Values>) =>
  defineExtension(form, { name: 'doubling', api: () => ({}), fields: on(isNumber)(field => ({ doubled: () => field.get() * 2 })) });

const address = defineScope({
  schema: schemaOf<Address>(),
  defaultValues: { street: '', geo: { lat: 1 } },
  checks: { error: { submit: requiredAt('street', 'Street') } },
});

/** A checkout form with the address at two paths, and a profile form with it at one. */
const setup = () => {
  const checkout = defineForm({
    schema: schemaOf<{ email: string }>(),
    defaultValues: { email: '' },
    scopes: { billing: address, shipping: address },
  })
    .extend(standard)
    .extend(doubling)
    .create();
  const profile = defineForm({ schema: schemaOf<{ name: string }>(), defaultValues: { name: '' }, scopes: { home: address } })
    .extend(standard)
    .create();

  return {
    checkout,
    profile,
    [Symbol.dispose]: () => {
      checkout.destroy();
      profile.destroy();
    },
  };
};

describe('one scope definition in two forms', () => {
  it('validates each path on its own, with the issues at the path', async () => {
    using subject = setup();
    subject.checkout.scope('billing').field('street').change('Main');
    await Promise.all([subject.checkout.validation.run(), subject.profile.validation.run()]);

    expect([
      subject.checkout.error.at('billing.street').length,
      subject.checkout.error.at('shipping.street').length,
      subject.profile.error.at('home.street').length,
    ]).toEqual([0, 1, 1]);
  });

  it('resets one path and keeps the other', () => {
    using subject = setup();
    subject.checkout.scope('billing').field('street').change('Main');
    subject.checkout.scope('shipping').field('street').change('Side');
    subject.checkout.reset.at('billing');

    expect([subject.checkout.values.get('billing.street'), subject.checkout.values.get('shipping.street')]).toEqual(['', 'Side']);
  });

  it('gives the field members to the fields of a nested scope', () => {
    using subject = setup();

    expect(subject.checkout.scope('billing').scope('geo').field('lat').doubled()).toBe(2);
  });
});

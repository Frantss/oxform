import { describe, expect, it } from 'vite-plus/test';
import { copyAddress } from './address';
import { checkout } from './checkout';

const home = { street: '1 Main Street', city: 'London', postalCode: 'N1' };

const setup = () => {
  const form = checkout.create();
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('address', () => {
  it('runs its rules at each place', async () => {
    using subject = setup();
    await subject.form.submit.run();

    expect([subject.form.error.at('billing.city')[0]?.message, subject.form.error.at('shipping.city')[0]?.message]).toEqual([
      'Enter a city.',
      'Enter a city.',
    ]);
  });

  it('copies the billing address to the shipping address', () => {
    using subject = setup();
    const billing = subject.form.scope('billing');
    for (const [name, value] of Object.entries(home)) billing.field(name as keyof typeof home).change(value);
    copyAddress(billing, subject.form.scope('shipping'));

    expect(subject.form.values.get('shipping')).toEqual(home);
  });
});

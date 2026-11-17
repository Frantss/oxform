import { describe, expect, it } from 'vite-plus/test';
import { checkout } from './checkout';
import { emptyCheckout } from './schemas/checkout';

const setup = () => {
  const form = checkout.create();
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('checkout', () => {
  it('refuses an empty submit with a message on a nested address field', async () => {
    using subject = setup();
    await subject.form.submit.run();

    expect(subject.form.field('shipping.city').error()[0]?.message).toBe('Enter a city.');
  });

  it('resets the values and the messages', async () => {
    using subject = setup();
    subject.form.values.set('email', 'ada@example.com');
    await subject.form.submit.run();
    subject.form.reset.all();

    expect([subject.form.values.get(), subject.form.error.at('', { nested: true })]).toEqual([emptyCheckout, []]);
  });
});

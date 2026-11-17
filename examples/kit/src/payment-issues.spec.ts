import { describe, expect, it } from 'vite-plus/test';
import { checkout } from './checkout';
import { payOrder } from './payment-issues';
import type { Checkout } from './schemas/checkout';

const address = { street: '1 Main Street', city: 'London', postalCode: 'N1' };
const order = (number: string): Checkout => ({
  email: 'ada@example.com',
  country: 'GB',
  region: 'London',
  card: { number },
  billing: address,
  shipping: address,
});

const setup = (number: string) => {
  const form = checkout.create({ defaultValues: order(number), onSubmit: payOrder });
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('applyPaymentIssues', () => {
  it('shows the refusal of the payment service on its field', async () => {
    using subject = setup('4000 0000 0000 0002');
    await subject.form.submit.run();

    expect(subject.form.field('card.number').error()).toEqual([{ message: 'The bank declined the card.' }]);
  });

  it('sets no error when the payment goes through', async () => {
    using subject = setup('4242 4242 4242 4242');
    await subject.form.submit.run();

    expect(subject.form.error.at('', { nested: true })).toEqual([]);
  });
});

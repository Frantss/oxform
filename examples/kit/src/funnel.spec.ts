import { describe, expect, it, vi } from 'vite-plus/test';
import { checkout } from './checkout';
import { funnel } from './funnel';
import { emptyCheckout, type Checkout } from './schemas/checkout';

const tracked = checkout.extend(funnel);

const address = { street: '1 Main Street', city: 'London', postalCode: 'N1' };
const order: Checkout = {
  email: 'ada@example.com',
  country: 'GB',
  region: 'London',
  card: { number: '4242 4242 4242 4242' },
  billing: address,
  shipping: address,
};

const setup = (defaultValues = emptyCheckout) => {
  const onTrack = vi.fn();
  const form = tracked.create({ defaultValues, onTrack, onSubmit: () => {} });
  return { form, onTrack, [Symbol.dispose]: () => form.destroy() };
};

describe('funnel', () => {
  it('reports the failing paths and the failed submit', async () => {
    using subject = setup({ ...order, shipping: { ...address, city: '' } });
    await subject.form.submit.run();

    expect(subject.onTrack.mock.calls).toEqual([[{ type: 'invalid', paths: ['shipping.city'] }], [{ type: 'submitted', successful: false }]]);
  });

  it('reports a completed order', async () => {
    using subject = setup(order);
    await subject.form.submit.run();

    expect(subject.onTrack.mock.calls).toEqual([[{ type: 'submitted', successful: true }]]);
  });
});

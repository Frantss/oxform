import { createParts } from '@oxform/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { checkoutForm } from '../src/examples/checkout-form';
import { CountrySelect } from '../src/examples/country-select';
import { OrderSummary } from '../src/examples/order-summary';
import { setup } from './setup';

const { Root } = createParts(checkoutForm);

describe('OrderSummary', () => {
  it('shows the shipping price of the chosen country', async () => {
    await using screen = await setup(
      <Root>
        <CountrySelect aria-label='Country' />
        <OrderSummary />
      </Root>,
    );
    const shipping = screen.getByLabelText('Shipping');
    await expect.element(shipping).toHaveTextContent('Choose a country to see the shipping price.');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'France');

    await expect.element(shipping).toHaveTextContent('Shipping to France: €12.');
  });
});

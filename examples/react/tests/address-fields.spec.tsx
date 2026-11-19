import { createParts } from '@oxform/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Addresses } from '../src/examples/address-fields';
import { checkoutForm } from '../src/examples/checkout-form';
import { setup } from './setup';

const { Root } = createParts(checkoutForm);

describe('Addresses', () => {
  it('renders one block per address, and copies the billing address to the shipping address', async () => {
    await using screen = await setup(
      <Root>
        <Addresses />
      </Root>,
    );
    const billing = screen.getByRole('group', { name: 'Billing address' });
    const shipping = screen.getByRole('group', { name: 'Shipping address' });
    await userEvent.fill(billing.getByRole('textbox', { name: 'Street' }), '1 Main Street');
    await userEvent.fill(billing.getByRole('textbox', { name: 'City' }), 'London');
    await userEvent.fill(billing.getByRole('textbox', { name: 'Postal code' }), 'N1');
    await userEvent.click(screen.getByRole('button', { name: 'Ship to the billing address' }));

    await expect.element(shipping.getByRole('textbox', { name: 'City' })).toHaveValue('London');
    await expect.element(shipping.getByRole('textbox', { name: 'Street' })).toHaveAttribute('name', 'shipping.street');
  });
});

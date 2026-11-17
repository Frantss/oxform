import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Checkout } from '../src/examples/checkout';
import { setup } from './setup';

/** Fills the checkout with an order, with the given card number. */
const fill = async (screen: ReturnType<typeof setup>, card: string) => {
  await userEvent.fill(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com');
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'United Kingdom');
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Region' }), 'Wales');
  await userEvent.fill(screen.getByRole('textbox', { name: 'Card number' }), card);
  const billing = screen.getByRole('group', { name: 'Billing address' });
  await userEvent.fill(billing.getByRole('textbox', { name: 'Street' }), '1 Main Street');
  await userEvent.fill(billing.getByRole('textbox', { name: 'City' }), 'Cardiff');
  await userEvent.fill(billing.getByRole('textbox', { name: 'Postal code' }), 'CF10');
  await userEvent.click(screen.getByRole('button', { name: 'Ship to the billing address' }));
};

describe('Checkout', () => {
  it('refuses an empty order with a message on each field, also in the addresses', async () => {
    using screen = setup(() => <Checkout />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay' }));

    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription('Enter an email address.');
    await expect
      .element(screen.getByRole('group', { name: 'Shipping address' }).getByRole('textbox', { name: 'City' }))
      .toHaveAccessibleDescription('Enter a city.');
  });

  it('masks the card number, and shows the refusal of the bank on it', async () => {
    using screen = setup(() => <Checkout />);
    await fill(screen, '4000000000000002');
    const card = screen.getByRole('textbox', { name: 'Card number' });
    await expect.element(card).toHaveValue('4000 0000 0000 0002');
    await userEvent.click(screen.getByRole('button', { name: 'Pay' }));

    await expect.element(card).toHaveAccessibleDescription('The bank declined the card.');
  });

  it('pays a valid order', async () => {
    using screen = setup(() => <Checkout />);
    await fill(screen, '4242424242424242');
    await userEvent.click(screen.getByRole('button', { name: 'Pay' }));

    await expect.element(screen.getByRole('status')).toHaveTextContent('Thank you. The order is paid.');
  });

  it('clears the region when the country changes, and clears the form on "Clear"', async () => {
    using screen = setup(() => <Checkout />);
    await fill(screen, '4242424242424242');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'France');
    await expect.element(screen.getByRole('combobox', { name: 'Region' })).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('');
    await expect.element(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('');
  });
});

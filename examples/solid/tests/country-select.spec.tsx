import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { checkoutParts } from '../src/examples/checkout-form';
import { CountrySelect } from '../src/examples/country-select';
import { setup } from './setup';

const { Root, FieldError } = checkoutParts;

describe('CountrySelect', () => {
  it('renders the field slot in a select, with its error', async () => {
    using screen = setup(() => (
      <Root novalidate>
        <CountrySelect aria-label='Country' />
        <FieldError name='country' />
        <button type='submit'>Pay</button>
      </Root>
    ));
    const country = screen.getByRole('combobox', { name: 'Country' });
    await userEvent.click(screen.getByRole('button', { name: 'Pay' }));
    await expect.element(country).toHaveAttribute('aria-invalid', 'true');
    await userEvent.selectOptions(country, 'France');

    await expect.element(country).toHaveValue('FR');
  });
});

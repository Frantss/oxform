import { usePart, type PartProps } from '@oxform/react';
import { countries } from 'example-oxform-kit/schemas/checkout';
import { checkoutForm } from './checkout-form';

/** E30. The country is a `select`, and the `field` part renders an `input`, so this renders the slot in a `select`. */
export const CountrySelect = (props: PartProps<'select'>) =>
  usePart(
    checkoutForm,
    'field',
    { name: 'country' },
    {
      ...props,
      children: (
        <>
          <option value=''>Choose a country</option>
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </>
      ),
    },
    'select',
  );

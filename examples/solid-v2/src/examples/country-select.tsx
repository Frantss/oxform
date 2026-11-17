import { usePart, type PartProps } from '@oxform/solid/v2';
import { countries } from 'example-oxform-kit/schemas/checkout';
import { For, merge } from 'solid-js';
import { checkoutForm } from './checkout-form';

/** E30. The country is a `select`, and the `field` part renders an `input`, so this renders the slot in a `select`. */
export const CountrySelect = (props: PartProps<'select'>) =>
  usePart(
    checkoutForm,
    'field',
    { name: 'country' },
    merge(props, {
      children: (
        <>
          <option value=''>Choose a country</option>
          <For each={countries}>{country => <option value={country.code}>{country.name}</option>}</For>
        </>
      ),
    }),
    'select',
  );

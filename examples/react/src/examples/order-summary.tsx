import { createParts } from '@oxform/react';
import { countryOf } from 'example-oxform-kit/schemas/checkout';
import { checkoutForm } from './checkout-form';

const { useSelector } = createParts(checkoutForm);

/** E32. The summary reads the country only, so it renders again only when the country changes. */
export const OrderSummary = () => {
  const country = countryOf(useSelector(state => state.values.country));

  return (
    <p aria-label='Shipping'>
      {country === undefined
        ? 'Choose a country to see the shipping price.'
        : country.shipping === 0
          ? `Free shipping to ${country.name}.`
          : `Shipping to ${country.name}: €${country.shipping}.`}
    </p>
  );
};

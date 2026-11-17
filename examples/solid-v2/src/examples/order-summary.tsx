import { countryOf } from 'example-oxform-kit/schemas/checkout';
import { checkoutParts } from './checkout-form';

const { useSelector } = checkoutParts;

/** E32. The summary reads the country only, so it updates only when the country changes. */
export const OrderSummary = () => {
  const country = useSelector(state => countryOf(state.values.country));

  return (
    <p aria-label='Shipping'>
      {(() => {
        const current = country();
        if (current === undefined) return 'Choose a country to see the shipping price.';
        return current.shipping === 0
          ? `Free shipping to ${current.name}.`
          : `Shipping to ${current.name}: €${current.shipping}.`;
      })()}
    </p>
  );
};

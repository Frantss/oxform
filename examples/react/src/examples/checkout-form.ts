import { createParts } from '@oxform/react';
import { checkout } from 'example-oxform-kit/checkout';
import { masks } from 'example-oxform-kit/masks';
import { payOrder } from 'example-oxform-kit/payment-issues';

/** The checkout of the kit, with the card mask, and the payment on submit. */
export const checkoutForm = checkout
  .extend(masks)
  .configure({ masks: { 'card.number': '#### #### #### ####' }, onSubmit: payOrder });

export const checkoutParts = createParts(checkoutForm);

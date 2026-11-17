import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { checkoutSchema, emptyCheckout } from './schemas/checkout';

/** E03. A checkout uses arrays, reset, handles and every part, so it takes the `standard` preset. */
export const checkout = defineForm({ schema: checkoutSchema, defaultValues: emptyCheckout })
  .extend(standard)
  .configure({ error: { submit: checkoutSchema } });

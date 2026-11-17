import { defineForm } from '@oxform/core';
import { standard } from '@oxform/core/presets';
import { address } from './address';
import { emptyOrder, orderSchema } from './schemas/checkout';

/** E03. A checkout uses arrays, reset, handles and every part, so it takes the `standard` preset. */
export const checkout = defineForm({
  schema: orderSchema,
  defaultValues: emptyOrder,
  scopes: { billing: address, shipping: address },
})
  .extend(standard)
  .configure({ error: { submit: orderSchema } });

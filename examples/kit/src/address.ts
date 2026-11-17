import { defineScope, type Scope } from '@oxform/core';
import { addressSchema, emptyAddress, type Address } from './schemas/checkout';

/**
 * E15. The billing and the shipping address are the same block with the same rules. The scope has no place: the
 * checkout places it twice, and its `error` validators run at each place.
 */
export const address = defineScope({
  schema: addressSchema,
  defaultValues: emptyAddress,
  checks: { error: { submit: addressSchema } },
});

const addressFields = Object.keys(emptyAddress) as (keyof Address)[];

/** "Same as billing": copies one address to another, wherever each one is placed. */
export const copyAddress = (from: Scope<Address, 'error'>, to: Scope<Address, 'error'>) => {
  for (const name of addressFields) to.field(name).change(from.field(name).get());
};

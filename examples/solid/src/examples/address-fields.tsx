import { createParts } from '@oxform/solid';
import type { Scope } from '@oxform/core';
import { copyAddress } from 'example-oxform-kit/address';
import type { Address } from 'example-oxform-kit/schemas/checkout';
import { checkoutForm } from './checkout-form';

const { Field, FieldError, useScope } = createParts(checkoutForm);

/** E31. One block for any address: its fields take the scope, so their names are paths of the address. */
export const AddressFields = (props: { readonly scope: Scope<Address, 'error'>; readonly legend: string }) => (
  <fieldset>
    <legend>{props.legend}</legend>
    <label>
      Street
      <Field scope={props.scope} name='street' autocomplete='street-address' />
    </label>
    <FieldError scope={props.scope} name='street' />
    <label>
      City
      <Field scope={props.scope} name='city' autocomplete='address-level2' />
    </label>
    <FieldError scope={props.scope} name='city' />
    <label>
      Postal code
      <Field scope={props.scope} name='postalCode' autocomplete='postal-code' />
    </label>
    <FieldError scope={props.scope} name='postalCode' />
  </fieldset>
);

export const Addresses = () => {
  const billing = useScope('billing');
  const shipping = useScope('shipping');

  return (
    <>
      <AddressFields scope={billing} legend='Billing address' />
      <button type='button' onClick={() => copyAddress(billing, shipping)}>
        Ship to the billing address
      </button>
      <AddressFields scope={shipping} legend='Shipping address' />
    </>
  );
};

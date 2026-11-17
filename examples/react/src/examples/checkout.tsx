import { clearRegionOnCountryChange } from 'example-oxform-kit/region';
import { countryOf } from 'example-oxform-kit/schemas/checkout';
import { useEffect } from 'react';
import { Addresses } from './address-fields';
import { checkoutParts } from './checkout-form';
import { CountrySelect } from './country-select';
import { OrderSummary } from './order-summary';

const { Root, Field, FieldError, Submit, Reset, useForm, useSelector } = checkoutParts;

/** E21: a change of country clears the region, for as long as the form is shown. */
const RegionSelect = () => {
  const form = useForm();
  const country = countryOf(useSelector(state => state.values.country));
  useEffect(() => clearRegionOnCountryChange(form), [form]);

  return (
    <Field
      name='region'
      render={props => (
        <select {...props}>
          <option value=''>Choose a region</option>
          {country?.regions.map(region => (
            <option key={region}>{region}</option>
          ))}
        </select>
      )}
    />
  );
};

const Paid = () => {
  const paid = useSelector(state => state.status.form.submits > 0 && state.status.form.successful);
  return paid ? <p role='status'>Thank you. The order is paid.</p> : null;
};

/** E03, with E11, E15, E20, E21 and E30 to E32. */
export const Checkout = () => (
  <Root aria-label='Checkout' noValidate>
    <label>
      Email
      <Field name='email' type='email' autoComplete='email' />
    </label>
    <FieldError name='email' />
    <label>
      Country
      <CountrySelect />
    </label>
    <FieldError name='country' />
    <label>
      Region
      <RegionSelect />
    </label>
    <FieldError name='region' />
    <label>
      Card number
      <Field name='card.number' inputMode='numeric' autoComplete='cc-number' />
    </label>
    <FieldError name='card.number' />
    <Addresses />
    <OrderSummary />
    <Submit>{state => (state.submitting ? 'Paying…' : 'Pay')}</Submit>
    <Reset>Clear</Reset>
    <Paid />
  </Root>
);

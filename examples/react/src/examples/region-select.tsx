import { createParts } from '@oxform/react';
import { clearRegionOnCountryChange } from 'example-oxform-kit/region';
import { countryOf } from 'example-oxform-kit/schemas/checkout';
import { useEffect } from 'react';
import { checkoutForm } from './checkout-form';

const { Field, useForm, useSelector } = createParts(checkoutForm);

/** E21. The regions of the chosen country. A change of country clears the region, for as long as the select is shown. */
export const RegionSelect = () => {
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

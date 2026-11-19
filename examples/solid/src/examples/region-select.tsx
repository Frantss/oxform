import { createParts } from '@oxform/solid';
import { clearRegionOnCountryChange } from 'example-oxform-kit/region';
import { countryOf } from 'example-oxform-kit/schemas/checkout';
import { For, onCleanup } from 'solid-js';
import { checkoutForm } from './checkout-form';

const { Field, useForm, useSelector } = createParts(checkoutForm);

/** E21. The regions of the chosen country. A change of country clears the region, for as long as the select is shown. */
export const RegionSelect = () => {
  const form = useForm();
  const regions = useSelector(state => countryOf(state.values.country)?.regions ?? []);
  onCleanup(clearRegionOnCountryChange(form));

  return (
    <Field
      name='region'
      render={props => (
        <select {...props}>
          <option value=''>Choose a region</option>
          <For each={regions()}>{region => <option>{region}</option>}</For>
        </select>
      )}
    />
  );
};

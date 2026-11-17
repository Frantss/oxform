import type { InstanceOf, Unsubscribe } from '@oxform/core';
import type { checkout } from './checkout';

/**
 * E21. A change of country makes the region invalid, so the region is cleared when the country changes. It returns
 * the function that stops it.
 */
export const clearRegionOnCountryChange = (form: InstanceOf<typeof checkout>): Unsubscribe =>
  form.values.onChange(change => {
    if (change.path === 'country' && form.values.get('region') !== '') form.values.set('region', '');
  });

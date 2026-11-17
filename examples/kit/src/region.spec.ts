import { describe, expect, it } from 'vite-plus/test';
import { checkout } from './checkout';
import { clearRegionOnCountryChange } from './region';
import { emptyCheckout } from './schemas/checkout';

const setup = () => {
  const form = checkout.create({ defaultValues: { ...emptyCheckout, country: 'GB', region: 'London' } });
  const stop = clearRegionOnCountryChange(form);
  return {
    form,
    stop,
    [Symbol.dispose]: () => {
      stop();
      form.destroy();
    },
  };
};

describe('clearRegionOnCountryChange', () => {
  it('clears the region when the country changes', () => {
    using subject = setup();
    subject.form.values.set('country', 'FR');

    expect(subject.form.values.get('region')).toBe('');
  });

  it('keeps a region that the user chose after the country', () => {
    using subject = setup();
    subject.form.values.set('country', 'FR');
    subject.form.values.set('region', 'Bretagne');

    expect(subject.form.values.get('region')).toBe('Bretagne');
  });

  it('stops when the caller stops it', () => {
    using subject = setup();
    subject.stop();
    subject.form.values.set('country', 'FR');

    expect(subject.form.values.get('region')).toBe('London');
  });
});

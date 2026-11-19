import { describe, expect, it } from 'vite-plus/test';
import { checkout } from './checkout';
import { masks } from './masks';

const masked = checkout.extend(masks).configure({ masks: { 'card.number': '#### #### #### ####' } });

const setup = (definition = masked) => {
  const form = definition.create();
  return { form, [Symbol.dispose]: () => form.destroy() };
};

describe('masks', () => {
  it('formats a card number as the user types', () => {
    using subject = setup();
    subject.form.field('card.number').change('42424242424');

    expect(subject.form.values.get('card.number')).toBe('4242 4242 424');
  });

  it('gives the digits only from unmasked', () => {
    using subject = setup();
    subject.form.field('card.number').change('4242424242424242');

    expect(subject.form.field('card.number').unmasked()).toBe('4242424242424242');
  });

  it('adds unmasked to string fields only', () => {
    using subject = setup();
    // @ts-expect-error A mask has no meaning on an object.
    void subject.form.field('billing').unmasked;

    expect(['unmasked' in subject.form.field('email'), 'unmasked' in subject.form.field('billing')]).toEqual([true, false]);
  });

  it('takes a mask only at a path of the form', () => {
    // @ts-expect-error `card.nmber` is not a path of the checkout.
    const misspelled = checkout.extend(masks).configure({ masks: { 'card.nmber': '#### ####' } });
    using subject = setup(misspelled);
    subject.form.field('card.number').change('42424242');

    expect(subject.form.values.get('card.number')).toBe('42424242');
  });
});

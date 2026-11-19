import { defineExtension, on, optionTypes, type Extendable, type Needs, type Path } from '@oxform/core';

const digitsOf = (text: string) => text.replace(/\D/gu, '');

/** Each `#` of the mask takes the next digit. A fixed character shows only while more digits follow. */
const applyMask = (mask: string, text: string) => {
  const digits = digitsOf(text);
  let masked = '';
  let used = 0;
  for (const symbol of mask) {
    if (used >= digits.length) break;
    masked += symbol === '#' ? digits[used++] : symbol;
  }
  return masked;
};

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * E11. A card number shows as `4242 4242 …`, and the payment provider needs digits only. `masks` formats each
 * string written at a path of the `masks` option, and adds `unmasked()` to string fields. A mask has no meaning on
 * another value, so the guard of `on` keeps the member off those fields.
 */
export const masks = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'field'>>) =>
  defineExtension(form, {
    name: 'masks',
    needs: { api: ['values', 'field'] },
    options: optionTypes<{ masks: Readonly<Partial<Record<Path<Values>, string>>> }>(),
    api: (context, { values }) => {
      values.intercept(change => {
        const mask = context.options().masks?.[change.path];
        return mask !== undefined && isString(change.value)
          ? { ...change, value: applyMask(mask, change.value) }
          : undefined;
      });
      return {};
    },
    fields: on(isString)(field => ({ unmasked: () => digitsOf(field.get()) })),
  });

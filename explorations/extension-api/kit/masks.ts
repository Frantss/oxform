import type { Extendable, Needs, Path } from '../spike/src/api';
import { defineExtension, on, option } from '../spike/src/form';

const digitsOf = (text: string) => text.replace(/\D/g, '');

/** `#` takes the next digit. Fixed characters appear only while more digits follow. */
const applyMask = (mask: string, text: string) => {
  const digits = digitsOf(text);
  let result = '';
  let used = 0;
  for (const symbol of mask) {
    if (used >= digits.length) break;
    if (symbol === '#') result += digits[used++];
    else result += symbol;
  }
  return result;
};

/**
 * Formats a field as the user types, from the `masks` option (a pattern per path). Adds `field.unmasked()` to
 * string fields, which returns the digits only.
 */
export const masks = <Values>(form: Extendable<Values, Needs<Values, 'values' | 'field'>>) =>
  defineExtension(form, {
    name: 'masks',
    options: { masks: option.value<{ readonly [P in Path<Values>]?: string }>() },
    api: (ctx, { values }) => {
      values.intercept(change => {
        const mask = ctx.options().masks?.[change.path as Path<Values>];
        if (mask === undefined || typeof change.value !== 'string') return;
        return { ...change, value: applyMask(mask, change.value) };
      });
      return {};
    },
    fields: on<string>((value): value is string => typeof value === 'string')(field => ({
      unmasked: () => digitsOf(field.get()),
    })),
  });

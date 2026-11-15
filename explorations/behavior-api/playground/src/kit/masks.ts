import type { FormKind, Path, PathValue, ValuesApi } from '../../../api';
import { defineExtension } from '../../../spike/src/form';

type MaskOptions<Values> = { readonly masks?: { readonly [P in Path<Values>]?: string } };
type MaskExtras<Values, P> =
  P extends Path<Values> ? (PathValue<Values, P> extends string ? { unmasked(): string } : {}) : {};

interface MaskKind extends FormKind {
  readonly options: MaskOptions<this['values']>;
  readonly fieldExtras: MaskExtras<this['values'], this['path']>;
}

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
export const withMasks = defineExtension<{ values: ValuesApi<any>; field: (path: never) => unknown }, MaskKind>({
  name: 'masks',
  options: { masks: 'value' },
  api: (ctx, { values }) => {
    values.intercept(change => {
      const mask = ctx.options().masks?.[change.path];
      if (mask === undefined || typeof change.value !== 'string') return;
      return { ...change, value: applyMask(mask, change.value) };
    });
    return {};
  },
  fieldExtras: (_path, field) =>
    typeof field.get() === 'string' ? { unmasked: () => digitsOf(String(field.get())) } : {},
});

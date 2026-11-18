import { defineExtension, type Extendable, type Needs } from '@oxform/core';

/**
 * After the first submit, each change validates its field with the validators of `submit`. Oxform has no option
 * for this, so the Oxform versions add it as an extension (`readme.md`).
 */
export const revalidateAfterSubmit = <Values>(
  form: Extendable<Values, Needs<Values, 'values' | 'validation' | 'status'>>,
) =>
  defineExtension(form, {
    name: 'revalidateAfterSubmit',
    needs: { api: ['values', 'validation', 'status'] },
    api: (_context, { values, validation, status }) => {
      values.onChange(change => {
        if (status.form.submitted) void validation.run(change.path as never, { type: 'submit' });
      });
      return {};
    },
  });

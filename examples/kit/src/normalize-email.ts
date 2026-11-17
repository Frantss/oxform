import { defineExtension, type Extendable, type Needs } from '@oxform/core';

const isEmailPath = (path: string) => path === 'email' || path.endsWith('.email');

/**
 * E08. Emails pasted from a spreadsheet have spaces and capitals, so lookups fail. `normalizeEmail` trims and
 * lower-cases each string written at a path that ends in `email`. It adds no api.
 */
export const normalizeEmail = <Values>(form: Extendable<Values, Needs<Values, 'values'>>) =>
  defineExtension(form, {
    name: 'normalizeEmail',
    needs: { api: ['values'] },
    api: (_context, { values }) => {
      values.intercept(change =>
        isEmailPath(change.path) && typeof change.value === 'string'
          ? { ...change, value: change.value.trim().toLowerCase() }
          : undefined,
      );
      return {};
    },
  });

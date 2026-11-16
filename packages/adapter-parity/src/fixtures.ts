import { defineForm } from '@oxform/core';

export const fixtures = {
  empty: () =>
    defineForm({
      schema: { '~standard': { version: 1, vendor: 'test', validate: (value: unknown) => ({ value }) } },
      defaultValues: {},
    }),
};

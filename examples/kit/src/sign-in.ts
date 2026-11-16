import { defineForm } from '@oxform/core';
import { values } from '@oxform/core/behaviors';

export const signInForm = defineForm({
  schema: { '~standard': { version: 1, vendor: 'test', validate: (value: unknown) => ({ value }) } },
  defaultValues: {},
}).extend(values);

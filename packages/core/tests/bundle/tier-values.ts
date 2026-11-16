import { defineForm } from '@oxform/core';
import { values } from '@oxform/core/behaviors';

const schemaOf = <Values>() => ({
  '~standard': { version: 1 as const, vendor: 'test', validate: (value: unknown) => ({ value: value as Values }) },
});

export const form = defineForm({ schema: schemaOf<object>(), defaultValues: {} }).extend(values);

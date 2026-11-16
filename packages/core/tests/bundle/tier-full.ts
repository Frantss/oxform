import { defineForm } from '@oxform/core';
import { rootSlots } from '@oxform/core/behaviors';
import { standard } from '@oxform/core/presets';

const schemaOf = <Values>() => ({
  '~standard': { version: 1 as const, vendor: 'test', validate: (value: unknown) => ({ value: value as Values }) },
});

export const form = defineForm({ schema: schemaOf<object>(), defaultValues: {} }).extend(standard);
export const slots = rootSlots;

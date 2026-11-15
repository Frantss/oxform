import type { StandardSchemaV1 } from '@standard-schema/spec';
import { check } from './check';
import { defineForm } from './form';
import { validation } from './validation';
import { values } from './values';

/**
 * The lean example form: values, validation and one blocking `error` check. Nothing else, so it also shows what a
 * form that leaves out status, events, arrays, reset and submit costs.
 */
export const spikeForm = <Values>(init: {
  readonly schema: StandardSchemaV1<Values>;
  readonly defaultValues: Values;
}) =>
  defineForm({ name: 'spike', ...init })
    .extend(values)
    .extend(validation)
    .extend(check('error', { blocking: true, exclusive: true }));

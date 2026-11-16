import type { StandardSchemaV1 } from '@standard-schema/spec';
import { defineExtension, type Extendable } from '#core';

/** A schema that accepts any value and carries `Values` for inference. */
export const schemaOf = <Values>(): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'oxform-test', validate: value => ({ value: value as Values }) },
});

/** An extension with the given name and no behavior. */
export const named =
  (name: string) =>
  <Values>(form: Extendable<Values>) =>
    defineExtension(form, { name, api: () => ({}) });

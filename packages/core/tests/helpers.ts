import type { StandardSchemaV1 } from '@standard-schema/spec';

/** A schema that accepts any value and carries `Values` for inference. */
export const schemaOf = <Values>(): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'oxform-test', validate: value => ({ value: value as Values }) },
});

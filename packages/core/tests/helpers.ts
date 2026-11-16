import type { StandardSchemaV1 } from '@standard-schema/spec';

/** A schema that accepts any value and carries `Values` for inference. */
export const schemaOf = <Values>(): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'oxform-test', validate: value => ({ value: value as Values }) },
});

export type TestIssue = { readonly message: string; readonly path?: readonly (PropertyKey | { key: PropertyKey })[] };

/** A schema that always reports `issues`. */
export const reporting = (...issues: TestIssue[]): StandardSchemaV1<never> => ({
  '~standard': { version: 1, vendor: 'oxform-test', validate: () => ({ issues }) },
});

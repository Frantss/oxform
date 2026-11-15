import type { StandardSchemaV1 } from '@standard-schema/spec';

/** A schema that accepts anything, so the tiers measure the library and not a validator. */
export const acceptAll = <Values>(): StandardSchemaV1<Values> => ({
  '~standard': { version: 1, vendor: 'bundle', validate: value => ({ value: value as Values }) },
});

export type Login = { email: string; password: string };
export const loginDefaults: Login = { email: '', password: '' };

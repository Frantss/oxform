import type { StandardSchemaV1 } from '@standard-schema/spec';

export type { StandardSchemaV1 as StandardSchema };
export type EventLike = { target?: { value: any } };
export type ArrayLike = any[] | undefined | null;
export type { PartialDeep, Simplify } from 'type-fest';

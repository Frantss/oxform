import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { UnknownRecord } from 'type-fest';

export type SchemaLike = StandardSchemaV1<UnknownRecord>;
export type EventLike = { target?: { value: any } };

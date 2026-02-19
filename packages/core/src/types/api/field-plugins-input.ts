import type { FieldPlugin } from '#types/api/field-plugin';

export type FieldPluginsInput<Value> = FieldPlugin<Value, any> | readonly FieldPlugin<Value, any>[];

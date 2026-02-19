import type { FieldResetKeepOptions } from '#types/api/field-reset-keep-options';
import type { FieldResetMeta } from '#types/api/field-reset-meta';

export type FormResetFieldOptions<Value> = {
  value?: Value;
  meta?: FieldResetMeta;
  keep?: FieldResetKeepOptions;
};

import type { FieldResetKeepOptions } from '#types/api/field-reset-keep-options';
import type { FieldResetStatus } from '#types/api/field-reset-status';

export type FormResetFieldOptions<Value> = {
  value?: Value;
  status?: FieldResetStatus;
  keep?: FieldResetKeepOptions;
};

import type { PersistedFormStatus } from '#types/internal/persisted-form-status';
import type { FormResetKeepOptions } from '#types/api/form-reset-keep-options';

export type FormResetOptions<Values> = {
  values?: Values;
  status?: Partial<PersistedFormStatus>;
  keep?: FormResetKeepOptions;
};

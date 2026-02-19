import type { PersistedFields } from '#utils/fields';
import type { PersistedFormStatus } from '#types/internal/persisted-form-status';

export type FormBaseStore<Values> = {
  values: Values;
  fields: PersistedFields;
  status: PersistedFormStatus;
};

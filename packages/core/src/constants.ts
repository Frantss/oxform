import type { PersistedFieldMeta } from '#types/internal/persisted-field-meta';
import type { PersistedFormStatus } from '#types/internal/persisted-form-status';

export const DEFAULT_FIELD_META = {
  blurred: false,
  touched: false,
  dirty: false,
} satisfies PersistedFieldMeta;

export const DEFAULT_FORM_STATUS = {
  submits: 0,
  submitting: false,
  validating: false,
  successful: false,
  dirty: false,
} satisfies PersistedFormStatus;

import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';
import type { PersistedFormStatus } from '#types/internal/persisted-form-status';

export const DEFAULT_FIELD_STATUS = {
  blurred: false,
  touched: false,
  dirty: false,
} satisfies PersistedFieldStatus;

export const DEFAULT_FORM_STATUS = {
  submits: 0,
  submitting: false,
  validating: false,
  successful: false,
  dirty: false,
} satisfies PersistedFormStatus;

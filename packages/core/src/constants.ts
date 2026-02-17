import type { PersistedFieldMeta, PersistedFormStatus } from '#types/internal';

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

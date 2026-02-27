import type { FormIssue } from '#types/api/form-issue';
import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';

export type FieldSetOptions = {
  status?: Partial<PersistedFieldStatus>;
  errors?: FormIssue[];
  ref?: HTMLElement | null;
};

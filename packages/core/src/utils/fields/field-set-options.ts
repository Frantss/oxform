import type { FormIssue } from '#types/api/form-issue';
import type { PersistedFieldMeta } from '#types/internal/persisted-field-meta';

export type FieldSetOptions = {
  meta?: Partial<PersistedFieldMeta>;
  errors?: FormIssue[];
  ref?: HTMLElement | null;
};

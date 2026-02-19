import type { FormIssue } from '#types/api/form-issue';
import type { PersistedFieldMeta } from '#types/internal/persisted-field-meta';

export type FieldEntry = {
  id: string;
  meta: PersistedFieldMeta;
  errors: FormIssue[];
  ref: HTMLElement | null;
};

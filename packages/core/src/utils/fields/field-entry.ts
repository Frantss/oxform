import type { FormIssue } from '#types/api/form-issue';
import type { PersistedFieldStatus } from '#types/internal/persisted-field-status';

export type FieldEntry = {
  id: string;
  status: PersistedFieldStatus;
  errors: FormIssue[];
  ref: HTMLElement | null;
};

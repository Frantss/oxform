import type { FieldMeta } from '#types/api/field-meta';
import type { FormIssue } from '#types/api/form-issue';

export type FieldState = {
  id: string;
  meta: FieldMeta;
  errors: FormIssue[];
  ref: HTMLElement | null;
};

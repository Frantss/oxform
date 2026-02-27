import type { FieldStatus } from '#types/api/field-status';
import type { FormIssue } from '#types/api/form-issue';

export type FieldState = {
  id: string;
  status: FieldStatus;
  errors: FormIssue[];
  ref: HTMLElement | null;
};

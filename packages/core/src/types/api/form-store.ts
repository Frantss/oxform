import type { FormIssue } from '#types/api/form-issue';
import type { FormStatus } from '#types/api/form-status';
import type { Fields as InternalFields } from '#types/internal/fields';

export type FormStore<Values> = {
  values: Values;
  fields: InternalFields<FormIssue>;
  status: FormStatus;
};

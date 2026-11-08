import type { FormIssuesByLevel } from '#types/api/form-issue-entry';
import type { FormStatus } from '#types/api/form-status';
import type { Fields as InternalFields } from '#types/internal/fields';

export type FormStore<Values, Level extends string = string> = {
  values: Values;
  issues: FormIssuesByLevel<Level>;
  fields: InternalFields<Level>;
  status: FormStatus<Level>;
};

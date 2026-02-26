import type { FormApi } from '#form/form-api';
import type { FormIssue } from '#types/api/form-issue';

export type FormSubmitErrorHandler<Values> = (issues: FormIssue[], form: FormApi<Values>) => void | Promise<void>;

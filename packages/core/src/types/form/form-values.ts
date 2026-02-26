import type { FormApi } from '#form/form-api';
import type { AnyFormApi } from '#types/form/any-form-api';

export type FormValues<Form extends AnyFormApi> = Form extends FormApi<infer Values> ? Values : never;

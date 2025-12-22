import type { FormApi } from '#form-api';
import type { AnyFormApi } from '#types/any-form';

export type FormValues<Form extends AnyFormApi> = Form extends FormApi<infer Values> ? Values : never;

import type { ArrayDeepKeys } from '#types/deep';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormValues } from '#types/form/form-values';

export type FormArrayFields<Form extends AnyFormApi> = ArrayDeepKeys<FormValues<Form>>;

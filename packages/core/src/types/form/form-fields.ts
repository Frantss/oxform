import type { DeepKeys } from '#types/deep';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormValues } from '#types/form/form-values';

export type FormFields<Form extends AnyFormApi> = DeepKeys<FormValues<Form>>;

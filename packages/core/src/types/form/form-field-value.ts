import type { DeepValue } from '#types/deep';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormFields } from '#types/form/form-fields';
import type { FormValues } from '#types/form/form-values';

export type FormFieldValue<Form extends AnyFormApi, Name extends FormFields<Form>> = DeepValue<FormValues<Form>, Name>;

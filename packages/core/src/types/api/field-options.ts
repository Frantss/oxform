import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormFields } from '#types/form/form-fields';

export type FieldOptions<Form extends AnyFormApi, Name extends FormFields<Form>> = {
  form: Form;
  name: Name;
};

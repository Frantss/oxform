import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormArrayFields } from '#types/form/form-array-fields';

export type ArrayFieldOptions<Form extends AnyFormApi, Name extends FormArrayFields<Form>> = {
  form: Form;
  name: Name;
};

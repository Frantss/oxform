import { FieldApi } from '#form/field-api';
import type { FieldOptions } from '#types/api/field-options';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormFieldExtra } from '#types/form/form-field-extra';
import type { FormFields } from '#types/form/form-fields';
import type { FormFieldValue } from '#types/form/form-field-value';

export const createField = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
) => {
  return new FieldApi(options) as unknown as FieldApi<FormFieldValue<Form, Name>, FormFieldExtra<Form, Name>>;
};

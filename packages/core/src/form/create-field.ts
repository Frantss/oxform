import { FieldApi } from '#form/field-api';
import type { FieldOptions } from '#types/api';
import type { AnyFormApi, FormFields, FormFieldValue } from '#types/form';

export const createField = <Form extends AnyFormApi, const Name extends FormFields<Form>>(
  options: FieldOptions<Form, Name>,
) => {
  return new FieldApi(options) as unknown as FieldApi<FormFieldValue<Form, Name>>;
};

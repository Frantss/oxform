import { ArrayFieldApi } from '#form/array-field-api';
import type { ArrayFieldOptions } from '#types/api';
import type { AnyFormApi, FormArrayFields, FormFieldValue } from '#types/form';
import type { ArrayLike } from '#types/misc';

export const createArrayField = <Form extends AnyFormApi, const Name extends FormArrayFields<Form>>(
  options: ArrayFieldOptions<Form, Name>,
) => {
  return new ArrayFieldApi(options) as unknown as ArrayFieldApi<FormFieldValue<Form, Name> & ArrayLike>;
};

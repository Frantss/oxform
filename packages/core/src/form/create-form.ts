import { FormApi } from '#form/form-api';
import type { FormOptions } from '#types/api/form-options';
import type { FormWithOptions } from '#types/api/form-with-options';

export const createForm = <Values, const With extends FormWithOptions<Values> = FormWithOptions<Values>>(
  options: FormOptions<Values, With>,
) => {
  return new FormApi(options);
};

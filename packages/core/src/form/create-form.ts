import { FormApi } from '#form/form-api';
import type { FormOptions, FormWithOptions } from '#types/api';

export const createForm = <Values, const With extends FormWithOptions<Values> = FormWithOptions<Values>>(
  options: FormOptions<Values, With>,
) => {
  return new FormApi(options);
};

import { FormApi } from '#form/form-api';
import type { FormOptions } from '#types/api';

export const createForm = <Values>(options: FormOptions<Values>) => {
  return new FormApi(options);
};

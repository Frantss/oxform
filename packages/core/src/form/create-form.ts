import type { FormOptions } from '#form-api.types';
import { FormApi } from '#form/form-api';

export const createForm = <Values>(options: FormOptions<Values>) => {
  return new FormApi(options);
};

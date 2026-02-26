import type { FormApi } from '#form/form-api';

export type FormSubmitSuccessHandler<Values> = (values: Values, form: FormApi<Values>) => void | Promise<void>;

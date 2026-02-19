import type { FormStore } from '#types/api/form-store';
import type { FormWithOptions } from '#types/api/form-with-options';
import type { DeepKeys } from '#types/deep';
import type { StandardSchemaV1 as StandardSchema } from '@standard-schema/spec';
import type { PartialDeep } from 'type-fest';

type FormValidatorSchema<Values> = StandardSchema<PartialDeep<Values>>;
type FormValidatorFunction<Values> = (store: FormStore<Values>) => FormValidatorSchema<Values>;
type FormValidator<Values> = FormValidatorSchema<Values> | FormValidatorFunction<Values>;

export type FormOptions<Values, With extends FormWithOptions<Values> = FormWithOptions<Values>> = {
  schema: StandardSchema<Values>;
  defaultValues: NoInfer<Values>;
  validate?: {
    change?: FormValidator<Values>;
    submit?: FormValidator<Values>;
    blur?: FormValidator<Values>;
    focus?: FormValidator<Values>;
  };
  related?: Record<DeepKeys<Values>, DeepKeys<Values>[]>;
  with?: With;
};

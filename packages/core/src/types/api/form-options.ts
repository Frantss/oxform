import type { FormStore } from '#types/api/form-store';
import type { DeepKeys } from '#types/deep';
import type { PersistedFieldMeta } from '#types/internal/persisted-field-meta';
import type { PersistedFormStatus } from '#types/internal/persisted-form-status';
import type { StandardSchemaV1 as StandardSchema } from '@standard-schema/spec';
import type { PartialDeep } from 'type-fest';

type FormValidatorSchema<Values> = StandardSchema<PartialDeep<Values>>;
type FormValidatorFunction<Values> = (store: FormStore<Values>) => FormValidatorSchema<Values>;
type FormValidator<Values> = FormValidatorSchema<Values> | FormValidatorFunction<Values>;

export type FormOptions<Values> = {
  schema: StandardSchema<Values>;
  defaultValues: NoInfer<Values>;
  defaultStatus?: Partial<PersistedFormStatus>;
  defaultFieldMeta?: Partial<Record<DeepKeys<Values> | '*', Partial<PersistedFieldMeta>>>;
  validate?: {
    change?: FormValidator<Values>;
    submit?: FormValidator<Values>;
    blur?: FormValidator<Values>;
    focus?: FormValidator<Values>;
  };
};

import { ArrayFieldApi } from '#form/array-field-api';
import type { AnyFormApi } from '#types/form/any-form-api';
import type { FormArrayFields } from '#types/form/form-array-fields';
import type { FormIssueLevels } from '#types/form/form-issue-levels';
import type { FormFieldValue } from '#types/form/form-field-value';
import type { ArrayLike } from '#types/misc/array-like';

type CreateArrayFieldForm<Options extends { form: unknown }> = Options['form'] extends AnyFormApi
  ? Options['form']
  : never;

type CreateArrayFieldName<Options extends { form: unknown; name: string }> = Options['name'] &
  FormArrayFields<CreateArrayFieldForm<Options>>;

type CreateArrayFieldValue<Options extends { form: unknown; name: string }> = Extract<
  FormFieldValue<CreateArrayFieldForm<Options>, CreateArrayFieldName<Options>>,
  ArrayLike
>;

type CreateArrayFieldOptions<Options extends { form: unknown; name: string }> = Options['form'] extends AnyFormApi
  ? Options & {
      name: CreateArrayFieldName<Options>;
    }
  : never;

export const createArrayField = <const Options extends { form: unknown; name: string }>(
  options: CreateArrayFieldOptions<Options>,
) => {
  return new ArrayFieldApi(options as { form: AnyFormApi; name: string }) as unknown as ArrayFieldApi<
    CreateArrayFieldValue<Options>,
    FormIssueLevels<CreateArrayFieldForm<Options>>
  >;
};

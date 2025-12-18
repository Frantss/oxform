import type { FieldChangeOptions } from '#/core/form-api.types';
import type { FormFieldApi } from '#/core/form-field-api';
import type { DeepKeysOfType, DeepValue, UnwrapOneLevelOfArray } from '#/core/more-types';
import type { StandardSchema } from '#/core/types';

export class FormArrayFieldApi<
  Schema extends StandardSchema<any>,
  Values extends StandardSchema.InferInput<Schema> = StandardSchema.InferInput<Schema>,
  ArrayField extends DeepKeysOfType<Values, any[] | null | undefined> = DeepKeysOfType<
    Values,
    any[] | null | undefined
  >,
> {
  private field: FormFieldApi<Schema>;

  constructor(field: FormFieldApi<Schema>) {
    this.field = field;
  }

  public append = <Name extends ArrayField>(
    name: Name,
    value: UnwrapOneLevelOfArray<DeepValue<Values, Name>>,
    options?: FieldChangeOptions,
  ) => {
    const current = this.field.get(name) as any[];
    return this.field.change(name, [...(current ?? []), value] as never, options);
  };
}

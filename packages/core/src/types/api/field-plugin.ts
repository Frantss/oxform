import type { AnyFormApi } from '#types/form/any-form-api';
import type { FieldExtra } from '#types/api/field-extra';
import type { FieldStore } from '#types/api/field-store';

export type FieldPlugin<Value, Extra extends FieldExtra> = (field: {
  value: Value;
  state: FieldStore<Value>;
  options: {
    form: AnyFormApi;
    name: string;
  };
}) => Extra;
